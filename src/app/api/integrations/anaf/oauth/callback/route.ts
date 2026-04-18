import { exchangeAuthorizationCode } from "@/lib/anaf-oauth-token";
import { getAppBaseUrl, getPlatformAnafOAuthConfig } from "@/lib/anaf-oauth-config";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function redirectToSettings(search: Record<string, string>) {
  const base = getAppBaseUrl();
  const u = new URL(`${base}/dashboard/setari`);
  for (const [k, v] of Object.entries(search)) {
    if (v) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u.toString());
}

export async function GET(request: Request) {
  const base = getAppBaseUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthErr = url.searchParams.get("error");
  const oauthDesc = url.searchParams.get("error_description");

  if (oauthErr) {
    let message = oauthDesc?.trim() || oauthErr;
    if (oauthErr === "access_denied") {
      const hint =
        "Verifică certificatul digital (calificat), drepturile SPV pentru firma corectă și că accepți cererea în pagina ANAF. Dacă apare fără să fi anulat tu, contactează ANAF sau încearcă alt browser/certificate store.";
      message = message && message !== "access_denied" ? `${message} ${hint}` : hint;
    }
    const res = redirectToSettings({
      anaf_error: message,
    });
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("velo_anaf_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    const res = redirectToSettings({
      anaf_error: "Sesiune OAuth invalidă sau expirată. Încearcă din nou.",
    });
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = NextResponse.redirect(
      `${base}/login?redirect=${encodeURIComponent("/dashboard/setari")}`
    );
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    const res = redirectToSettings({
      anaf_error: "OAuth ANAF nu este configurat pe server.",
    });
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const exchanged = await exchangeAuthorizationCode({
    tokenUrl: cfg.tokenUrl,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    code,
    redirectUri: cfg.redirectUri,
  });

  if (!exchanged.ok) {
    const res = redirectToSettings({ anaf_error: exchanged.error });
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const { data: existing } = await supabase
    .from("anaf_connections")
    .select("company_cif, enabled")
    .eq("accountant_id", user.id)
    .maybeSingle();

  const { error: upErr } = await supabase.from("anaf_connections").upsert(
    {
      accountant_id: user.id,
      enabled: existing?.enabled !== false,
      company_cif: existing?.company_cif ?? null,
      api_base_url: cfg.apiBaseUrl,
      oauth_token_url: cfg.tokenUrl,
      oauth_client_id: cfg.clientId,
      oauth_client_secret: cfg.clientSecret,
      oauth_refresh_token: exchanged.refreshToken,
      access_token: exchanged.accessToken,
      access_token_expires_at: exchanged.expiresAtIso,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "accountant_id" }
  );

  if (upErr) {
    const res = redirectToSettings({
      anaf_error: `Nu am putut salva token-ul: ${upErr.message}`,
    });
    res.cookies.delete("velo_anaf_oauth_state");
    return res;
  }

  const res = redirectToSettings({ anaf: "connected" });
  res.cookies.delete("velo_anaf_oauth_state");
  return res;
}
