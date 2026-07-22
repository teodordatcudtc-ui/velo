"use client";

import { useEffect, useMemo, useState } from "react";
import { ZipScopePicker } from "./ZipScopePicker";
import type { ZipExportScope } from "./zip-export-scope";
import type { UploadRow } from "./page";

export function ClientFolderZipModal({
  open,
  onClose,
  clientName,
  sortedUploads,
  selectedIds,
  isProcessed,
  exportPending,
  onExport,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
  sortedUploads: UploadRow[];
  selectedIds: Set<string>;
  isProcessed: (u: UploadRow) => boolean;
  exportPending: boolean;
  onExport: (scope: ZipExportScope) => void;
}) {
  const unprocessedCount = useMemo(
    () => sortedUploads.filter((u) => !isProcessed(u)).length,
    [sortedUploads, isProcessed]
  );
  const processedCount = useMemo(
    () => sortedUploads.filter((u) => isProcessed(u)).length,
    [sortedUploads, isProcessed]
  );
  const selectedInListCount = useMemo(
    () => sortedUploads.filter((u) => selectedIds.has(u.id)).length,
    [sortedUploads, selectedIds]
  );

  const [scope, setScope] = useState<ZipExportScope>("unprocessed");

  useEffect(() => {
    if (!open) return;
    if (unprocessedCount > 0) setScope("unprocessed");
    else if (selectedInListCount > 0) setScope("selected");
    else if (sortedUploads.length > 0) setScope("filtered");
    else setScope("unprocessed");
  }, [open, unprocessedCount, selectedInListCount, sortedUploads.length]);

  useEffect(() => {
    if (!open) return;
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

  if (!open) return null;

  const scopeOptions = [
    {
      value: "unprocessed" as const,
      label: "Nelucrate",
      description: "Doar documentele nemarcate ca lucrate",
      count: unprocessedCount,
    },
    {
      value: "processed" as const,
      label: "Lucrate",
      description: "Doar documentele deja marcate ca lucrate",
      count: processedCount,
    },
    {
      value: "selected" as const,
      label: "Selectate",
      description: "Doar documentele bifate în listă",
      count: selectedInListCount,
      disabled: selectedInListCount === 0,
    },
    {
      value: "filtered" as const,
      label: "Toate din listă",
      description: "Respectă filtrele curente (tip, lună, an, status)",
      count: sortedUploads.length,
    },
  ];

  const activeCount =
    scope === "unprocessed"
      ? unprocessedCount
      : scope === "processed"
        ? processedCount
        : scope === "selected"
          ? selectedInListCount
          : sortedUploads.length;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-zip-title"
    >
      <div
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={() => !exportPending && onClose()}
      />
      <div
        className="relative w-full max-w-md rounded-[var(--r-lg)] bg-[var(--paper)] border border-[var(--paper-3)] shadow-[var(--shadow-xl)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="client-zip-title"
          className="text-lg font-semibold text-[var(--ink)] mb-1"
        >
          Descarcă ZIP
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          <span className="font-medium text-[var(--ink-soft)]">{clientName}</span>
          {" — "}
          alege ce documente incluzi în arhivă.
        </p>

        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-2">
          Ce documente?
        </label>
        <ZipScopePicker
          value={scope}
          onChange={setScope}
          options={scopeOptions}
          disabled={exportPending}
        />

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
            onClick={() => onExport(scope)}
            disabled={exportPending || activeCount === 0}
          >
            {exportPending ? "Se exportă..." : "Descarcă ZIP"}
          </button>
        </div>
      </div>
    </div>
  );
}
