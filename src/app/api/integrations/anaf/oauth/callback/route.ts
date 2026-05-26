import { exchangeAuthorizationCode } from "@/lib/anaf-oauth-token";
import { getAppBaseUrl, getPlatformAnafOAuthConfig } from "@/lib/anaf-oauth-config";
import { getClientByUploadToken } from "@/lib/client-anaf-auth";
import { syncAnafForClient } from "@/lib/anaf-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getClientAnafConnectionByClientId,
  upsertClientAnafConnection,
} from "@/lib/supabase/client-anaf";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isAnafAdmin(email: string | null | undefined): boolean {
  const admin = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && !!email && email.toLowerCase() === admin;
}

function redirectToSettings(search: Record<string, string>) {
  const base = getAppBaseUrl();
  const u = new URL(`${base}/dashboard/setari`);
  for (const [k, v] of Object.entries(search)) {
    if (v) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u.toString());
}

function redirectToUpload(token: string, search: Record<string, string>) {
  const base = getAppBaseUrl();
  const u = new URL(`${base}/upload/${encodeURIComponent(token)}`);
  for (const [k, v] of Object.entries(search)) {
    if (v) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u.toString());
}

function clearOAuthCookies(res: NextResponse) {
  res.cookies.delete("velo_anaf_oauth_state");
  res.cookies.delete("velo_anaf_oauth_mode");
  res.cookies.delete("velo_anaf_client_token");
}

function formatOAuthError(oauthErr: string, oauthDesc: string | null): string {
  let message = oauthDesc?.trim() || oauthErr;
  if (oauthErr === "access_denied") {
    const desc = oauthDesc?.trim();
    const anafExplains =
      !!desc && desc.toLowerCase() !== "access_denied" && desc.length > 3;
    message = anafExplains
      ? desc!
      : [
          "ANAF a respins autorizarea (access_denied).",
          "Folosește certificatul digital al firmei tale, fără VPN, în Chrome sau Edge.",
          "Asigură-te că ai acces SPV e-Factura pentru CUI-ul introdus.",
        ].join(" ");
  }
  if (oauthErr === "invalid_scope") {
    message =
      oauthDesc?.trim() ||
      "Scope OAuth respins de ANAF. Contactează suportul Vello.";
  }
  return message;
}

async function handleClientOAuthCallback(params: {
  code: string;
  clientToken: string;
}): Promise<NextResponse> {
  const resolved = await getClientByUploadToken(params.clientToken);
  if ("error" in resolved) {
    const res = redirectToUpload(params.clientToken, { spv_error: resolved.error });
    clearOAuthCookies(res);
    return res;
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    const res = redirectToUpload(params.clientToken, {
      spv_error: "Conectarea SPV nu este configurată pe server.",
    });
    clearOAuthCookies(res);
    return res;
  }

  const exchanged = await exchangeAuthorizationCode({
    tokenUrl: cfg.tokenUrl,
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    code: params.code,
    redirectUri: cfg.redirectUri,
  });

  if (!exchanged.ok) {
    const res = redirectToUpload(params.clientToken, { spv_error: exchanged.error });
    clearOAuthCookies(res);
    return res;
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: existing } = await getClientAnafConnectionByClientId(
    supabase,
    resolved.client.id,
    "company_cif, enabled"
  );

  const { error: upErr } = await upsertClientAnafConnection(supabase, {
    client_id: resolved.client.id,
    accountant_id: resolved.client.accountant_id,
    enabled: existing?.enabled !== false,
    company_cif: existing?.company_cif ?? null,
    api_base_url: cfg.apiBaseUrl,
    oauth_token_url: cfg.tokenUrl,
    oauth_client_id: cfg.clientId,
    oauth_client_secret: cfg.clientSecret,
    oauth_refresh_token: exchanged.refreshToken,
    access_token: exchanged.accessToken,
    access_token_expires_at: exchanged.expiresAtIso,
    connected_at: now,
    updated_at: now,
  });

  if (upErr) {
    const res = redirectToUpload(params.clientToken, {
      spv_error: `Nu am putut salva conexiunea: ${upErr.message}`,
    });
    clearOAuthCookies(res);
    return res;
  }

  const { data: connRow } = await getClientAnafConnectionByClientId(
    supabase,
    resolved.client.id,
    "client_id, accountant_id, enabled, company_cif, api_base_url, oauth_token_url, oauth_client_id, oauth_client_secret, oauth_refresh_token, access_token, access_token_expires_at, consecutive_failures, circuit_open_until"
  );

  if (connRow) {
    try {
      await syncAnafForClient(supabase, connRow);
    } catch {
      // Prima sincronizare poate eșua; conexiunea rămâne salvată
    }
  }

  const res = redirectToUpload(params.clientToken, { spv: "connected" });
  clearOAuthCookies(res);
  return res;
}

export async function GET(request: Request) {
  const base = getAppBaseUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthErr = url.searchParams.get("error");
  const oauthDesc = url.searchParams.get("error_description");

  const cookieStore = await cookies();
  const oauthMode = cookieStore.get("velo_anaf_oauth_mode")?.value;
  const clientToken = cookieStore.get("velo_anaf_client_token")?.value?.trim();
  const isClientFlow = oauthMode === "client" && !!clientToken;

  if (oauthErr) {
    const message = formatOAuthError(oauthErr, oauthDesc);
    if (isClientFlow && clientToken) {
      const res = redirectToUpload(clientToken, { spv_error: message });
      clearOAuthCookies(res);
      return res;
    }
    const res = redirectToSettings({ anaf_error: message });
    clearOAuthCookies(res);
    return res;
  }

  const expectedState = cookieStore.get("velo_anaf_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    if (isClientFlow && clientToken) {
      const res = redirectToUpload(clientToken, {
        spv_error: "Sesiune OAuth invalidă sau expirată. Încearcă din nou.",
      });
      clearOAuthCookies(res);
      return res;
    }
    const res = redirectToSettings({
      anaf_error: "Sesiune OAuth invalidă sau expirată. Încearcă din nou.",
    });
    clearOAuthCookies(res);
    return res;
  }

  if (isClientFlow && clientToken) {
    return handleClientOAuthCallback({ code, clientToken });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const res = NextResponse.redirect(
      `${base}/login?redirect=${encodeURIComponent("/dashboard/setari")}`
    );
    clearOAuthCookies(res);
    return res;
  }
  if (!isAnafAdmin(user.email)) {
    const res = redirectToSettings({
      anaf_error: "Integrarea ANAF este momentan în standby pentru conturile non-admin.",
    });
    clearOAuthCookies(res);
    return res;
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    const res = redirectToSettings({
      anaf_error: "OAuth ANAF nu este configurat pe server.",
    });
    clearOAuthCookies(res);
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
    clearOAuthCookies(res);
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
    clearOAuthCookies(res);
    return res;
  }

  const res = redirectToSettings({ anaf: "connected" });
  clearOAuthCookies(res);
  return res;
}
