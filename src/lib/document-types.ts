import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientDocType = { id: string; name: string };

export function normalizeDocTypeName(name: string): string {
  return name.trim().toLowerCase();
}

export function normalizeDocTypeNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const key = normalizeDocTypeName(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Creează în DB tipurile lipsă pentru client (potrivire case-insensitive pe nume). */
export async function ensureDocumentTypesExist(
  supabase: SupabaseClient,
  clientId: string,
  docTypeNames: string[]
): Promise<void> {
  const names = normalizeDocTypeNames(docTypeNames);
  if (names.length === 0) return;

  const { data: existingTypes } = await supabase
    .from("document_types")
    .select("id, name")
    .eq("client_id", clientId);

  const byNormalized = new Map<string, string>();
  for (const row of existingTypes ?? []) {
    byNormalized.set(normalizeDocTypeName(row.name), row.name);
  }

  for (const name of names) {
    const key = normalizeDocTypeName(name);
    if (byNormalized.has(key)) continue;
    const { data: inserted, error } = await supabase
      .from("document_types")
      .insert({ client_id: clientId, name })
      .select("id, name")
      .single();
    if (!error && inserted?.name) {
      byNormalized.set(normalizeDocTypeName(inserted.name), inserted.name);
    }
  }
}

export function filterDocTypesByNames(
  allTypes: ClientDocType[],
  requestedNames: string[] | null | undefined
): ClientDocType[] {
  if (!requestedNames?.length) return allTypes;

  const wanted = new Set(
    normalizeDocTypeNames(requestedNames).map(normalizeDocTypeName)
  );
  if (wanted.size === 0) return allTypes;

  return allTypes.filter((d) => wanted.has(normalizeDocTypeName(d.name)));
}

/** Progres lună curentă: total = tipuri din cerere (dacă există), altfel toate tipurile clientului. */
export function computeDocumentProgress(
  allTypes: ClientDocType[],
  requestedNames: string[] | null | undefined,
  uploadsThisMonth: { document_type_id: string }[]
): { total: number; count: number } {
  if (requestedNames && requestedNames.length > 0) {
    const wanted = normalizeDocTypeNames(requestedNames);
    const wantedSet = new Set(wanted.map(normalizeDocTypeName));
    const typeById = new Map(allTypes.map((t) => [t.id, t]));
    const receivedTypeIds = new Set<string>();
    for (const u of uploadsThisMonth) {
      const t = typeById.get(u.document_type_id);
      if (t && wantedSet.has(normalizeDocTypeName(t.name))) {
        receivedTypeIds.add(u.document_type_id);
      }
    }
    return { total: wanted.length, count: receivedTypeIds.size };
  }

  if (allTypes.length === 0) return { total: 0, count: 0 };
  const receivedTypeIds = new Set(uploadsThisMonth.map((u) => u.document_type_id));
  const count = allTypes.filter((t) => receivedTypeIds.has(t.id)).length;
  return { total: allTypes.length, count };
}
