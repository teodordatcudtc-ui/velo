"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { generateUploadToken } from "@/lib/upload-token";
import { customAlphabet } from "nanoid";
import { Resend } from "resend";
import { getClientLimit, hasPremiumAccess } from "@/lib/subscription";

const fallbackAlphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const fallbackToken = customAlphabet(fallbackAlphabet, 20);

type ParsedCsvRow = {
  name: string;
  email: string | null;
  phone: string | null;
};

async function ensureAccountantExists(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();

  // Verificăm dacă există deja rândul în accountants
  const { data: existing } = await admin
    .from("accountants")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const metaName =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim();
  const emailFallback =
    (user.email ?? "").split("@")[0] || "Contabil";
  const name = metaName || emailFallback;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("accountants")
    .insert({ id: user.id, name });

  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    console.error("ensureAccountantExists insert error:", error);
  }
}

function buildFromWithAccountantName(accountantName: string | null | undefined): string {
  const base = process.env.RESEND_FROM ?? "Vello <noreply@vello.ro>";
  const name = accountantName?.trim();
  if (!name) return base;
  const match = base.match(/<(.+)>/);
  const address = match ? match[1] : base;
  return `${name} – Vello <${address}>`;
}

async function getAccountantPlanInfo(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: accountant, error } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until")
    .eq("id", userId)
    .single();

  if (error || !accountant) return null;
  return accountant;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseClientsCsv(csvText: string): ParsedCsvRow[] {
  const cleaned = csvText.replace(/\uFEFF/g, "").trim();
  if (!cleaned) return [];

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const firstCells = parseCsvLine(firstLine, delimiter);
  const headers = firstCells.map(normalizeHeader);

  const nameHeaders = new Set(["name", "nume", "client", "clientname", "firma", "company"]);
  const emailHeaders = new Set(["email", "mail", "emailaddress"]);
  const phoneHeaders = new Set(["phone", "telefon", "tel", "mobil", "mobile"]);

  const headerLooksValid = headers.some(
    (h) => nameHeaders.has(h) || emailHeaders.has(h) || phoneHeaders.has(h)
  );

  const startIndex = headerLooksValid ? 1 : 0;
  const nameIdx = headerLooksValid
    ? headers.findIndex((h) => nameHeaders.has(h))
    : 0;
  const emailIdx = headerLooksValid
    ? headers.findIndex((h) => emailHeaders.has(h))
    : 1;
  const phoneIdx = headerLooksValid
    ? headers.findIndex((h) => phoneHeaders.has(h))
    : 2;

  const rows: ParsedCsvRow[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const nameRaw = nameIdx >= 0 ? cols[nameIdx] ?? "" : "";
    const emailRaw = emailIdx >= 0 ? cols[emailIdx] ?? "" : "";
    const phoneRaw = phoneIdx >= 0 ? cols[phoneIdx] ?? "" : "";
    const name = nameRaw.trim();
    if (!name) continue;
    rows.push({
      name,
      email: emailRaw.trim() || null,
      phone: phoneRaw.trim() || null,
    });
  }

  return rows;
}

async function insertClientWithTokenFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: ParsedCsvRow
) {
  let unique_token = generateUploadToken(row.name.trim());
  const { error } = await supabase.from("clients").insert({
    accountant_id: userId,
    name: row.name.trim(),
    email: row.email,
    phone: row.phone,
    unique_token,
  });

  if (!error) return null;
  if (error.code !== "23505") return error.message;

  unique_token = `client-${fallbackToken()}`;
  const { error: retryError } = await supabase.from("clients").insert({
    accountant_id: userId,
    name: row.name.trim(),
    email: row.email,
    phone: row.phone,
    unique_token,
  });
  return retryError ? retryError.message : null;
}

