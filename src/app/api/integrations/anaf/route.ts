import { createClient } from "@/lib/supabase/server";
import { normalizeTaxCode } from "@/lib/anaf";
import { NextResponse } from "next/server";

function maskSecret(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "********";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-3)}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });

  const { data: conn, error: connError } = await supabase
    .from("anaf_connections")
    .select("enabled, company_cif, api_base_url, oauth_token_url, oauth_client_id, oauth_client_secret, oauth_refresh_token, last_synced_at, last_error, last_error_at, circuit_open_until, consecutive_failures")
    .eq("accountant_id", user.id)
    .maybeSingle();
  if (connError) return NextResponse.json({ error: connError.message }, { status: 500 });

  const { data: mappings, error: mappingsError } = await supabase
    .from("anaf_client_tax_mappings")
    .select("id, client_id, tax_code")
    .eq("accountant_id", user.id)
    .order("created_at", { ascending: true });
  if (mappingsError) return NextResponse.json({ error: mappingsError.message }, { status: 500 });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("accountant_id", user.id)
    .eq("archived", false)
    .order("name");

  const clientNameMap = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return NextResponse.json({
    connection: conn
      ? {
          enabled: conn.enabled,
          companyCif: conn.company_cif,
          apiBaseUrl: conn.api_base_url,
          oauthTokenUrl: conn.oauth_token_url,
          oauthClientId: conn.oauth_client_id,
          oauthClientSecretMasked: maskSecret(conn.oauth_client_secret),
          oauthRefreshTokenMasked: maskSecret(conn.oauth_refresh_token),
          lastSyncedAt: conn.last_synced_at,
          lastError: conn.last_error,
          lastErrorAt: conn.last_error_at,
          circuitOpenUntil: conn.circuit_open_until,
          consecutiveFailures: conn.consecutive_failures ?? 0,
        }
      : null,
    mappings: (mappings ?? []).map((m) => ({
      id: m.id,
      clientId: m.client_id,
      taxCode: m.tax_code,
      clientName: clientNameMap.get(m.client_id) ?? "Client",
    })),
    clients: clients ?? [],
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const companyCif = normalizeTaxCode(String(body.companyCif ?? ""));
  const oauthTokenUrl = String(body.oauthTokenUrl ?? "").trim();
  const oauthClientId = String(body.oauthClientId ?? "").trim();
  const oauthClientSecret = String(body.oauthClientSecret ?? "").trim();
  const oauthRefreshToken = String(body.oauthRefreshToken ?? "").trim();
  const apiBaseUrl = String(body.apiBaseUrl ?? "https://api.anaf.ro/prod/FCTEL/rest").trim();
  const enabled = body.enabled !== false;

  if (!companyCif || !oauthTokenUrl || !oauthClientId || !oauthClientSecret || !oauthRefreshToken) {
    return NextResponse.json({ error: "Completează toate câmpurile ANAF obligatorii." }, { status: 400 });
  }

  const { error } = await supabase.from("anaf_connections").upsert({
    accountant_id: user.id,
    enabled,
    company_cif: companyCif,
    api_base_url: apiBaseUrl.replace(/\/+$/, ""),
    oauth_token_url: oauthTokenUrl,
    oauth_client_id: oauthClientId,
    oauth_client_secret: oauthClientSecret,
    oauth_refresh_token: oauthRefreshToken,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
