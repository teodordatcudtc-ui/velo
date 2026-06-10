import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAnafConnectionByClientId } from "@/lib/supabase/client-anaf";
import {
  resolveDefaultUploadPeriod,
  resolveUploadDocTypes,
} from "@/lib/upload-requested-docs";
import { SpvConnectCard } from "./SpvConnectCard";
import { UploadPageShell } from "./UploadPageShell";

type ClientWithDocs = {
  id: string;
  name: string;
  accountant_id: string;
  document_types: { id: string; name: string }[] | null;
};

type UploadRow = {
  id: string;
  document_type_id: string;
  file_name: string;
  month: number;
  year: number;
};

export const dynamic = "force-dynamic";

export default async function UploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ spv?: string; spv_error?: string }>;
}) {
  const { token } = await params;
  const spvQuery = await searchParams;
  const supabase = createAdminClient();

  const { data, error: clientError } = await supabase
    .from("clients")
    .select("id, name, accountant_id, document_types ( id, name )")
    .eq("unique_token", token)
    .single();

  if (clientError || !data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--paper)]">
        <div className="w-full max-w-xl text-center">
          <p className="text-xs font-700 uppercase tracking-wider text-[var(--terracotta)] mb-2">
            Link invalid sau expirat
          </p>
          <h1 className="font-[var(--f-display)] text-2xl font-600 text-[var(--ink)] tracking-tight mb-3">
            Acest link de încărcare nu mai este activ.
          </h1>
          <p className="text-[var(--ink-soft)] text-base mb-4">
            Te rugăm să contactezi contabilul tău pentru un nou link de încărcare a documentelor.
          </p>
          <p className="text-xs text-[var(--ink-muted)]">
            Dacă ai deschis acest link dintr-un email mai vechi, este posibil să fi fost înlocuit cu unul nou.
          </p>
        </div>
      </main>
    );
  }

  const client = data as unknown as ClientWithDocs;
  const allDocTypes = client.document_types ?? [];
  const defaultPeriod = await resolveDefaultUploadPeriod(supabase, client.id);
  const docTypes = await resolveUploadDocTypes(
    supabase,
    client.id,
    allDocTypes,
    defaultPeriod
  );
  const requestFiltersTypes =
    allDocTypes.length > 0 && docTypes.length > 0 && docTypes.length < allDocTypes.length;

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", client.accountant_id)
    .single();
  const accountantName = (accountant as { name?: string } | null)?.name ?? "Contabil";

  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, document_type_id, file_name, month, year")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const allUploads = ((uploads ?? []) as UploadRow[]).map((u) => ({
    id: u.id,
    documentTypeId: u.document_type_id,
    file_name: u.file_name,
    month: u.month,
    year: u.year,
  }));

  const { data: spvConn } = await getClientAnafConnectionByClientId(
    supabase,
    client.id,
    "company_cif, oauth_refresh_token, connected_at, last_synced_at, last_error"
  );

  const spvInitial = {
    connected: !!spvConn?.oauth_refresh_token?.trim(),
    companyCif: spvConn?.company_cif ?? null,
    connectedAt: spvConn?.connected_at ?? null,
    lastSyncedAt: spvConn?.last_synced_at ?? null,
    lastError: spvConn?.last_error ?? null,
  };

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
          {requestFiltersTypes && (
            <p className="text-sm text-[var(--sage)] mt-2 font-medium">
              Documente solicitate: {docTypes.map((d) => d.name).join(", ")}
            </p>
          )}
        </div>

        {docTypes.length === 0 ? (
          <div className="bg-white border border-[var(--paper-3)] rounded-[var(--r-lg)] p-8 text-center shadow-[var(--shadow-sm)]">
            <p className="text-[var(--ink-muted)]">
              Contabilul nu a setat încă documente de colectat. Revino mai târziu.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[var(--r-xl)] border border-[var(--paper-3)] shadow-[var(--shadow-md)] overflow-hidden">
            <UploadPageShell
              clientId={client.id}
              documentTypes={docTypes}
              token={token}
              allUploads={allUploads}
              defaultPeriod={defaultPeriod}
            />
          </div>
        )}

        <SpvConnectCard
          token={token}
          clientName={client.name}
          initial={spvInitial}
          spvQuery={spvQuery}
        />

        <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
          Vel<em className="text-[var(--sage)] not-italic font-semibold">lo</em>
        </p>
      </div>
    </main>
  );
}
