"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/app/components/ToastProvider";
import {
  buildClientDocumentsZip,
  downloadZipBlob,
  sanitizeZipFilePart,
} from "@/lib/export-client-zip";
import { ClientFolderZipModal } from "./ClientFolderZipModal";
import {
  filterUploadsByZipScope,
  zipScopeSuffix,
  type ZipExportScope,
} from "./zip-export-scope";
import type { UploadRow, ClientOption, DocTypeOption } from "./page";

const MONTH_NAMES = [
  "Ian.", "Feb.", "Mar.", "Apr.", "Mai", "Iun.",
  "Iul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

type SortBy = "date" | "client" | "type" | "month";
type ProcessedFilter = "" | "pending" | "done";
type Option = { value: string; label: string };

const MONTH_FOLDER_NAMES = [
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

function buildClientFolderZipFileName(
  clientName: string,
  filterMonth: string,
  filterYear: string,
  filterDocType: string,
  docTypeById: Map<string, string>
): string {
  const parts = [sanitizeZipFilePart(clientName)];
  if (filterDocType) {
    parts.push(sanitizeZipFilePart(docTypeById.get(filterDocType) ?? "tip"));
  }
  if (filterMonth) {
    parts.push(MONTH_FOLDER_NAMES[parseInt(filterMonth, 10) - 1] ?? `luna-${filterMonth}`);
  }
  if (filterYear) parts.push(filterYear);
  return `${parts.join("-").replace(/\s+/g, "-").toLowerCase()}.zip`;
}

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 78, height: 78, color: "var(--sage)" }}
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1H3z" />
      <path d="M3 10h18l-1.1 8.1a2 2 0 0 1-2 1.7H6.1a2 2 0 0 1-2-1.7z" />
    </svg>
  );
}

