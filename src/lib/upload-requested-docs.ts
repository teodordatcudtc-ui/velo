import type { SupabaseClient } from "@supabase/supabase-js";

export type UploadDocType = { id: string; name: string };

function normalizeDocTypeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Cerere activă pentru luna curentă (trimisă, neînchisă). */
export async function getActiveDocumentRequestForUpload(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ doc_type_names: string[] } | null> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data } = await supabase
    .from("document_requests")
    .select("doc_type_names")
    .eq("client_id", clientId)
    .eq("month", month)
    .eq("year", year)
    .eq("request_closed", false)
    .lte("sent_at", now.toISOString())
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.doc_type_names?.length) return null;
  return { doc_type_names: data.doc_type_names };
}

/** Păstrează doar tipurile cerute în ultima cerere activă; fără cerere → toate tipurile clientului. */
export function filterDocTypesForActiveRequest(
  allTypes: UploadDocType[],
  requestedNames: string[] | null | undefined
): UploadDocType[] {
  if (!requestedNames?.length) return allTypes;

  const wanted = new Set(
    requestedNames.map(normalizeDocTypeName).filter((n) => n.length > 0)
  );
  if (wanted.size === 0) return allTypes;

  const filtered = allTypes.filter((d) => wanted.has(normalizeDocTypeName(d.name)));
  return filtered.length > 0 ? filtered : allTypes;
}

export async function resolveUploadDocTypes(
  supabase: SupabaseClient,
  clientId: string,
  allTypes: UploadDocType[]
): Promise<UploadDocType[]> {
  const request = await getActiveDocumentRequestForUpload(supabase, clientId);
  if (!request) return allTypes;
  return filterDocTypesForActiveRequest(allTypes, request.doc_type_names);
}

export async function isDocTypeAllowedForUpload(
  supabase: SupabaseClient,
  clientId: string,
  docTypeName: string
): Promise<boolean> {
  const allTypes = [{ id: "", name: docTypeName }];
  const request = await getActiveDocumentRequestForUpload(supabase, clientId);
  if (!request) return true;
  const allowed = filterDocTypesForActiveRequest(allTypes, request.doc_type_names);
  return allowed.some((d) => normalizeDocTypeName(d.name) === normalizeDocTypeName(docTypeName));
}
