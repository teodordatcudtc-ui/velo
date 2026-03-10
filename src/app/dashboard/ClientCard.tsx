"use client";

import { useState, useEffect } from "react";
import { addDocumentType, removeDocumentType, removeClient, updateClientReminder } from "@/app/actions/clients";
import { useToast } from "@/app/components/ToastProvider";
import { ConfirmModal } from "@/app/components/ConfirmModal";

type DocType = { id: string; name: string };
type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  unique_token: string;
  reminder_enabled: boolean;
  reminder_day_of_month: number | null;
  document_types: DocType[] | null;
};
type Upload = {
  id: string;
  client_id: string;
  document_type_id: string;
  file_name: string;
  month: number;
  year: number;
  created_at: string;
};

export function ClientCard({
  client,
  uploads,
  currentMonth,
  currentYear,
}: {
  client: Client;
  uploads: Upload[];
  currentMonth: number;
  currentYear: number;
}) {
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reminderPending, setReminderPending] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(client.reminder_enabled);
  const [reminderDay, setReminderDay] = useState<number>(
    client.reminder_day_of_month ?? 1
  );
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setReminderEnabled(client.reminder_enabled);
    setReminderDay(client.reminder_day_of_month ?? 1);
  }, [client.id, client.reminder_enabled, client.reminder_day_of_month]);

  const docTypes = client.document_types ?? [];
  const uploadsThisMonth = uploads.filter(
    (u) => u.month === currentMonth && u.year === currentYear
  );
  const latestUploadByType = (() => {
    const byType = new Map<string, Upload>();
    for (const u of uploadsThisMonth) {
      const existing = byType.get(u.document_type_id);
      if (
        !existing ||
        new Date(u.created_at).getTime() > new Date(existing.created_at).getTime()
      ) {
        byType.set(u.document_type_id, u);
      }
    }
    return byType;
  })();
  const uploadedTypeIds = new Set(latestUploadByType.keys());

  const monthNamesRo = [
    "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
    "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
  ];
  const uploadsByPeriod = (() => {
    const sorted = [...uploads].sort(
      (a, b) => b.year - a.year || b.month - a.month
    );
    const groups: { year: number; month: number; items: Upload[] }[] = [];
    for (const u of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.year === u.year && last.month === u.month) {
        last.items.push(u);
      } else {
        groups.push({ year: u.year, month: u.month, items: [u] });
      }
    }
    return groups;
  })();
  function docTypeName(docTypeId: string) {
    return docTypes.find((d) => d.id === docTypeId)?.name ?? "Document";
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "https://vello.ro";
  const uploadLink = `${baseUrl}/upload/${client.unique_token}`;

  async function handleAddDoc(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await addDocumentType(client.id, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Tip document adăugat.");
    setShowAddDoc(false);
    (document.getElementById(`add-doc-${client.id}`) as HTMLFormElement)?.reset();
  }

  async function handleRemoveDoc(docId: string) {
    setPending(true);
    await removeDocumentType(docId);
    setPending(false);
  }

  async function handleReminderSubmit(formData: FormData) {
    setError(null);
    setReminderPending(true);
    const result = await updateClientReminder(client.id, formData);
    setReminderPending(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Reminder salvat.");
    }
  }

  async function saveReminder(enabled: boolean, day: number) {
    const fd = new FormData();
    fd.set("reminder_enabled", enabled ? "on" : "off");
    fd.set("reminder_day_of_month", String(day));
    await handleReminderSubmit(fd);
  }

  function handleReminderDayClick(day: number) {
    setReminderDay(day);
    setShowDayPicker(false);
    saveReminder(reminderEnabled, day);
  }

  function handleReminderToggle(checked: boolean) {
    setReminderEnabled(checked);
    saveReminder(checked, reminderDay);
  }

  async function doDeleteClient() {
    setDeleting(true);
    setShowDeleteConfirm(false);
    setError(null);
    const result = await removeClient(client.id);
    setDeleting(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Client șters.");
    }
  }

  return (
    <li className="dash-card">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold text-[var(--ink)]">{client.name}</h3>
          {client.email && (
            <p className="text-sm text-[var(--ink-soft)]">{client.email}</p>
          )}
          {client.phone && (
            <p className="text-sm text-[var(--ink-soft)]">{client.phone}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--ink-muted)]">Link:</span>
          <input
            readOnly
            value={uploadLink}
            className="dash-input w-[220px] text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(uploadLink);
                toast.success("Link copiat în clipboard.");
              } catch {
                toast.error("Nu s-a putut copia linkul.");
              }
            }}
            className="text-sm text-[var(--sage)] hover:underline"
          >
            Copiază
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3 py-2">
        <input
          id={`reminder-${client.id}`}
          type="checkbox"
          checked={reminderEnabled}
          onChange={(e) => handleReminderToggle(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--paper-3)] text-[var(--sage)]"
        />
        <label
          htmlFor={`reminder-${client.id}`}
          className="text-sm text-[var(--ink-soft)]"
        >
          Email lunar ziua
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDayPicker((v) => !v)}
            disabled={!reminderEnabled}
            className="dash-input w-12 h-9 text-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Alege ziua"
          >
            {reminderDay}
          </button>
          {showDayPicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setShowDayPicker(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 p-2 bg-[var(--paper)] border border-[var(--paper-3)] rounded-lg shadow-lg">
                <p className="text-xs text-[var(--ink-muted)] mb-2 px-1">
                  Ziua lunii
                </p>
                <div className="grid grid-cols-7 gap-0.5 w-[196px]">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleReminderDayClick(d)}
                      className={`w-7 h-7 text-xs rounded ${
                        reminderDay === d
                          ? "bg-[var(--sage)] text-white"
                          : "bg-[var(--paper-2)] hover:bg-[var(--paper-3)] text-[var(--ink)]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <span className="text-sm text-[var(--ink-muted)]">a lunii</span>
        {reminderPending && (
          <span className="text-xs text-[var(--ink-muted)]">Se salvează...</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-[var(--terracotta)] mb-2">{error}</p>
      )}

      <div className="mb-3">
        <span className="text-sm text-[var(--ink-soft)]">Documente lunar: </span>
        {docTypes.length === 0 ? (
          <span className="text-sm text-[var(--ink-muted)]">—</span>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {docTypes.map((dt) => {
              const uploaded = uploadedTypeIds.has(dt.id);
              const upload = latestUploadByType.get(dt.id);
              return (
                <li
                  key={dt.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className={uploaded ? "text-[var(--sage)]" : "text-[var(--ink)]"}>
                    {dt.name}
                    <span className="text-[var(--ink-muted)] font-normal ml-1">
                      {upload ? `— ${upload.file_name}` : "— Netrimis"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {upload && (
                      <>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/uploads/${upload.id}`, "_blank")}
                          className="text-[var(--sage)] hover:underline text-xs"
                        >
                          Deschide
                        </button>
                        <a
                          href={`/api/uploads/${upload.id}?download=1`}
                          download={upload.file_name}
                          className="text-[var(--sage)] hover:underline text-xs"
                        >
                          Descarcă
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(dt.id)}
                      disabled={pending}
                      className="text-[var(--terracotta)] hover:underline text-xs disabled:opacity-50"
                    >
                      Șterge
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showAddDoc ? (
        <form
          id={`add-doc-${client.id}`}
          action={handleAddDoc}
          className="flex gap-2 items-center flex-wrap mb-3"
        >
          <input
            name="name"
            required
            placeholder="Ex: Facturi, Extras bancar"
            className="dash-input flex-1 min-w-[160px] text-sm"
          />
          <button type="submit" disabled={pending} className="btn btn-primary text-sm">
            Adaugă
          </button>
          <button
            type="button"
            onClick={() => setShowAddDoc(false)}
            className="btn btn-ghost text-sm text-[var(--ink-muted)]"
          >
            Anulare
          </button>
          {error && (
            <p className="text-sm text-[var(--terracotta)] w-full">{error}</p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddDoc(true)}
          className="text-sm text-[var(--sage)] hover:underline mb-3"
        >
          + Adaugă tip document
        </button>
      )}

      <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-[var(--paper-3)]">
        <button
          type="button"
          onClick={() => setShowHistory((h) => !h)}
          className="text-sm text-[var(--ink-muted)] hover:text-[var(--sage)]"
        >
          {showHistory ? "Ascunde istoric" : "Istoric"}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting || pending}
          className="text-sm text-[var(--terracotta)] hover:underline disabled:opacity-50"
        >
          Șterge client
        </button>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Ștergere client"
        message={`Sigur vrei să ștergi clientul „${client.name}"? Se vor șterge și toate tipurile de documente și înregistrările de upload.`}
        confirmLabel="Șterge client"
        cancelLabel="Anulare"
        variant="danger"
        loading={deleting}
        onConfirm={doDeleteClient}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showHistory && (
        <div className="mt-3 pt-3 border-t border-[var(--paper-3)]">
          {uploadsByPeriod.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">Niciun document trimis.</p>
          ) : (
            <div className="space-y-3">
              {uploadsByPeriod.map(({ year, month, items }) => (
                <div key={`${year}-${month}`} className="space-y-1">
                  <p className="text-xs text-[var(--ink-muted)]">
                    {monthNamesRo[month - 1]} {year}
                  </p>
                  <ul className="space-y-1 pl-0">
                    {items.map((u) => (
                      <li
                        key={u.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-[var(--ink-soft)]">
                          {docTypeName(u.document_type_id)} — {u.file_name}
                        </span>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/api/uploads/${u.id}`, "_blank")}
                            className="text-[var(--sage)] hover:underline text-xs"
                          >
                            Deschide
                          </button>
                          <a
                            href={`/api/uploads/${u.id}?download=1`}
                            download={u.file_name}
                            className="text-[var(--sage)] hover:underline text-xs"
                          >
                            Descarcă
                          </a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