function ClientFolderCard({
  name,
  count,
  unprocessedCount,
  onOpen,
}: {
  name: string;
  count: number;
  unprocessedCount?: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left transition"
      style={{
        width: "100%",
        minHeight: 208,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        padding: "16px 14px 14px",
        border: "1px solid var(--paper-3)",
        outline: "none",
        boxShadow: "none",
        background: "transparent",
        borderRadius: 14,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 116,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FolderIcon />
      </div>
      <div style={{ textAlign: "center", width: "100%" }}>
        <strong
          className="text-sm text-[var(--ink)]"
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </strong>
        <span className="text-xs text-[var(--ink-muted)]">
          {count} {count === 1 ? "document" : "documente"}
          {unprocessedCount != null && unprocessedCount > 0 && (
            <span style={{ color: "var(--sage)", fontWeight: 600 }}>
              {" "}
              · {unprocessedCount} nelucrate
            </span>
          )}
        </span>
      </div>
    </button>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  width = 160,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const inButton = !!buttonRef.current && buttonRef.current.contains(target);
      const inMenu = !!menuRef.current && menuRef.current.contains(target);
      if (!inButton && !inMenu) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function measure() {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setMenuPos({
        top: Math.round(r.bottom + 6),
        left: Math.round(r.left),
        width: Math.round(r.width),
      });
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", width, minWidth: width }}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="dash-input"
        style={{
          width: "100%",
          maxWidth: width,
          padding: "6px 10px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <span>{selected?.label ?? label}</span>
        <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && menuPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid var(--paper-3)",
              borderRadius: "var(--r-md)",
              background: "#fff",
              boxShadow: "var(--shadow-md)",
              zIndex: 50000,
              padding: 6,
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value || "__all"}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background:
                    opt.value === value ? "var(--sage-xlight)" : "transparent",
                  color: opt.value === value ? "var(--sage)" : "var(--ink)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12.5,
                  fontWeight: opt.value === value ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

const docActionBtnStyle: CSSProperties = {
  padding: "4px 9px",
  fontSize: 11.5,
  fontWeight: 600,
  borderRadius: 9999,
  border: "1px solid var(--paper-3)",
  background: "#fff",
  color: "var(--ink-soft)",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

function DocRowActions({
  processed,
  markPending,
  deletePending,
  onOpen,
  downloadHref,
  fileName,
  onToggleProcessed,
  onDelete,
}: {
  processed: boolean;
  markPending: boolean;
  deletePending: boolean;
  onOpen: () => void;
  downloadHref: string;
  fileName: string;
  onToggleProcessed: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 min-w-[220px]">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpen}
          className="hover:border-[var(--sage-light)] hover:text-[var(--sage)]"
          style={docActionBtnStyle}
        >
          Deschide
        </button>
        <a
          href={downloadHref}
          download={fileName}
          className="hover:border-[var(--sage-light)] hover:text-[var(--sage)] no-underline"
          style={docActionBtnStyle}
        >
          Descarcă
        </a>
        <button
          type="button"
          onClick={onDelete}
          disabled={deletePending}
          className="hover:border-[var(--terracotta)] hover:text-[var(--terracotta)] disabled:opacity-50"
          style={{
            ...docActionBtnStyle,
            color: "var(--terracotta)",
          }}
        >
          {deletePending ? "..." : "Șterge"}
        </button>
      </div>
      <button
        type="button"
        disabled={markPending}
        onClick={onToggleProcessed}
        className="disabled:opacity-50 shrink-0"
        style={{
          padding: "5px 11px",
          fontSize: 11.5,
          fontWeight: 700,
          borderRadius: 9999,
          border: processed ? "1.5px solid var(--paper-3)" : "none",
          background: processed ? "var(--paper-2)" : "var(--sage)",
          color: processed ? "var(--ink-muted)" : "#fff",
          boxShadow: processed ? "none" : "0 1px 3px rgba(75, 122, 110, 0.35)",
          whiteSpace: "nowrap",
        }}
        title={processed ? "Marchează din nou ca nelucrat" : "Marchează ca lucrat"}
      >
        {markPending ? "..." : processed ? "✓ Lucrat" : "Marchează lucrat"}
      </button>
    </div>
  );
}

type FolderView = "active" | "archived";

export function DocumenteList({
  canExportZip,
  activeUploads,
  archivedUploads,
  activeClientOptions,
  archivedClientOptions,
  docTypeOptions,
}: {
  canExportZip: boolean;
  activeUploads: UploadRow[];
  archivedUploads: UploadRow[];
  activeClientOptions: ClientOption[];
  archivedClientOptions: ClientOption[];
  docTypeOptions: DocTypeOption[];
}) {
  const toast = useToast();
  const [folderView, setFolderView] = useState<FolderView>("active");
  const [filterDocType, setFilterDocType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterProcessed, setFilterProcessed] = useState<ProcessedFilter>("");
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedOverrides, setProcessedOverrides] = useState<Map<string, string | null>>(
    new Map()
  );
  const [markProcessedPending, setMarkProcessedPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zipExportPending, setZipExportPending] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  function getProcessedAt(u: UploadRow): string | null {
    if (processedOverrides.has(u.id)) {
      return processedOverrides.get(u.id) ?? null;
    }
    return u.processed_at ?? null;
  }

  function isUploadProcessed(u: UploadRow): boolean {
    return getProcessedAt(u) !== null;
  }

  function openClientFolder(clientId: string) {
    setSelectedClientId(clientId);
    setFilterDocType("");
    setFilterMonth("");
    setFilterYear("");
    setFilterProcessed("");
    setSelectedIds(new Set());
    setZipModalOpen(false);
  }

  function clearClientFolder() {
    setSelectedClientId("");
    setFilterDocType("");
    setFilterMonth("");
    setFilterYear("");
    setFilterProcessed("");
    setSelectedIds(new Set());
    setZipModalOpen(false);
  }

  const uploads = folderView === "archived" ? archivedUploads : activeUploads;
  const clientOptions =
    folderView === "archived" ? archivedClientOptions : activeClientOptions;

  const clientById = useMemo(
    () => new Map(clientOptions.map((c) => [c.id, c.name])),
    [clientOptions]
  );
  const docTypeById = useMemo(
    () => new Map(docTypeOptions.map((d) => [d.id, d.name])),
    [docTypeOptions]
  );

  const docsCountByClient = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const u of uploads) {
      countMap.set(u.client_id, (countMap.get(u.client_id) ?? 0) + 1);
    }
    return countMap;
  }, [uploads]);

  const unprocessedCountByClient = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const u of uploads) {
      if (!isUploadProcessed(u)) {
        countMap.set(u.client_id, (countMap.get(u.client_id) ?? 0) + 1);
      }
    }
    return countMap;
  }, [uploads, processedOverrides]);

  const selectedClientUploads = useMemo(() => {
    if (!selectedClientId) return [];
    return uploads.filter((u) => u.client_id === selectedClientId);
  }, [uploads, selectedClientId]);

  const selectedClientName = useMemo(
    () => clientById.get(selectedClientId) ?? "",
    [clientById, selectedClientId]
  );

  const selectedDocTypeOptions = useMemo<Option[]>(() => {
    if (!selectedClientId) return [{ value: "", label: "Tip" }];
    const ids = new Set(selectedClientUploads.map((u) => u.document_type_id));
    const options = docTypeOptions
      .filter((d) => ids.has(d.id))
      .map((d) => ({ value: d.id, label: d.name }));
    return [{ value: "", label: "Tip" }, ...options];
  }, [selectedClientId, selectedClientUploads, docTypeOptions]);

  const selectedYears = useMemo(() => {
    const set = new Set(selectedClientUploads.map((u) => u.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [selectedClientUploads]);

  const monthFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "Lună" }, ...MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name }))],
    []
  );

  const selectedYearFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "An" }, ...selectedYears.map((y) => ({ value: String(y), label: String(y) }))],
    [selectedYears]
  );

  const processedFilterOptions = useMemo<Option[]>(
    () => [
      { value: "", label: "Status" },
      { value: "pending", label: "Nelucrate" },
      { value: "done", label: "Lucrate" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const source = selectedClientId
      ? uploads.filter((u) => u.client_id === selectedClientId)
      : uploads;
    return source.filter((u) => {
      if (filterDocType && u.document_type_id !== filterDocType) return false;
      if (filterMonth && u.month !== parseInt(filterMonth, 10)) return false;
      if (filterYear && u.year !== parseInt(filterYear, 10)) return false;
      const processed = isUploadProcessed(u);
      if (filterProcessed === "pending" && processed) return false;
      if (filterProcessed === "done" && !processed) return false;
      return true;
    });
  }, [
    uploads,
    selectedClientId,
    filterDocType,
    filterMonth,
    filterYear,
    filterProcessed,
    processedOverrides,
  ]);

  const sorted = useMemo(() => {
    const dir = sortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":
          cmp =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "client":
          cmp = (clientById.get(a.client_id) ?? "").localeCompare(
            clientById.get(b.client_id) ?? ""
          );
          break;
        case "type":
          cmp = (docTypeById.get(a.document_type_id) ?? "").localeCompare(
            docTypeById.get(b.document_type_id) ?? ""
          );
          break;
        case "month":
          cmp = a.year - b.year || a.month - b.month;
          break;
        default:
          break;
      }
      return cmp * dir;
    });
  }, [filtered, sortBy, sortDesc, clientById, docTypeById]);

  function toggleSort(field: SortBy) {
    if (sortBy === field) setSortDesc((d) => !d);
    else {
      setSortBy(field);
      setSortDesc(field === "date" ? true : false);
    }
  }

  function openUpload(id: string) {
    window.open(`/api/uploads/${id}`, "_blank");
  }

  async function deleteUpload(id: string) {
    const ok = window.confirm("Sigur vrei sa stergi acest document?");
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Nu pot sterge documentul.");
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Eroare la stergere.");
    } finally {
      setDeletingId(null);
    }
  }

  async function markUploadsProcessed(ids: string[], processed: boolean) {
    if (ids.length === 0) return;
    setMarkProcessedPending(true);
    try {
      const res = await fetch("/api/uploads/mark-processed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: ids, processed }),
      });
      const data = (await res.json()) as { error?: string; processed_at?: string | null };
      if (!res.ok) throw new Error(data.error ?? "Nu am putut actualiza statusul.");

      const ts = processed ? (data.processed_at ?? new Date().toISOString()) : null;
      setProcessedOverrides((prev) => {
        const next = new Map(prev);
        for (const id of ids) next.set(id, ts);
        return next;
      });
      toast.success(
        processed
          ? ids.length === 1
            ? "Document marcat ca lucrat."
            : `${ids.length} documente marcate ca lucrate.`
          : ids.length === 1
            ? "Marcare anulată."
            : `${ids.length} documente marcate ca nelucrate.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare la actualizare.");
    } finally {
      setMarkProcessedPending(false);
    }
  }

  function toggleSelectAllVisible() {
    if (selectedIds.size === sorted.length && sorted.length > 0) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(sorted.map((u) => u.id)));
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getZipExportList(scope: ZipExportScope): UploadRow[] {
    return filterUploadsByZipScope(sorted, scope, selectedIds, isUploadProcessed);
  }

  function handleOpenZipModal() {
    if (!canExportZip) {
      toast.info(
        "Export ZIP este disponibil pe planurile Standard și Premium. Alege un abonament din Abonamente."
      );
      return;
    }
    if (sorted.length === 0) {
      toast.info("Nu există documente de exportat.");
      return;
    }
    setZipModalOpen(true);
  }

  async function handleClientFolderZipExport(scope: ZipExportScope) {
    const toExport = getZipExportList(scope);
    if (scope === "selected" && selectedIds.size === 0) {
      toast.info("Bifează documentele pe care vrei să le incluzi în ZIP.");
      return;
    }
    if (toExport.length === 0) {
      toast.info(
        scope === "unprocessed"
          ? "Nu există documente nelucrate pentru export."
          : scope === "processed"
            ? "Nu există documente lucrate pentru export."
            : "Nu există documente de exportat."
      );
      return;
    }

    setZipExportPending(true);
    try {
      const clientNameById = new Map([[selectedClientId, selectedClientName]]);
      const { blob, exportedCount, failed } = await buildClientDocumentsZip(
        toExport,
        clientNameById
      );

      if (exportedCount === 0) {
        toast.error("Nu am putut exporta niciun fișier.");
        if (failed.length > 0) toast.info(`Eșecuri: ${failed.join(" | ")}`);
        return;
      }

      const suffix = zipScopeSuffix(scope);
      const baseName = buildClientFolderZipFileName(
        selectedClientName,
        filterMonth,
        filterYear,
        filterDocType,
        docTypeById
      );
      const fileName = suffix
        ? baseName.replace(/\.zip$/i, `-${suffix}.zip`)
        : baseName;

      downloadZipBlob(blob, fileName);
      toast.success(`ZIP exportat cu ${exportedCount} fișiere.`);
      if (failed.length > 0) {
        toast.info(`Fișiere neexportate: ${failed.join(" | ")}`);
      }
      setZipModalOpen(false);
    } catch {
      toast.error("A apărut o eroare la exportul ZIP.");
    } finally {
      setZipExportPending(false);
    }
  }

  function switchFolderView(next: FolderView) {
    setFolderView(next);
    clearClientFolder();
  }

  function FolderViewToggle({ className = "" }: { className?: string }) {
    if (folderView === "active") {
      if (archivedClientOptions.length === 0) return null;
      return (
        <button
          type="button"
          onClick={() => switchFolderView("archived")}
          className={`inline-flex items-center gap-2 text-sm font-medium ${className}`}
          style={{
            padding: "8px 14px",
            borderRadius: 9999,
            border: "1.5px solid var(--paper-3)",
            background: "var(--paper-2)",
            color: "var(--ink-soft)",
          }}
        >
          Clienți arhivați
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: 999,
              background: "var(--ink-muted)",
              color: "#fff",
            }}
          >
            {archivedClientOptions.length}
          </span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => switchFolderView("active")}
        className={`inline-flex items-center gap-2 text-sm font-semibold ${className}`}
        style={{
          padding: "8px 14px",
          borderRadius: 9999,
          border: "none",
          background: "var(--sage)",
          color: "#fff",
        }}
      >
        ← Clienți activi
      </button>
    );
  }

  if (uploads.length === 0) {
    if (folderView === "archived") {
      return (
        <div className="space-y-4">
          <FolderViewToggle />
          <div className="dash-card-empty">
            {archivedClientOptions.length === 0
              ? "Nu ai clienți arhivați."
              : "Niciun document la clienții arhivați."}
          </div>
        </div>
      );
    }
    if (clientOptions.length === 0) {
      return (
        <div className="dash-card-empty">
          Nu există încă clienți. Adaugă primul client și vei vedea aici folderul lui
          cu documente.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <FolderViewToggle />
        <div className="dash-card">
          <p className="text-sm text-[var(--ink-muted)] mb-4">
            Alege un folder de client. Documentele vor apărea în interior după încărcare.
          </p>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
          >
            {clientOptions.map((client) => (
              <ClientFolderCard
                key={client.id}
                name={client.name}
                count={0}
                onOpen={() => openClientFolder(client.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedClientId) {
    return (
      <div className="space-y-4">
        <FolderViewToggle />
        <div className="dash-card">
          <p className="text-sm text-[var(--ink-muted)] mb-1">
            {folderView === "archived"
              ? "Clienți arhivați — documentele rămân disponibile aici."
              : "Deschide folderul unui client ca să vezi documentele lui."}
          </p>
          {folderView === "archived" && (
            <p className="text-xs text-[var(--ink-muted)] mb-4">
              Acești clienți nu mai apar în lista principală de clienți activi.
            </p>
          )}
          {folderView === "active" && <div className="mb-4" />}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
          >
            {clientOptions.map((client) => (
              <ClientFolderCard
                key={client.id}
                name={client.name}
                count={docsCountByClient.get(client.id) ?? 0}
                unprocessedCount={unprocessedCountByClient.get(client.id) ?? 0}
                onOpen={() => openClientFolder(client.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FolderViewToggle />
      <div className="dash-card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <button
          type="button"
          onClick={clearClientFolder}
          className="inline-flex items-center justify-center text-sm font-semibold"
          style={{
            background: "var(--sage)",
            color: "#fff",
            border: "none",
            borderRadius: 9999,
            padding: "8px 14px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          ← Înapoi la foldere
        </button>
        <div className="text-sm text-[var(--ink)]">
          <strong>{selectedClientName}</strong>
          {folderView === "archived" && (
            <span
              className="ml-2 text-xs font-medium"
              style={{ color: "var(--ink-muted)" }}
            >
              (arhivat)
            </span>
          )}
        </div>
      </div>
      <div
        className="flex flex-nowrap items-center gap-2 mb-4 pb-4 border-b border-[var(--paper-3)]"
        style={{ overflowX: "auto", overflowY: "visible", position: "relative", zIndex: 10 }}
      >
        <span className="text-xs font-medium text-[var(--ink-muted)] shrink-0">
          Filtre:
        </span>
        <FilterDropdown
          label="Tip"
          value={filterDocType}
          options={selectedDocTypeOptions}
          onChange={setFilterDocType}
          width={120}
        />
        <FilterDropdown
          label="Lună"
          value={filterMonth}
          options={monthFilterOptions}
          onChange={setFilterMonth}
          width={92}
        />
        <FilterDropdown
          label="An"
          value={filterYear}
          options={selectedYearFilterOptions}
          onChange={setFilterYear}
          width={96}
        />
        <FilterDropdown
          label="Status"
          value={filterProcessed}
          options={processedFilterOptions}
          onChange={(v) => setFilterProcessed(v as ProcessedFilter)}
          width={108}
        />
        <span className="text-xs text-[var(--ink-muted)] shrink-0 ml-0.5">
          {sorted.length} doc.
        </span>
        <button
          type="button"
          disabled={sorted.length === 0 || zipExportPending}
          onClick={handleOpenZipModal}
          className="inline-flex items-center gap-1.5 shrink-0 ml-auto text-xs font-semibold disabled:opacity-50"
          style={{
            padding: "6px 12px",
            borderRadius: 9999,
            border: "1.5px solid var(--paper-3)",
            background: "var(--paper-2)",
            color: "var(--ink-soft)",
          }}
          title={
            canExportZip
              ? "Alege ce documente incluzi în ZIP"
              : "Disponibil pe Standard și Premium"
          }
        >
          <svg
            width="13"
            height="13"
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
          {zipExportPending ? "Se exportă..." : "Descarcă ZIP"}
          {!canExportZip && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 999,
                background: "var(--amber-light)",
                color: "#9C6B10",
              }}
            >
              Standard
            </span>
          )}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)] py-6 text-center">
          Niciun document nu corespunde filtrelor.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-3)] text-left">
                <th className="py-2 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && selectedIds.size === sorted.length}
                    onChange={toggleSelectAllVisible}
                    aria-label="Selectează toate"
                    className="shrink-0"
                  />
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)] w-[88px]">
                  Status
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)]">
                  <button
                    type="button"
                    onClick={() => toggleSort("client")}
                    className="hover:text-[var(--ink)]"
                  >
                    Client {sortBy === "client" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)]">
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="hover:text-[var(--ink)]"
                  >
                    Tip document {sortBy === "type" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)]">
                  Fișier
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)]">
                  <button
                    type="button"
                    onClick={() => toggleSort("month")}
                    className="hover:text-[var(--ink)]"
                  >
                    Lună / An {sortBy === "month" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="py-2 pr-4 font-600 text-[var(--ink-muted)]">
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className="hover:text-[var(--ink)]"
                  >
                    Data {sortBy === "date" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="py-2 font-600 text-[var(--ink-muted)]">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => {
                const processed = isUploadProcessed(u);
                return (
                <tr
                  key={u.id}
                  className="border-b border-[var(--paper-3)] last:border-0"
                  style={processed ? { opacity: 0.72 } : undefined}
                >
                  <td className="py-2.5 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelectOne(u.id)}
                      aria-label={`Selectează ${u.file_name}`}
                      className="shrink-0"
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: processed ? "var(--paper-3)" : "var(--sage-xlight)",
                        color: processed ? "var(--ink-muted)" : "var(--sage)",
                      }}
                    >
                      {processed ? "Lucrat" : "Nelucrat"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--ink)]">{selectedClientName}</td>
                  <td className="py-2.5 pr-4 text-[var(--ink-soft)]">
                    {docTypeById.get(u.document_type_id) ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--ink)]">
                    {u.file_name}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--ink-muted)]">
                    {MONTH_NAMES[u.month - 1]} {u.year}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--ink-muted)]">
                    {new Date(u.created_at).toLocaleDateString("ro-RO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2.5">
                    <DocRowActions
                      processed={processed}
                      markPending={markProcessedPending}
                      deletePending={deletingId === u.id}
                      onOpen={() => openUpload(u.id)}
                      downloadHref={`/api/uploads/${u.id}?download=1`}
                      fileName={u.file_name}
                      onToggleProcessed={() =>
                        void markUploadsProcessed([u.id], !processed)
                      }
                      onDelete={() => deleteUpload(u.id)}
                    />
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[var(--paper-3)]"
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--paper)",
            zIndex: 5,
          }}
        >
          <span className="text-sm font-semibold text-[var(--ink)]">
            {selectedIds.size}{" "}
            {selectedIds.size === 1 ? "selectat" : "selectate"}
          </span>
          <button
            type="button"
            disabled={markProcessedPending}
            onClick={() => void markUploadsProcessed([...selectedIds], true)}
            className="text-xs font-semibold disabled:opacity-50"
            style={{
              padding: "6px 12px",
              borderRadius: 9999,
              border: "none",
              background: "var(--sage)",
              color: "#fff",
            }}
          >
            Marchează lucrat
          </button>
          <button
            type="button"
            disabled={markProcessedPending}
            onClick={() => void markUploadsProcessed([...selectedIds], false)}
            className="text-xs font-semibold disabled:opacity-50"
            style={{
              padding: "6px 12px",
              borderRadius: 9999,
              border: "1.5px solid var(--paper-3)",
              background: "var(--paper-2)",
              color: "var(--ink-soft)",
            }}
          >
            Marchează nelucrat
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] ml-auto"
          >
            Anulează selecția
          </button>
        </div>
      )}
      <ClientFolderZipModal
        open={zipModalOpen}
        onClose={() => !zipExportPending && setZipModalOpen(false)}
        clientName={selectedClientName}
        sortedUploads={sorted}
        selectedIds={selectedIds}
        isProcessed={isUploadProcessed}
        exportPending={zipExportPending}
        onExport={(scope) => void handleClientFolderZipExport(scope)}
      />
      </div>
    </div>
  );
}
