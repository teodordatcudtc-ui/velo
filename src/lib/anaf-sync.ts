import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anafApiDownload, anafApiGetJson, ensureAnafAccessToken, normalizeTaxCode, parseAnafMessageList } from "@/lib/anaf";

const BUCKET = "uploads";
const ANAF_DOC_TYPE = "e-Factura SPV";
const CIRCUIT_BREAK_MINUTES = 30;
const FAILURE_THRESHOLD = 3;

type AnafConnRow = {
  accountant_id: string;
  enabled: boolean;
  company_cif: string | null;
  api_base_url: string;
  oauth_token_url: string;
  oauth_client_id: string;
  oauth_client_secret: string;
  oauth_refresh_token: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
  consecutive_failures: number;
  circuit_open_until: string | null;
};

type MappingRow = { client_id: string; tax_code: string };

async function upsertMessageReceipt(
  supabase: SupabaseClient,
  payload: {
    accountant_id: string;
    company_cif: string;
    message_id: string;
    partner_tax_code?: string | null;
    client_id?: string | null;
    upload_id?: string | null;
    file_path?: string | null;
    file_name?: string | null;
    status: "imported" | "unmapped" | "download_error" | "parse_error";
    detail?: string | null;
  }
) {
  await supabase.from("anaf_message_receipts").upsert(payload, {
    onConflict: "accountant_id,company_cif,message_id",
  });
}

function serverAuthFallback(conn: AnafConnRow): AnafConnRow {
  const envRt = process.env.ANAF_OAUTH_REFRESH_TOKEN?.trim();
  const dbRt = conn.oauth_refresh_token?.trim();
  return {
    ...conn,
    api_base_url: (process.env.ANAF_API_BASE_URL ?? conn.api_base_url).trim() || conn.api_base_url,
    oauth_token_url: (process.env.ANAF_OAUTH_TOKEN_URL ?? conn.oauth_token_url).trim() || conn.oauth_token_url,
    oauth_client_id: (process.env.ANAF_OAUTH_CLIENT_ID ?? conn.oauth_client_id).trim() || conn.oauth_client_id,
    oauth_client_secret:
      (process.env.ANAF_OAUTH_CLIENT_SECRET ?? conn.oauth_client_secret).trim() || conn.oauth_client_secret,
    oauth_refresh_token: envRt || dbRt || null,
  };
}

async function logSync(
  supabase: SupabaseClient,
  input: {
    accountantId: string;
    status: "success" | "partial" | "skipped" | "error";
    detail?: string;
    errorMessage?: string;
    importedCount?: number;
    skippedCount?: number;
  }
) {
  await (supabase as never as { from: (table: string) => { insert: (payload: Record<string, unknown>) => Promise<unknown> } })
    .from("anaf_sync_log")
    .insert({
      accountant_id: input.accountantId,
      status: input.status,
      detail: input.detail ?? null,
      error_message: input.errorMessage ?? null,
      imported_count: input.importedCount ?? 0,
      skipped_count: input.skippedCount ?? 0,
    });
}

async function setConnectionFailure(
  supabase: SupabaseClient,
  conn: AnafConnRow,
  errorMessage: string
) {
  const failures = (conn.consecutive_failures ?? 0) + 1;
  const shouldOpenCircuit = failures >= FAILURE_THRESHOLD;
  const circuitUntil = shouldOpenCircuit
    ? new Date(Date.now() + CIRCUIT_BREAK_MINUTES * 60_000).toISOString()
    : null;
  await supabase
    .from("anaf_connections")
    .update({
      consecutive_failures: failures,
      circuit_open_until: circuitUntil,
      last_error: errorMessage.slice(0, 500),
      last_error_at: new Date().toISOString(),
    })
    .eq("accountant_id", conn.accountant_id);
}

