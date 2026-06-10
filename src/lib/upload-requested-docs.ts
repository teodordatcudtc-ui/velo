import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureDocumentTypesExist,
  filterDocTypesByNames,
  type ClientDocType,
} from "@/lib/document-types";
import {
  buildSelectableUploadPeriods,
  periodKey,
  type UploadPeriod,
} from "@/lib/upload-period";

export type UploadDocType = ClientDocType;

/** Cerere activă pentru o lună/an (trimisă, neînchisă). */
export async function getDocumentRequestForUploadPeriod(
  supabase: SupabaseClient,
  clientId: string,
  month: number,
  year: number
): Promise<{ doc_type_names: string[] } | null> {
  const now = new Date();

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

/** Cerere activă pentru luna curentă (trimisă, neînchisă). */
export async function getActiveDocumentRequestForUpload(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ doc_type_names: string[] } | null> {
  const now = new Date();
  return getDocumentRequestForUploadPeriod(
    supabase,
    clientId,
    now.getMonth() + 1,
    now.getFullYear()
  );
}

/** Perioadă implicită: cererea deschisă recentă din fereastra selectabilă, altfel luna curentă. */
export async function resolveDefaultUploadPeriod(
  supabase: SupabaseClient,
  clientId: string
): Promise<UploadPeriod> {
  const now = new Date();
  const current: UploadPeriod = {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
  const selectableKeys = new Set(
    buildSelectableUploadPeriods().map((p) => periodKey(p))
  );

  const { data: requests } = await supabase
    .from("document_requests")
    .select("month, year, sent_at")
    .eq("client_id", clientId)
    .eq("request_closed", false)
    .lte("sent_at", now.toISOString())
    .order("sent_at", { ascending: false });

  for (const req of requests ?? []) {
    const month = Number(req.month);
    const year = Number(req.year);
    if (!Number.isInteger(month) || !Number.isInteger(year)) continue;
    if (selectableKeys.has(periodKey({ month, year }))) {
      return { month, year };
    }
  }

  return current;
}

export async function resolveUploadDocTypes(
  supabase: SupabaseClient,
  clientId: string,
  allTypes: UploadDocType[],
  period?: UploadPeriod
): Promise<UploadDocType[]> {
  const now = new Date();
  const target = period ?? {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
  const request = await getDocumentRequestForUploadPeriod(
    supabase,
    clientId,
    target.month,
    target.year
  );
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
  docTypeName: string,
  period?: UploadPeriod
): Promise<boolean> {
  const now = new Date();
  const target = period ?? {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
  const request = await getDocumentRequestForUploadPeriod(
    supabase,
    clientId,
    target.month,
    target.year
  );
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
