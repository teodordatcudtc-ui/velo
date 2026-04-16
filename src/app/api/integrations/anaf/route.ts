import { createClient } from "@/lib/supabase/server";
import { normalizeTaxCode } from "@/lib/anaf";
import { NextResponse } from "next/server";

function getServerAnafConfig() {
  const apiBaseUrl = (process.env.ANAF_API_BASE_URL ?? "https://api.anaf.ro/prod/FCTEL/rest").trim();
  const oauthTokenUrl = (process.env.ANAF_OAUTH_TOKEN_URL ?? "").trim();
  const oauthClientId = (process.env.ANAF_OAUTH_CLIENT_ID ?? "").trim();
  const oauthClientSecret = (process.env.ANAF_OAUTH_CLIENT_SECRET ?? "").trim();
  const oauthRefreshToken = (process.env.ANAF_OAUTH_REFRESH_TOKEN ?? "").trim();
  const configured = !!(oauthTokenUrl && oauthClientId && oauthClientSecret && oauthRefreshToken);
  return { apiBaseUrl, oauthTokenUrl, oauthClientId, oauthClientSecret, oauthRefreshToken, configured };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });

  const { data: conn, error: connError } = await supabase
    .from("anaf_connections")
    .select("enabled, company_cif, last_synced_at, last_error, last_error_at, circuit_open_until, consecutive_failures")
    .eq("accountant_id", user.id)
    .maybeSingle();
  if (connError) return NextResponse.json({ error: connError.message }, { status: 500 });
  const serverCfg = getServerAnafConfig();

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
          apiBaseUrl: serverCfg.apiBaseUrl,
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
    serverConfigReady: serverCfg.configured,
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
  const enabled = body.enabled !== false;
  const serverCfg = getServerAnafConfig();

  if (!companyCif) {
    return NextResponse.json({ error: "Completează CUI-ul firmei." }, { status: 400 });
  }
  if (!serverCfg.configured) {
    return NextResponse.json(
      {
        error:
          "Integrarea ANAF nu este configurată la nivel de platformă. Administratorul trebuie să seteze variabilele de mediu ANAF.",
      },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("anaf_connections").upsert({
    accountant_id: user.id,
    enabled,
    company_cif: companyCif,
    api_base_url: serverCfg.apiBaseUrl.replace(/\/+$/, ""),
    oauth_token_url: serverCfg.oauthTokenUrl,
    oauth_client_id: serverCfg.oauthClientId,
    oauth_client_secret: serverCfg.oauthClientSecret,
    oauth_refresh_token: serverCfg.oauthRefreshToken,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