export async function addClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  // Sigurăm existența rândului în `accountants` pentru acest user (altfel FK-ul pică la insert în clients)
  await ensureAccountantExists({
    id: user.id,
    email: user.email,
    // user_metadata poate avea structură variabilă; îl tratăm ca obiect generic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user_metadata: (user as any).user_metadata,
  });

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;

  if (!name?.trim()) return { error: "Numele este obligatoriu" };

  const accountant = await getAccountantPlanInfo(supabase, user.id);
  const isPremium = hasPremiumAccess(accountant);
  const limit = getClientLimit(accountant);
  if (!isPremium && limit != null) {
    const { count, error: countError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("accountant_id", user.id)
      .eq("archived", false);

    if (countError) return { error: countError.message };
    if ((count ?? 0) >= limit) {
      const msg =
        limit === 5
          ? "Planul gratuit permite maxim 5 clienți. Alege Standard sau Premium pentru mai mulți."
          : "Ai atins limita de 40 clienți pentru planul Standard. Upgrade la Premium pentru clienți nelimitați.";
      return { error: msg };
    }
  }

  let unique_token = generateUploadToken(name.trim());

  const { error } = await supabase.from("clients").insert({
    accountant_id: user.id,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    unique_token,
  });

  if (error) {
    if (error.code === "23505") {
      unique_token = `client-${fallbackToken()}`;
      const { error: retryError } = await supabase.from("clients").insert({
        accountant_id: user.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        unique_token,
      });
      if (retryError) return { error: retryError.message };
    } else {
      return { error: error.message };
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function importClientsFromCsv(csvText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  await ensureAccountantExists({
    id: user.id,
    email: user.email,
    // eslint-disable-next-line @typescript-eslint/no-explicitany
    user_metadata: (user as any).user_metadata,
  });

  if (!csvText?.trim()) return { error: "Fișierul CSV este gol." };

  const rows = parseClientsCsv(csvText);
  if (rows.length === 0) {
    return { error: "Nu am găsit rânduri valide. Folosește coloane: name,nume,email,telefon." };
  }

  const accountant = await getAccountantPlanInfo(supabase, user.id);
  const isPremium = hasPremiumAccess(accountant);
  const limit = getClientLimit(accountant);

  let availableSlots = Number.POSITIVE_INFINITY;
  if (!isPremium && limit != null) {
    const { count, error: countError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("accountant_id", user.id)
      .eq("archived", false);

    if (countError) return { error: countError.message };
    availableSlots = Math.max(0, limit - (count ?? 0));
    if (availableSlots === 0) {
      const msg =
        limit === 5
          ? "Planul gratuit permite maxim 5 clienți. Alege Standard sau Premium pentru mai mulți."
          : "Ai atins limita de 40 clienți pentru planul Standard. Upgrade la Premium pentru clienți nelimitați.";
      return { error: msg };
    }
  }

  const toImport = rows.slice(0, availableSlots);
  const skippedByLimit = rows.length - toImport.length;

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of toImport) {
    const err = await insertClientWithTokenFallback(supabase, user.id, row);
    if (err) {
      failed++;
      if (errors.length < 5) errors.push(`${row.name}: ${err}`);
    } else {
      imported++;
    }
  }

  if (imported > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clienti");
  }

  return {
    ok: true,
    imported,
    failed,
    skippedByLimit,
    limit: getClientLimit(accountant),
    errors,
  };
}

export async function updateClient(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (!client) return { error: "Client negăsit." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Numele este obligatoriu" };

  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  const { error } = await supabase
    .from("clients")
    .update({ name, email, phone })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export type DocumentRequestData = {
  sendDate: string;
  methods: string[];
  docTypes: string[];
  message: string;
  reminderAfter3Days: boolean;
};

type ImmediateDocumentRequestData = {
  delivery: "manual" | "email";
  docTypes: string[];
  message: string;
  reminderAfter3Days: boolean;
};

async function ensureDocumentTypesExist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  docTypes: string[]
) {
  const { data: existingTypes } = await supabase
    .from("document_types")
    .select("name")
    .eq("client_id", clientId);

  const existingNames = new Set((existingTypes ?? []).map((t) => t.name));
  for (const name of docTypes) {
    const trimmed = name?.trim();
    if (!trimmed || existingNames.has(trimmed)) continue;
    const { error: insertErr } = await supabase
      .from("document_types")
      .insert({ client_id: clientId, name: trimmed });
    if (!insertErr) existingNames.add(trimmed);
  }
}

async function upsertDocumentRequestForPeriod(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: {
    clientId: string;
    accountantId: string;
    month: number;
    year: number;
    channel: string;
    docTypeNames: string[];
    message: string | null;
    reminderAfter3Days: boolean;
    sentAt: string;
  }
) {
  const { data: existing, error: existingError } = await supabase
    .from("document_requests")
    .select("id")
    .eq("client_id", payload.clientId)
    .eq("accountant_id", payload.accountantId)
    .eq("month", payload.month)
    .eq("year", payload.year)
    .order("sent_at", { ascending: false });

  if (existingError) return { error: existingError.message };

  if (!existing || existing.length === 0) {
    const { error } = await supabase.from("document_requests").insert({
      client_id: payload.clientId,
      accountant_id: payload.accountantId,
      month: payload.month,
      year: payload.year,
      channel: payload.channel,
      doc_type_names: payload.docTypeNames,
      message: payload.message,
      reminder_after_3_days: payload.reminderAfter3Days,
      sent_at: payload.sentAt,
      reminder_sent_at: null,
    });
    if (error) return { error: error.message };
    return { ok: true as const };
  }

  const keepId = existing[0].id;
  const { error: updateError } = await supabase
    .from("document_requests")
    .update({
      channel: payload.channel,
      doc_type_names: payload.docTypeNames,
      message: payload.message,
      reminder_after_3_days: payload.reminderAfter3Days,
      sent_at: payload.sentAt,
      reminder_sent_at: null,
    })
    .eq("id", keepId);

  if (updateError) return { error: updateError.message };

  if (existing.length > 1) {
    const dupIds = existing.slice(1).map((r) => r.id);
    await supabase.from("document_requests").delete().in("id", dupIds);
  }

  return { ok: true as const };
}

export async function saveDocumentRequest(
  clientId: string,
  data: DocumentRequestData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (!client) return { error: "Client negăsit." };

  await ensureDocumentTypesExist(supabase, clientId, data.docTypes);

  // Parse date parts directly to avoid timezone shifts
  const [sendYear, sendMonth, sendDay] = data.sendDate.split("-").map(Number);
  const month = sendMonth;
  const year = sendYear;
  // We store scheduled requests with a distinct channel so cron can safely pick them up once.
  // When cron actually sends, it will flip the channel to "email".
  const channel = data.methods[0] === "manual" ? "manual" : "email_scheduled";
  // Store at noon UTC so the date is the same in all timezones (UTC-11 to UTC+12)
  const scheduledIso = `${data.sendDate}T12:00:00.000Z`;

  // 1) Delete all future requests for this client using admin client to bypass RLS.
  const adminForDelete = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminForDelete as any)
    .from("document_requests")
    .delete()
    .eq("client_id", clientId)
    .gte("sent_at", new Date().toISOString());

  // 2) Inserăm cererea programată pentru data aleasă.
  const upsert = await upsertDocumentRequestForPeriod(supabase, {
    clientId,
    accountantId: user.id,
    month,
    year,
    channel,
    docTypeNames: data.docTypes,
    message: data.message || null,
    reminderAfter3Days: data.reminderAfter3Days,
    sentAt: scheduledIso,
  });
  if ("error" in upsert) return { error: upsert.error };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function sendDocumentRequestNow(
  clientId: string,
  data: ImmediateDocumentRequestData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, unique_token")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();
  if (!client) return { error: "Client negăsit." };

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", user.id)
    .single();

  await ensureDocumentTypesExist(supabase, clientId, data.docTypes);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const upsert = await upsertDocumentRequestForPeriod(supabase, {
    clientId,
    accountantId: user.id,
    month,
    year,
    channel: data.delivery,
    docTypeNames: data.docTypes,
    message: data.message || null,
    reminderAfter3Days: data.reminderAfter3Days,
    sentAt: now.toISOString(),
  });
  if ("error" in upsert) return { error: upsert.error };

  if (data.delivery === "email") {
    if (!client.email?.trim()) {
      return { error: "Clientul nu are email setat." };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { error: "RESEND_API_KEY lipsește. Configurează Resend în .env.local." };
    }

    const resend = new Resend(apiKey);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const uploadLink = `${baseUrl}/upload/${client.unique_token}`;
    const accountantName = accountant?.name ?? "Contabil";

    const docsHtml =
      data.docTypes.length > 0
        ? `<ul>${data.docTypes.map((d) => `<li>${d}</li>`).join("")}</ul>`
        : "<p>Documentele obișnuite pentru luna curentă.</p>";

    const customMessage = data.message?.trim()
      ? `<p><strong>Mesaj:</strong> ${data.message.trim()}</p>`
      : "";

    const { error: sendError } = await resend.emails.send({
      from: buildFromWithAccountantName(accountantName),
      to: client.email,
      subject: `Cerere documente - ${accountantName}`,
      html: `
        <p>Bună ziua, ${client.name},</p>
        <p>${accountantName} vă solicită documentele pentru perioada curentă.</p>
        ${docsHtml}
        ${customMessage}
        <p>Puteți încărca documentele aici:</p>
        <p><a href="${uploadLink}" style="color:#4b7a6e;font-weight:600">${uploadLink}</a></p>
        <p>Mulțumim,<br/>Echipa Vello</p>
      `,
    });
    if (sendError) return { error: sendError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function addDocumentType(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Numele documentului este obligatoriu" };

  const { error } = await supabase.from("document_types").insert({
    client_id: clientId,
    name: name.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeDocumentType(documentTypeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("document_types")
    .delete()
    .eq("id", documentTypeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client negăsit sau nu ai dreptul să îl ștergi." };
  }

  const { error } = await supabase
    .from("clients")
    .update({ archived: true })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function restoreClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client negăsit sau nu ai dreptul să îl restaurezi." };
  }

  const accountant = await getAccountantPlanInfo(supabase, user.id);
  const isPremium = hasPremiumAccess(accountant);
  const limit = getClientLimit(accountant);
  if (!isPremium && limit != null) {
    const { count, error: countError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("accountant_id", user.id)
      .eq("archived", false);

    if (countError) return { error: countError.message };
    if ((count ?? 0) >= limit) {
      const msg =
        limit === 5
          ? "Nu poți restaura: planul gratuit permite maxim 5 clienți."
          : "Nu poți restaura clientul: ai deja 40 clienți activi pe planul Standard.";
      return { error: msg };
    }
  }

  const { error } = await supabase
    .from("clients")
    .update({ archived: false })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

export async function updateClientReminder(
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const accountant = await getAccountantPlanInfo(supabase, user.id);
  if (!hasPremiumAccess(accountant)) {
    return {
      error:
        "Funcția de reminder automat este disponibilă doar pe planul Premium.",
    };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (!client) return { error: "Client negăsit." };

  const enabled =
    formData.get("reminder_enabled") === "on" ||
    formData.get("reminder_enabled") === "true";
  const dayRaw = formData.get("reminder_day_of_month") as string | null;
  const day =
    dayRaw != null && dayRaw !== ""
      ? Math.min(31, Math.max(1, parseInt(dayRaw, 10) || 1))
      : null;

  const { error } = await supabase
    .from("clients")
    .update({
      reminder_enabled: enabled,
      reminder_day_of_month: enabled ? (day ?? 1) : null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  return { ok: true };
}

/** Marcheaza linkul ca trimis manual (copiat) fara a trimite email. */
export async function markLinkCopied(clientId: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Neautentificat.' };

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('accountant_id', user.id)
    .single();
  if (!client) return { error: 'Client negasit.' };

  const now = new Date();
  const { error } = await supabase.from('document_requests').insert({
    client_id: clientId,
    accountant_id: user.id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    channel: 'manual',
    doc_type_names: [],
    message: null,
    reminder_after_3_days: false,
    sent_at: now.toISOString(),
    reminder_sent_at: null,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/clienti');
  return { ok: true };
}
