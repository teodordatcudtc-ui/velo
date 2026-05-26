import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type ClientAnafConnectionRow =
  Database["public"]["Tables"]["client_anaf_connections"]["Row"];
export type ClientAnafConnectionInsert =
  Database["public"]["Tables"]["client_anaf_connections"]["Insert"];

function clientAnafDb(supabase: SupabaseClient<Database>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("client_anaf_connections");
}

export async function upsertClientAnafConnection(
  supabase: SupabaseClient<Database>,
  row: ClientAnafConnectionInsert
) {
  return clientAnafDb(supabase).upsert(row, { onConflict: "client_id" }) as Promise<{
    error: { message: string } | null;
  }>;
}

export async function getClientAnafConnectionByClientId(
  supabase: SupabaseClient<Database>,
  clientId: string,
  columns = "*"
) {
  return clientAnafDb(supabase)
    .select(columns)
    .eq("client_id", clientId)
    .maybeSingle() as Promise<{
    data: ClientAnafConnectionRow | null;
    error: { message: string } | null;
  }>;
}
