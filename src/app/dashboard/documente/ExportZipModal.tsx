"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import {
  buildClientDocumentsZip,
  downloadZipBlob,
} from "@/lib/export-client-zip";
import type { ClientOption, UploadRow } from "./page";

const MONTH_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export type ExportPeriodMode =
  | "current_month"
  | "previous_month"
  | "current_year"
  | "all"
  | "custom";

function filterUploadsByPeriod(
  uploads: UploadRow[],
  mode: ExportPeriodMode,
  customMonth: string,
  customYear: string
): UploadRow[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (mode === "all") return uploads;

  if (mode === "current_month") {
    return uploads.filter(
      (u) => u.month === currentMonth && u.year === currentYear
    );
  }

  if (mode === "previous_month") {
    const prev = new Date(currentYear, currentMonth - 2, 1);
    const pm = prev.getMonth() + 1;
    const py = prev.getFullYear();
    return uploads.filter((u) => u.month === pm && u.year === py);
  }

  if (mode === "current_year") {
    return uploads.filter((u) => u.year === currentYear);
  }

  const month = customMonth ? parseInt(customMonth, 10) : null;
  const year = customYear ? parseInt(customYear, 10) : null;
  return uploads.filter((u) => {
    if (month && u.month !== month) return false;
    if (year && u.year !== year) return false;
    return true;
  });
}