async function markConnectionSuccess(supabase: SupabaseClient, conn: AnafConnRow) {
  await supabase
    .from("anaf_connections")
    .update({
      consecutive_failures: 0,
      circuit_open_until: null,
      last_error: null,
      last_error_at: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq("accountant_id", conn.accountant_id);
}

async function ensureDocType(supabase: SupabaseClient, clientId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("document_types")
    .select("id")
    .eq("client_id", clientId)
    .eq("name", ANAF_DOC_TYPE)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: inserted, error } = await supabase
    .from("document_types")
    .insert({ client_id: clientId, name: ANAF_DOC_TYPE })
    .select("id")
    .single();
  if (error || !inserted?.id) return null;
  return inserted.id as string;
}

function parseListDays(): string {
  const raw = process.env.ANAF_LIST_DAYS;
  const val = Number(raw ?? "3");
  const safe = Number.isFinite(val) ? Math.min(60, Math.max(1, Math.floor(val))) : 3;
  return String(safe);
}

export async function syncAnafForAccountant(
  supabase: SupabaseClient,
  conn: AnafConnRow
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  conn = serverAuthFallback(conn);
  const errors: string[] = [];
  const unmappedPartners = new Set<string>();
  let imported = 0;
  let skipped = 0;
  const now = new Date();

  if (!conn.enabled) {
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "skipped",
      detail: "Integrarea ANAF este dezactivată.",
    });
    return { imported, skipped: skipped + 1, errors };
  }

  if (conn.circuit_open_until && new Date(conn.circuit_open_until).getTime() > Date.now()) {
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "skipped",
      detail: `Circuit breaker activ până la ${conn.circuit_open_until}.`,
      skippedCount: 1,
    });
    return { imported, skipped: skipped + 1, errors };
  }

  const companyCifNorm = normalizeTaxCode(conn.company_cif ?? "");
  if (!companyCifNorm) {
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "skipped",
      detail: "Completează CUI-ul firmei în Setări și salvează.",
      skippedCount: 1,
    });
    return {
      imported,
      skipped: skipped + 1,
      errors: ["Lipsește CUI-ul firmei în Setări."],
    };
  }

  const tokenResult = await ensureAnafAccessToken(conn);
  if (!tokenResult.ok) {
    await setConnectionFailure(supabase, conn, tokenResult.error);
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "error",
      errorMessage: tokenResult.error,
      skippedCount: 1,
    });
    return { imported, skipped: skipped + 1, errors: [tokenResult.error] };
  }

  if (tokenResult.refreshed) {
    await supabase
      .from("anaf_connections")
      .update({
        access_token: tokenResult.accessToken,
        access_token_expires_at: tokenResult.expiresAtIso,
        oauth_refresh_token: tokenResult.refreshToken,
      })
      .eq("accountant_id", conn.accountant_id);
  }

  const list = await anafApiGetJson<unknown>(
    conn.api_base_url,
    "listaMesajeFactura",
    tokenResult.accessToken,
    { cif: companyCifNorm, zile: parseListDays() }
  );
  if (!list.ok) {
    await setConnectionFailure(supabase, conn, list.error);
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "error",
      errorMessage: list.error,
      skippedCount: 1,
    });
    return { imported, skipped: skipped + 1, errors: [list.error] };
  }

  const messages = parseAnafMessageList(list.data);
  if (messages.length === 0) {
    await markConnectionSuccess(supabase, conn);
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: "success",
      detail: "Nu există mesaje noi în intervalul configurat.",
    });
    return { imported, skipped, errors };
  }

  const { data: mappings } = await supabase
    .from("anaf_client_tax_mappings")
    .select("client_id, tax_code")
    .eq("accountant_id", conn.accountant_id);
  const mappingMap = new Map<string, string>();
  for (const row of (mappings ?? []) as MappingRow[]) {
    mappingMap.set(normalizeTaxCode(row.tax_code), row.client_id);
  }

  for (const msg of messages) {
    const { data: existing } = await supabase
      .from("anaf_message_receipts")
      .select("id, status")
      .eq("accountant_id", conn.accountant_id)
      .eq("company_cif", companyCifNorm)
      .eq("message_id", msg.id)
      .maybeSingle();
    if (existing?.id && existing.status === "imported") {
      skipped++;
      continue;
    }

    const partner = msg.partnerTaxCode ? normalizeTaxCode(msg.partnerTaxCode) : "";
    const clientId = partner ? mappingMap.get(partner) ?? null : null;
    if (!clientId) {
      unmappedPartners.add(partner || "(fara_cui_partener)");
      await upsertMessageReceipt(supabase, {
        accountant_id: conn.accountant_id,
        company_cif: companyCifNorm,
        message_id: msg.id,
        partner_tax_code: partner || null,
        status: "unmapped",
        detail: "Lipsește maparea CUI/CIF partener -> client.",
      });
      skipped++;
      continue;
    }

    const downloaded = await anafApiDownload(conn.api_base_url, msg.id, tokenResult.accessToken);
    if (!downloaded.ok) {
      await upsertMessageReceipt(supabase, {
        accountant_id: conn.accountant_id,
        company_cif: companyCifNorm,
        message_id: msg.id,
        partner_tax_code: partner || null,
        client_id: clientId,
        upload_id: null,
        file_path: null,
        file_name: null,
        status: "download_error",
        detail: downloaded.error.slice(0, 500),
      });
      errors.push(`Mesaj ${msg.id}: ${downloaded.error}`);
      skipped++;
      continue;
    }

    const docTypeId = await ensureDocType(supabase, clientId);
    if (!docTypeId) {
      await upsertMessageReceipt(supabase, {
        accountant_id: conn.accountant_id,
        company_cif: companyCifNorm,
        message_id: msg.id,
        partner_tax_code: partner || null,
        client_id: clientId,
        upload_id: null,
        file_path: null,
        file_name: null,
        status: "parse_error",
        detail: "Nu pot crea/folosi tipul de document e-Factura SPV.",
      });
      skipped++;
      continue;
    }

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const fileName = `eFactura_${partner || "necunoscut"}_${msg.id}_${year}-${String(month).padStart(2, "0")}.zip`;
    const filePath = `${clientId}/${year}/${month}/${docTypeId}/anaf-${Date.now()}-${msg.id}.zip`;
    const fileBuffer = Buffer.from(downloaded.buffer);

    const uploadResult = await supabase.storage.from(BUCKET).upload(filePath, fileBuffer, {
      contentType: "application/zip",
      upsert: false,
    });
    if (uploadResult.error) {
      await upsertMessageReceipt(supabase, {
        accountant_id: conn.accountant_id,
        company_cif: companyCifNorm,
        message_id: msg.id,
        partner_tax_code: partner || null,
        client_id: clientId,
        upload_id: null,
        file_path: null,
        file_name: null,
        status: "download_error",
        detail: uploadResult.error.message.slice(0, 500),
      });
      errors.push(`Mesaj ${msg.id}: ${uploadResult.error.message}`);
      skipped++;
      continue;
    }

    const { data: insertedUpload, error: uploadInsertError } = await supabase
      .from("uploads")
      .insert({
        client_id: clientId,
        document_type_id: docTypeId,
        file_path: filePath,
        file_name: fileName,
        month,
        year,
      })
      .select("id")
      .single();

    if (uploadInsertError || !insertedUpload?.id) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      await upsertMessageReceipt(supabase, {
        accountant_id: conn.accountant_id,
        company_cif: companyCifNorm,
        message_id: msg.id,
        partner_tax_code: partner || null,
        client_id: clientId,
        upload_id: null,
        file_path: null,
        file_name: null,
        status: "parse_error",
        detail: uploadInsertError?.message?.slice(0, 500) ?? "Nu pot salva upload-ul în DB.",
      });
      skipped++;
      continue;
    }

    await upsertMessageReceipt(supabase, {
      accountant_id: conn.accountant_id,
      company_cif: companyCifNorm,
      message_id: msg.id,
      partner_tax_code: partner || null,
      client_id: clientId,
      upload_id: insertedUpload.id,
      file_path: filePath,
      file_name: fileName,
      status: "imported",
      detail: "Document importat din ANAF SPV.",
    });
    imported++;
  }

  if (unmappedPartners.size > 0) {
    const sample = Array.from(unmappedPartners).slice(0, 5).join(", ");
    errors.push(`Lipsesc mapari CUI/CIF partener -> client pentru: ${sample}.`);
  }

  if (errors.length > 0) {
    await setConnectionFailure(supabase, conn, errors[0]);
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: imported > 0 ? "partial" : "error",
      errorMessage: errors[0],
      importedCount: imported,
      skippedCount: skipped,
      detail: `Mesaje procesate: ${messages.length}`,
    });
  } else {
    await markConnectionSuccess(supabase, conn);
    await logSync(supabase, {
      accountantId: conn.accountant_id,
      status: skipped > 0 ? "partial" : "success",
      importedCount: imported,
      skippedCount: skipped,
      detail: `Mesaje procesate: ${messages.length}`,
    });
  }

  return { imported, skipped, errors };
}

export async function syncAllAnafConnections() {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase.from("anaf_connections").select(
    "accountant_id, enabled, company_cif, api_base_url, oauth_token_url, oauth_client_id, oauth_client_secret, oauth_refresh_token, access_token, access_token_expires_at, consecutive_failures, circuit_open_until"
  );
  if (error) throw new Error(error.message);

  let totalImported = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const row of (rows ?? []) as AnafConnRow[]) {
    try {
      const result = await syncAnafForAccountant(supabase, row);
      totalImported += result.imported;
      totalSkipped += result.skipped;
      for (const err of result.errors) {
        if (errors.length < 20) errors.push(`[${row.accountant_id}] ${err}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare necunoscută la sync";
      if (errors.length < 20) errors.push(`[${row.accountant_id}] ${msg}`);
    }
  }

  return {
    connections: (rows ?? []).length,
    imported: totalImported,
    skipped: totalSkipped,
    errors,
  };
}
