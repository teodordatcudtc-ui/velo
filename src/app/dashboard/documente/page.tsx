import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumenteList } from "./DocumenteList";

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

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("accountant_id", user.id)
    .order("name");

  const clientIds = (clients ?? []).map((c) => c.id);

  const { data: uploads } =
    clientIds.length > 0
      ? await supabase
          .from("uploads")
          .select("id, client_id, document_type_id, file_name, month, year, created_at")
          .in("client_id", clientIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const docTypeIds = [
    ...new Set((uploads ?? []).map((u) => u.document_type_id)),
  ];
  const { data: docTypes } =
    docTypeIds.length > 0
      ? await supabase
          .from("document_types")
          .select("id, name")
          .in("id", docTypeIds)
      : { data: [] };

  const clientOptions: ClientOption[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: (c as { name: string }).name,
  }));
  const docTypeOptions: DocTypeOption[] = (docTypes ?? []).map((d) => ({
    id: (d as { id: string }).id,
    name: (d as { name: string }).name,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="dash-page-title">Documente</h1>
        <p className="dash-page-sub">
          Documente organizate pe foldere de client. Intră într-un folder pentru filtrare și sortare.
        </p>
      </header>

      <DocumenteList
        uploads={(uploads ?? []) as UploadRow[]}
        clientOptions={clientOptions}
        docTypeOptions={docTypeOptions}
      />
    </div>
  );
}
