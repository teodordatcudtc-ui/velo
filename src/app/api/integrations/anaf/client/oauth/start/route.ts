import { getClientByUploadToken } from "@/lib/client-anaf-auth";
import {
  getAnafOAuthAuthorizeScope,
  getAppBaseUrl,
  getPlatformAnafOAuthConfig,
} from "@/lib/anaf-oauth-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAnafConnectionByClientId } from "@/lib/supabase/client-anaf";
import { NextResponse } from "next/server";
import crypto from "crypto";

function redirectUpload(token: string, params: Record<string, string>) {
  const base = getAppBaseUrl();
  const u = new URL(`${base}/upload/${encodeURIComponent(token)}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u.toString());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Link invalid." }, { status: 400 });
  }

  const resolved = await getClientByUploadToken(token);
  if ("error" in resolved) {
    return redirectUpload(token, { spv_error: resolved.error });
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    return redirectUpload(token, {
      spv_error: "Conectarea SPV nu este disponibilă momentan. Contactează contabilul.",
    });
  }

  const supabase = createAdminClient();
  const { data: conn } = await getClientAnafConnectionByClientId(
    supabase,
    resolved.client.id,
    "company_cif, consent_at"
  );

  if (!conn?.company_cif?.trim() || !conn.consent_at) {
    return redirectUpload(token, {
      spv_error: "Completează CUI-ul firmei și bifează acordul înainte de conectare.",
    });
  }

  const state = crypto.randomBytes(32).toString("hex");
  const authorize = new URL(cfg.authorizeUrl);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", cfg.clientId);
  authorize.searchParams.set("redirect_uri", cfg.redirectUri);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("token_content_type", "jwt");
  const scope = getAnafOAuthAuthorizeScope();
  if (scope) authorize.searchParams.set("scope", scope);

  const res = NextResponse.redirect(authorize.toString());
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set("velo_anaf_oauth_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("velo_anaf_oauth_mode", "client", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("velo_anaf_client_token", token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
