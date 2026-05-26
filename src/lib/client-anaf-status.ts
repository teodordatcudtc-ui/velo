import { createClient } from "@/lib/supabase/server";

export type ClientSpvStatus = {
  connected: boolean;
  companyCif: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export async function getClientSpvStatusByClientIds(
  clientIds: string[]
): Promise<Record<string, ClientSpvStatus>> {
  const map: Record<string, ClientSpvStatus> = {};
  if (clientIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("client_anaf_connections")
    .select(
      "client_id, company_cif, oauth_refresh_token, connected_at, last_synced_at, last_error"
    )
    .in("client_id", clientIds);

  for (const id of clientIds) {
    map[id] = {
      connected: false,
      companyCif: null,
      connectedAt: null,
      lastSyncedAt: null,
      lastError: null,
    };
  }

  for (const row of data ?? []) {
    const connected = !!row.oauth_refresh_token?.trim();
    map[row.client_id] = {
      connected,
      companyCif: row.company_cif ?? null,
      connectedAt: row.connected_at ?? null,
      lastSyncedAt: row.last_synced_at ?? null,
      lastError: row.last_error ?? null,
    };
  }

  return map;
}
