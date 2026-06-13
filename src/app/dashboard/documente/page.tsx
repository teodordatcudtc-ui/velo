import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasPremiumAccess } from "@/lib/subscription";
import { DocumenteList } from "./DocumenteList";
import { DocumenteExportZipButton } from "./ExportZipModal";

export type UploadRow = {
  id: string;
  client_id: string;
  document_type_id: string;
  file_name: string;
  month: number;
  year: number;
  created_at: string;
};

export type ClientOption = { id: string; name: string };
export type DocTypeOption = { id: string; name: string };

export default async function DocumentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until")
    .eq("id", user.id)
    .single();
  const isPremium = hasPremiumAccess(accountant);

  const { data: activeClients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("accountant_id", user.id)
    .eq("archived", false)
    .order("name");

  const { data: archivedClients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("accountant_id", user.id)
    .eq("archived", true)
    .order("name");

  const activeIds = (activeClients ?? []).map((c) => c.id);
  const archivedIds = (archivedClients ?? []).map((c) => c.id);

  const { data: activeUploads } =
    activeIds.length > 0
      ? await supabase
          .from("uploads")
          .select("id, client_id, document_type_id, file_name, month, year, created_at")
          .in("client_id", activeIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const { data: archivedUploads } =
    archivedIds.length > 0
      ? await supabase
          .from("uploads")
          .select("id, client_id, document_type_id, file_name, month, year, created_at")
          .in("client_id", archivedIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const allUploads = [...(activeUploads ?? []), ...(archivedUploads ?? [])];
  const docTypeIds = [...new Set(allUploads.map((u) => u.document_type_id))];
  const { data: docTypes } =
    docTypeIds.length > 0
      ? await supabase
          .from("document_types")
          .select("id, name")
          .in("id", docTypeIds)
      : { data: [] };

  const activeClientOptions: ClientOption[] = (activeClients ?? []).map((c) => ({
    id: c.id,
    name: (c as { name: string }).name,
  }));
  const archivedClientOptions: ClientOption[] = (archivedClients ?? []).map((c) => ({
    id: c.id,
    name: (c as { name: string }).name,
  }));
  const docTypeOptions: DocTypeOption[] = (docTypes ?? []).map((d) => ({
    id: (d as { id: string }).id,
    name: (d as { name: string }).name,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="dash-page-title">Documente</h1>
          <p className="dash-page-sub">
            Foldere doar pentru clienți activi. Clienții arhivați și documentele lor sunt în „Clienți
            arhivați”.
          </p>
        </div>
        <DocumenteExportZipButton
          isPremium={isPremium}
          activeUploads={(activeUploads ?? []) as UploadRow[]}
          archivedUploads={(archivedUploads ?? []) as UploadRow[]}
          activeClientOptions={activeClientOptions}
          archivedClientOptions={archivedClientOptions}
        />
      </header>

      <DocumenteList
        isPremium={isPremium}
        activeUploads={(activeUploads ?? []) as UploadRow[]}
        archivedUploads={(archivedUploads ?? []) as UploadRow[]}
        activeClientOptions={activeClientOptions}
        archivedClientOptions={archivedClientOptions}
        docTypeOptions={docTypeOptions}
      />
    </div>
  );
}
