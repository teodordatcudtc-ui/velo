import { createClient } from "@/lib/supabase/server";
import { normalizeTaxCode } from "@/lib/anaf";
import { getPlatformAnafOAuthConfig } from "@/lib/anaf-oauth-config";
import { NextResponse } from "next/server";

function isAnafAdmin(email: string | null | undefined): boolean {
  const admin = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && !!email && email.toLowerCase() === admin;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isAnafAdmin(user.email)) {
    return NextResponse.json({ error: "Integrarea ANAF este disponibilă doar pentru admin." }, { status: 403 });
  }

  const platform = getPlatformAnafOAuthConfig();

  const { data: conn, error: connError } = await supabase
    .from("anaf_connections")
    .select(
      "enabled, company_cif, last_synced_at, last_error, last_error_at, circuit_open_until, consecutive_failures, oauth_refresh_token"
    )
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

  const oauthConnected = !!(conn as { oauth_refresh_token?: string | null } | null)?.oauth_refresh_token?.trim();

  return NextResponse.json({
    connection: conn
      ? {
          enabled: conn.enabled,
          companyCif: conn.company_cif ?? "",
          oauthConnected,
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
    oauthPlatformReady: platform.configured,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isAnafAdmin(user.email)) {
    return NextResponse.json({ error: "Integrarea ANAF este disponibilă doar pentru admin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const companyCifRaw = String(body.companyCif ?? "");
  const companyCifNorm = normalizeTaxCode(companyCifRaw);
  const enabled = body.enabled !== false;
  const platform = getPlatformAnafOAuthConfig();

  if (!companyCifNorm) {
    return NextResponse.json({ error: "Completează CUI-ul firmei." }, { status: 400 });
  }
  if (!platform.configured) {
    return NextResponse.json(
      {
        error:
          "Integrarea ANAF nu este configurată la nivel de platformă (ANAF_OAUTH_CLIENT_ID, ANAF_OAUTH_CLIENT_SECRET etc.).",
      },
      { status: 503 }
    );
  }

  const { data: existing } = await supabase
    .from("anaf_connections")
    .select("oauth_refresh_token")
    .eq("accountant_id", user.id)
    .maybeSingle();

  const existingRefresh = (existing as { oauth_refresh_token?: string | null } | null)?.oauth_refresh_token?.trim();
  const legacyEnvRefresh = process.env.ANAF_OAUTH_REFRESH_TOKEN?.trim();
  const oauthRefreshToken = existingRefresh || legacyEnvRefresh || null;

  const { error } = await supabase.from("anaf_connections").upsert(
    {
      accountant_id: user.id,
      enabled,
      company_cif: companyCifNorm,
      api_base_url: platform.apiBaseUrl,
      oauth_token_url: platform.tokenUrl,
      oauth_client_id: platform.clientId,
      oauth_client_secret: platform.clientSecret,
      oauth_refresh_token: oauthRefreshToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "accountant_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
