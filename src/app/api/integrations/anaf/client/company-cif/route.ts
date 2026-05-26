import { getClientByUploadToken, normalizeCompanyCifInput } from "@/lib/client-anaf-auth";
import { getPlatformAnafOAuthConfig } from "@/lib/anaf-oauth-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertClientAnafConnection } from "@/lib/supabase/client-anaf";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { token?: string; companyCif?: string; consent?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const token = body.token?.trim();
  const companyCif = normalizeCompanyCifInput(body.companyCif ?? "");
  if (!token) return NextResponse.json({ error: "Link invalid." }, { status: 400 });
  if (!companyCif) {
    return NextResponse.json(
      { error: "Introdu CUI-ul firmei (doar cifre, fără RO)." },
      { status: 400 }
    );
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: "Bifează acordul pentru conectarea la SPV e-Factura." },
      { status: 400 }
    );
  }

  const resolved = await getClientByUploadToken(token);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 404 });
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      { error: "Conectarea SPV nu este disponibilă momentan. Contactează contabilul." },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await upsertClientAnafConnection(supabase, {
    client_id: resolved.client.id,
    accountant_id: resolved.client.accountant_id,
    enabled: true,
    company_cif: companyCif,
    api_base_url: cfg.apiBaseUrl,
    oauth_token_url: cfg.tokenUrl,
    oauth_client_id: cfg.clientId,
    oauth_client_secret: cfg.clientSecret,
    consent_at: now,
    updated_at: now,
  });

  if (error) {
    return NextResponse.json({ error: "Nu am putut salva datele. Încearcă din nou." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, companyCif });
}
