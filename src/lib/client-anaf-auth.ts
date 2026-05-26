import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTaxCode } from "@/lib/anaf";

export type ClientByUploadToken = {
  id: string;
  name: string;
  accountant_id: string;
  unique_token: string;
};

export async function getClientByUploadToken(
  token: string
): Promise<{ client: ClientByUploadToken } | { error: string }> {
  const trimmed = token.trim();
  if (!trimmed) return { error: "Link invalid." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, accountant_id, unique_token")
    .eq("unique_token", trimmed)
    .maybeSingle();

  if (error || !data) return { error: "Link invalid sau expirat." };
  return { client: data as ClientByUploadToken };
}

export function normalizeCompanyCifInput(value: string): string | null {
  const norm = normalizeTaxCode(value.trim());
  if (!norm || norm.length < 2 || norm.length > 13) return null;
  return norm;
}
