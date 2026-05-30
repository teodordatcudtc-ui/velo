import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureDocumentTypesExist,
  filterDocTypesByNames,
  type ClientDocType,
} from "@/lib/document-types";

export type UploadDocType = ClientDocType;

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

export async function resolveUploadDocTypes(
  supabase: SupabaseClient,
  clientId: string,
  allTypes: UploadDocType[]
): Promise<UploadDocType[]> {
  const request = await getActiveDocumentRequestForUpload(supabase, clientId);
  if (!request?.doc_type_names?.length) return allTypes;

  await ensureDocumentTypesExist(supabase, clientId, request.doc_type_names);

  const { data: refreshed } = await supabase
    .from("document_types")
    .select("id, name")
    .eq("client_id", clientId);

  const types = (refreshed ?? []) as UploadDocType[];
  const filtered = filterDocTypesByNames(types, request.doc_type_names);
  return filtered.length > 0 ? filtered : types;
}

export async function isDocTypeAllowedForUpload(
  supabase: SupabaseClient,
  clientId: string,
  docTypeName: string
): Promise<boolean> {
  const request = await getActiveDocumentRequestForUpload(supabase, clientId);
  if (!request) return true;

  await ensureDocumentTypesExist(supabase, clientId, request.doc_type_names);

  const { data: refreshed } = await supabase
    .from("document_types")
    .select("id, name")
    .eq("client_id", clientId);

  const allowed = filterDocTypesByNames((refreshed ?? []) as UploadDocType[], request.doc_type_names);
  const norm = docTypeName.trim().toLowerCase();
  return allowed.some((d) => d.name.trim().toLowerCase() === norm);
}
