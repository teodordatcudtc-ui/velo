type AnafConnection = {
  api_base_url: string;
  oauth_token_url: string;
  oauth_client_id: string;
  oauth_client_secret: string;
  oauth_refresh_token: string | null;
  access_token: string | null;
  access_token_expires_at: string | null;
};

type FetchJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

const DEFAULT_TIMEOUT_MS = 12000;

function trimSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  controller.signal.addEventListener("abort", () => clearTimeout(timeout), { once: true });
  return controller.signal;
}

function toAbortSignal(value: RequestInit["signal"]): AbortSignal | undefined {
  return value instanceof AbortSignal ? value : undefined;
}

async function fetchWithRetry(
  input: string,
  init: RequestInit & { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<Response> {
  const retries = init.retries ?? 2;
  const retryDelayMs = init.retryDelayMs ?? 700;
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(input, {
        ...init,
        signal: withTimeout(toAbortSignal(init.signal), timeoutMs),
      });
      if (res.status >= 500 && i < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (i + 1)));
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
      if (i >= retries) break;
      await new Promise((r) => setTimeout(r, retryDelayMs * (i + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("ANAF network error");
}

export function normalizeTaxCode(value: string): string {
  return value.replace(/[^0-9]/g, "").replace(/^0+/, "");
}

export async function refreshAnafAccessToken(
  conn: AnafConnection
): Promise<
  | { ok: true; accessToken: string; expiresAtIso: string | null; refreshToken: string }
  | { ok: false; error: string }
> {
  const rt = conn.oauth_refresh_token?.trim();
  if (!rt) {
    return {
      ok: false,
      error: "Nu ești conectat la ANAF. Folosește „Conectează ANAF” în Setări.",
    };
  }

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", rt);
  body.set("token_content_type", "jwt");

  const basic = Buffer.from(`${conn.oauth_client_id}:${conn.oauth_client_secret}`, "utf8").toString(
    "base64"
  );

  let res: Response;
  try {
    res = await fetchWithRetry(conn.oauth_token_url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      retries: 1,
      timeoutMs: 15000,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nu pot apela endpoint-ul OAuth ANAF",
    };
  }

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, error: `OAuth ANAF răspuns invalid: ${text.slice(0, 240)}` };
  }

  if (!res.ok) {
    return { ok: false, error: `OAuth ANAF ${res.status}: ${text.slice(0, 240)}` };
  }

  const accessToken = String(json.access_token ?? "").trim();
  if (!accessToken) return { ok: false, error: "OAuth ANAF: lipsește access_token" };

  const refreshToken = String(json.refresh_token ?? rt).trim();
  const expiresInSec = Number(json.expires_in ?? 0);
  const expiresAtIso =
    expiresInSec > 0 ? new Date(Date.now() + Math.max(0, expiresInSec - 45) * 1000).toISOString() : null;

  return { ok: true, accessToken, expiresAtIso, refreshToken };
}

export async function ensureAnafAccessToken(
  conn: AnafConnection
): Promise<
  | { ok: true; accessToken: string; refreshed: false }
  | { ok: true; accessToken: string; refreshed: true; expiresAtIso: string | null; refreshToken: string }
  | { ok: false; error: string }
> {
  const token = conn.access_token?.trim() ?? "";
  const exp = conn.access_token_expires_at ? new Date(conn.access_token_expires_at).getTime() : 0;
  if (token && exp > Date.now() + 90_000) {
    return { ok: true, accessToken: token, refreshed: false };
  }
  const refreshed = await refreshAnafAccessToken(conn);
  if (!refreshed.ok) return refreshed;
  return {
    ok: true,
    accessToken: refreshed.accessToken,
    refreshed: true,
    expiresAtIso: refreshed.expiresAtIso,
    refreshToken: refreshed.refreshToken,
  };
}

export async function anafApiGetJson<T>(
  baseUrl: string,
  path: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<FetchJsonResult<T>> {
  const url = new URL(`${trimSlashes(baseUrl)}/${path.replace(/^\/+/, "")}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  let res: Response;
  try {
    res = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json, text/plain;q=0.9",
      },
      timeoutMs: 12000,
      retries: 2,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Eroare de rețea ANAF",
    };
  }

  const text = await res.text();
  let json: T;
  try {
    json = JSON.parse(text) as T;
  } catch {
    return { ok: false, error: `ANAF JSON invalid (${res.status}): ${text.slice(0, 240)}` };
  }

  if (!res.ok) {
    return { ok: false, error: `ANAF HTTP ${res.status}: ${text.slice(0, 240)}` };
  }
  return { ok: true, data: json };
}

export async function anafApiDownload(
  baseUrl: string,
  messageId: string,
  accessToken: string
): Promise<{ ok: true; buffer: ArrayBuffer } | { ok: false; error: string }> {
  const url = new URL(`${trimSlashes(baseUrl)}/descarcare`);
  url.searchParams.set("id", messageId);

  let res: Response;
  try {
    res = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/octet-stream,application/zip,application/json,text/plain",
      },
      timeoutMs: 20000,
      retries: 2,
      retryDelayMs: 1000,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Eroare de rețea la descărcare ANAF",
    };
  }

  const buf = await res.arrayBuffer();
  if (!res.ok) {
    const text = new TextDecoder().decode(buf.slice(0, 300));
    return { ok: false, error: `ANAF descarcare ${res.status}: ${text}` };
  }
  return { ok: true, buffer: buf };
}

export type AnafMessage = {
  id: string;
  raw: Record<string, unknown>;
  partnerTaxCode: string | null;
};

function coerceMessageId(row: Record<string, unknown>): string | null {
  const candidates = ["id", "id_solicitare", "idMesaj", "id_mesaj", "idIncarcare"];
  for (const key of candidates) {
    const value = row[key];
    if (value != null) {
      const s = String(value).trim();
      if (s) return s;
    }
  }
  return null;
}

function extractPartnerTaxCode(row: Record<string, unknown>): string | null {
  const keys = [
    "cif_emitent",
    "cifEmitent",
    "emitentCif",
    "emitent_cif",
    "cuiEmitent",
    "cui_emitent",
    "partener_cif",
    "partenerCif",
  ];
  for (const key of keys) {
    const value = row[key];
    if (value == null) continue;
    const normalized = normalizeTaxCode(String(value));
    if (normalized) return normalized;
  }
  return null;
}

export function parseAnafMessageList(payload: unknown): AnafMessage[] {
  const rows: Record<string, unknown>[] = (() => {
    if (Array.isArray(payload)) return payload.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    if (!payload || typeof payload !== "object") return [];
    const p = payload as Record<string, unknown>;
    const candidates = [p.mesaje, p.messages, p.listaMesaje, p.facturi, p.items, p.results];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        return c.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
      }
    }
    return [];
  })();

  const out: AnafMessage[] = [];
  for (const row of rows) {
    const id = coerceMessageId(row);
    if (!id) continue;
    out.push({ id, raw: row, partnerTaxCode: extractPartnerTaxCode(row) });
  }
  return out;
}
