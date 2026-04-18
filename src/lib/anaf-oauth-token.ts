/** Schimbă authorization code în token-uri (flux browser, fără Postman). ANAF: Basic Auth + token_content_type=jwt în body. */
export async function exchangeAuthorizationCode(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<
  | {
      ok: true;
      accessToken: string;
      refreshToken: string;
      expiresAtIso: string | null;
    }
  | { ok: false; error: string }
> {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", params.code);
  body.set("redirect_uri", params.redirectUri);
  body.set("token_content_type", "jwt");

  const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`, "utf8").toString("base64");

  let res: Response;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    res = await fetch(params.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(t);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Eroare la schimbarea codului OAuth",
    };
  }

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, error: `OAuth token răspuns invalid (${res.status}): ${text.slice(0, 280)}` };
  }

  if (!res.ok) {
    return { ok: false, error: `OAuth token ${res.status}: ${text.slice(0, 280)}` };
  }

  const accessToken = String(json.access_token ?? "").trim();
  const refreshToken = String(json.refresh_token ?? "").trim();
  if (!accessToken || !refreshToken) {
    return { ok: false, error: "OAuth: lipsește access_token sau refresh_token în răspuns." };
  }

  const expiresInSec = Number(json.expires_in ?? 0);
  const expiresAtIso =
    expiresInSec > 0 ? new Date(Date.now() + Math.max(0, expiresInSec - 45) * 1000).toISOString() : null;

  return { ok: true, accessToken, refreshToken, expiresAtIso };
}
