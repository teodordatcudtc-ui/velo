/**
 * Config OAuth ANAF la nivel de platformă (Vello). Client ID/secret le pui o singură dată în env.
 * Fiecare contabil obține propriul refresh_token prin fluxul din browser (fără Postman).
 */

export type PlatformAnafOAuthConfig = {
  apiBaseUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  /** Callback exact — trebuie să coincidă cu cel din „Editare profil OAuth” ANAF */
  redirectUri: string;
  configured: boolean;
};

function trim(v: string | undefined): string {
  return (v ?? "").trim();
}

export function getAppBaseUrl(): string {
  const fromEnv = trim(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const vercel = trim(process.env.VERCEL_URL);
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export function getAnafOAuthRedirectUri(): string {
  const override = trim(process.env.ANAF_OAUTH_REDIRECT_URI);
  if (override) return override.replace(/\/+$/, "");
  return `${getAppBaseUrl()}/api/integrations/anaf/oauth/callback`;
}

/**
 * Scope pentru cererea de autorizare la ANAF.
 * Implicit: doar `EFACTURA` — unii utilizatori primesc `access_denied` dacă se trimite și `offline_access`
 * (nu e documentat uniform de ANAF). Pentru teste: `ANAF_OAUTH_SCOPE=-` omite parametrul; pentru `offline_access` explicit: `ANAF_OAUTH_SCOPE=EFACTURA offline_access`.
 */
export function getAnafOAuthAuthorizeScope(): string | null {
  const raw = process.env.ANAF_OAUTH_SCOPE;
  if (raw === undefined) return "EFACTURA";
  const s = trim(raw);
  if (s === "" || s === "-") return null;
  return s;
}

export function getPlatformAnafOAuthConfig(): PlatformAnafOAuthConfig {
  const apiBaseUrl = trim(process.env.ANAF_API_BASE_URL) || "https://api.anaf.ro/prod/FCTEL/rest";
  const authorizeUrl =
    trim(process.env.ANAF_OAUTH_AUTHORIZE_URL) || "https://logincert.anaf.ro/anaf-oauth2/v1/authorize";
  const tokenUrl = trim(process.env.ANAF_OAUTH_TOKEN_URL) || "https://logincert.anaf.ro/anaf-oauth2/v1/token";
  const clientId = trim(process.env.ANAF_OAUTH_CLIENT_ID);
  const clientSecret = trim(process.env.ANAF_OAUTH_CLIENT_SECRET);
  const redirectUri = getAnafOAuthRedirectUri();
  const configured = !!(clientId && clientSecret && tokenUrl && authorizeUrl);
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
    authorizeUrl,
    tokenUrl,
    clientId,
    clientSecret,
    redirectUri,
    configured,
  };
}
