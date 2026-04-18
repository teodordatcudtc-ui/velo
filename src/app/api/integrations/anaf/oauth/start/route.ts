import { createClient } from "@/lib/supabase/server";
import {
  getAnafOAuthAuthorizeScope,
  getAppBaseUrl,
  getPlatformAnafOAuthConfig,
} from "@/lib/anaf-oauth-config";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const base = getAppBaseUrl();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextUrl = encodeURIComponent("/dashboard/setari");
    return NextResponse.redirect(`${base}/login?redirect=${nextUrl}`);
  }

  const cfg = getPlatformAnafOAuthConfig();
  if (!cfg.configured) {
    const msg = encodeURIComponent(
      "OAuth ANAF nu este configurat pe server (ANAF_OAUTH_CLIENT_ID / ANAF_OAUTH_CLIENT_SECRET / token URL)."
    );
    return NextResponse.redirect(`${base}/dashboard/setari?anaf_error=${msg}`);
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
  return res;
}