function periodLabel(
  mode: ExportPeriodMode,
  customMonth: string,
  customYear: string
): string {
  const now = new Date();
  if (mode === "current_month") {
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }
  if (mode === "previous_month") {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${MONTH_NAMES[prev.getMonth()]} ${prev.getFullYear()}`;
  }
  if (mode === "current_year") return String(now.getFullYear());
  if (mode === "all") return "toate";
  const parts: string[] = [];
  if (customMonth) parts.push(MONTH_NAMES[parseInt(customMonth, 10) - 1]);
  if (customYear) parts.push(customYear);
  return parts.length > 0 ? parts.join("-") : "personalizat";
}

export function ExportZipModal({
  open,
  onClose,
  activeUploads,
  archivedUploads,
  activeClientOptions,
  archivedClientOptions,
}: {
  open: boolean;
  onClose: () => void;
  activeUploads: UploadRow[];
  archivedUploads: UploadRow[];
  activeClientOptions: ClientOption[];
  archivedClientOptions: ClientOption[];
}) {
  const toast = useToast();
  const [periodMode, setPeriodMode] = useState<ExportPeriodMode>("current_month");
  const [customMonth, setCustomMonth] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportPending, setExportPending] = useState(false);

  const allUploads = useMemo(
    () => [...activeUploads, ...archivedUploads],
    [activeUploads, archivedUploads]
  );

  const allClients = useMemo(() => {
    const merged = new Map<string, ClientOption>();
    for (const c of activeClientOptions) merged.set(c.id, c);
    for (const c of archivedClientOptions) {
      if (!merged.has(c.id)) merged.set(c.id, c);
    }
    return Array.from(merged.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ro")
    );
  }, [activeClientOptions, archivedClientOptions]);

  const periodUploads = useMemo(
    () => filterUploadsByPeriod(allUploads, periodMode, customMonth, customYear),
    [allUploads, periodMode, customMonth, customYear]
  );

  const clientsWithDocs = useMemo(() => {
    const ids = new Set(periodUploads.map((u) => u.client_id));
    return allClients.filter((c) => ids.has(c.id));
  }, [allClients, periodUploads]);

  const yearOptions = useMemo(() => {
    const set = new Set(allUploads.map((u) => u.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [allUploads]);

  useEffect(() => {
    if (!open) return;
    setPeriodMode("current_month");
    setCustomMonth("");
    setCustomYear("");
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exportPending) onClose();
    };
    document.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [open, exportPending, onClose]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set(clientsWithDocs.map((c) => c.id)));
  }, [open, periodMode, customMonth, customYear, clientsWithDocs]);

  const allSelected =
    clientsWithDocs.length > 0 && selectedIds.size === clientsWithDocs.length;

  function toggleClient(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clientsWithDocs.map((c) => c.id)));
    }
  }

  async function handleExport() {
    if (selectedIds.size === 0) {
      toast.info("Selectează cel puțin un client.");
      return;
    }

    const toExport = periodUploads.filter((u) => selectedIds.has(u.client_id));
    if (toExport.length === 0) {
      toast.info("Nu există documente de exportat pentru selecția curentă.");
      return;
    }

    const clientNameById = new Map(allClients.map((c) => [c.id, c.name]));
    setExportPending(true);
    try {
      const { blob, exportedCount, failed } = await buildClientDocumentsZip(
        toExport,
        clientNameById
      );

      if (exportedCount === 0) {
        toast.error("Nu am putut exporta niciun fișier.");
        if (failed.length > 0) toast.info(`Eșecuri: ${failed.join(" | ")}`);
        return;
      }

      const suffix = periodLabel(periodMode, customMonth, customYear)
        .replace(/\s+/g, "-")
        .toLowerCase();
      downloadZipBlob(blob, `documente-${suffix}.zip`);
      toast.success(`ZIP exportat cu ${exportedCount} fișiere.`);
      if (failed.length > 0) {
        toast.info(`Fișiere neexportate: ${failed.join(" | ")}`);
      }
      onClose();
    } catch {
      toast.error("A apărut o eroare la exportul ZIP.");
    } finally {
      setExportPending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-zip-title"
    >
      <div
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={() => !exportPending && onClose()}
      />
      <div
        className="relative w-full max-w-lg rounded-[var(--r-lg)] bg-[var(--paper)] border border-[var(--paper-3)] shadow-[var(--shadow-xl)] p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="export-zip-title"
          className="text-lg font-semibold text-[var(--ink)] mb-1"
        >
          Export ZIP
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          Alege perioada și clienții. Fișierele sunt grupate pe foldere per client.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-2">
              Perioadă
            </label>
            <select
              className="dash-input w-full"
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value as ExportPeriodMode)}
              disabled={exportPending}
            >
              <option value="current_month">Luna curentă</option>
              <option value="previous_month">Luna anterioară</option>
              <option value="current_year">Anul curent</option>
              <option value="custom">Lună / an specific</option>
              <option value="all">Toate documentele</option>
            </select>
            {periodMode === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  className="dash-input w-full"
                  value={customMonth}
                  onChange={(e) => setCustomMonth(e.target.value)}
                  disabled={exportPending}
                >
                  <option value="">Toate lunile</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={String(i + 1)}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  className="dash-input w-full"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  disabled={exportPending}
                >
                  <option value="">Toți anii</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Clienți ({selectedIds.size}/{clientsWithDocs.length})
              </label>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--sage)] hover:underline disabled:opacity-50"
                onClick={toggleSelectAll}
                disabled={exportPending || clientsWithDocs.length === 0}
              >
                {allSelected ? "Deselectează tot" : "Selectează tot"}
              </button>
            </div>
            {clientsWithDocs.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)] py-3 text-center border border-dashed border-[var(--paper-3)] rounded-[var(--r-md)]">
                Niciun document în perioada aleasă.
              </p>
            ) : (
              <ul
                className="border border-[var(--paper-3)] rounded-[var(--r-md)] divide-y divide-[var(--paper-3)] max-h-52 overflow-y-auto"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {clientsWithDocs.map((client) => {
                  const count = periodUploads.filter(
                    (u) => u.client_id === client.id
                  ).length;
                  const checked = selectedIds.has(client.id);
                  return (
                    <li key={client.id}>
                      <label
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--paper-2)]"
                        style={{ margin: 0 }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClient(client.id)}
                          disabled={exportPending}
                          className="shrink-0"
                        />
                        <span className="flex-1 text-sm text-[var(--ink)] truncate">
                          {client.name}
                        </span>
                        <span className="text-xs text-[var(--ink-muted)] shrink-0">
                          {count} doc.
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end mt-6">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={exportPending}
          >
            Anulare
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exportPending || clientsWithDocs.length === 0}
          >
            {exportPending ? "Se exportă..." : "Descarcă ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumenteExportZipButton({
  isPremium,
  activeUploads,
  archivedUploads,
  activeClientOptions,
  archivedClientOptions,
}: {
  isPremium: boolean;
  activeUploads: UploadRow[];
  archivedUploads: UploadRow[];
  activeClientOptions: ClientOption[];
  archivedClientOptions: ClientOption[];
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (!isPremium) {
      toast.info(
        "Export ZIP este disponibil doar pe planul Premium. Activează Premium din Abonamente."
      );
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary inline-flex items-center gap-2"
        onClick={handleClick}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Export ZIP
        {!isPremium && (
          <span
            className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ background: "var(--amber-light)", color: "#9C6B10" }}
          >
            Premium
          </span>
        )}
      </button>
      {isPremium && (
        <ExportZipModal
          open={open}
          onClose={() => setOpen(false)}
          activeUploads={activeUploads}
          archivedUploads={archivedUploads}
          activeClientOptions={activeClientOptions}
          archivedClientOptions={archivedClientOptions}
        />
      )}
    </>
  );
}
