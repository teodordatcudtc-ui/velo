import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ClientUploadForm } from "./ClientUploadForm";

type ClientWithDocs = {
  id: string;
  name: string;
  accountant_id: string;
  document_types: { id: string; name: string }[] | null;
};

type UploadRow = { document_type_id: string; file_name: string };

export default async function UploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data, error: clientError } = await supabase
    .from("clients")
    .select("id, name, accountant_id, document_types ( id, name )")
    .eq("unique_token", token)
    .single();

  if (clientError || !data) notFound();

  const client = data as unknown as ClientWithDocs;
  const docTypes = client.document_types ?? [];

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", client.accountant_id)
    .single();
  const accountantName = (accountant as { name?: string } | null)?.name ?? "Contabil";

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: uploads } = await supabase
    .from("uploads")
    .select("document_type_id, file_name")
    .eq("client_id", client.id)
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .order("created_at", { ascending: false });

  const initialUploads = ((uploads ?? []) as UploadRow[]).map((u) => ({
    documentTypeId: u.document_type_id,
    file_name: u.file_name,
  }));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--paper)]">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <p className="text-xs font-700 uppercase tracking-wider text-[var(--sage)] mb-2">
            Upload documente
          </p>
          <h1 className="font-[var(--f-display)] text-3xl font-600 text-[var(--ink)] tracking-tight mb-2">
            Trimite documente
          </h1>
          <p className="text-[var(--ink-soft)] text-base">
            Pentru <strong className="text-[var(--ink)]">{client.name}</strong>.
            Nu e nevoie de cont — doar uploadează fișierele cerute.
          </p>
          <p className="text-sm text-[var(--ink-muted)] mt-3">
            Trimiți către: <strong className="text-[var(--ink-soft)]">{accountantName}</strong>
          </p>
        </div>

        {docTypes.length === 0 ? (
          <div className="bg-white border border-[var(--paper-3)] rounded-[var(--r-lg)] p-8 text-center shadow-[var(--shadow-sm)]">
            <p className="text-[var(--ink-muted)]">
              Contabilul nu a setat încă documente de colectat. Revino mai târziu.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[var(--r-xl)] border border-[var(--paper-3)] shadow-[var(--shadow-md)] overflow-hidden">
            <ClientUploadForm
              clientId={client.id}
              documentTypes={docTypes}
              token={token}
              initialUploads={initialUploads}
            />
          </div>
        )}

        <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
          Vel<em className="text-[var(--sage)] not-italic font-semibold">o</em>
        </p>
      </div>
    </main>
  );
}
