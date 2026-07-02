"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/app/components/ToastProvider";
import {
  buildClientDocumentsZip,
  downloadZipBlob,
  sanitizeZipFilePart,
} from "@/lib/export-client-zip";
import type { UploadRow, ClientOption, DocTypeOption } from "./page";

const MONTH_NAMES = [
  "Ian.", "Feb.", "Mar.", "Apr.", "Mai", "Iun.",
  "Iul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

type SortBy = "date" | "client" | "type" | "month";
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
  onOpen,
}: {
  name: string;
  count: number;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zipExportPending, setZipExportPending] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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

  const filtered = useMemo(() => {
    const source = selectedClientId
      ? uploads.filter((u) => u.client_id === selectedClientId)
      : uploads;
    return source.filter((u) => {
      if (filterDocType && u.document_type_id !== filterDocType) return false;
      if (filterMonth && u.month !== parseInt(filterMonth, 10)) return false;
      if (filterYear && u.year !== parseInt(filterYear, 10)) return false;
      return true;
    });
  }, [uploads, selectedClientId, filterDocType, filterMonth, filterYear]);

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

  async function handleClientFolderZipExport() {
    if (!canExportZip) {
      toast.info(
        "Export ZIP este disponibil pe planurile Standard și Premium. Alege un abonament din Abonamente."
      );
      return;
    }
    if (filtered.length === 0) {
      toast.info("Nu există documente de exportat pentru filtrele curente.");
      return;
    }

    setZipExportPending(true);
    try {
      const clientNameById = new Map([[selectedClientId, selectedClientName]]);
      const { blob, exportedCount, failed } = await buildClientDocumentsZip(
        filtered,
        clientNameById
      );

      if (exportedCount === 0) {
        toast.error("Nu am putut exporta niciun fișier.");
        if (failed.length > 0) toast.info(`Eșecuri: ${failed.join(" | ")}`);
        return;
      }

      downloadZipBlob(
        blob,
        buildClientFolderZipFileName(
          selectedClientName,
          filterMonth,
          filterYear,
          filterDocType,
          docTypeById
        )
      );
      toast.success(`ZIP exportat cu ${exportedCount} fișiere.`);
      if (failed.length > 0) {
        toast.info(`Fișiere neexportate: ${failed.join(" | ")}`);
      }
    } catch {
      toast.error("A apărut o eroare la exportul ZIP.");
    } finally {
      setZipExportPending(false);
    }
  }

  function switchFolderView(next: FolderView) {
    setFolderView(next);
    setSelectedClientId("");
    setFilterDocType("");
    setFilterMonth("");
    setFilterYear("");
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
                onOpen={() => {
                  setSelectedClientId(client.id);
                  setFilterDocType("");
                  setFilterMonth("");
                  setFilterYear("");
                }}
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
                onOpen={() => {
                  setSelectedClientId(client.id);
                  setFilterDocType("");
                  setFilterMonth("");
                  setFilterYear("");
                }}
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
          onClick={() => {
            setSelectedClientId("");
            setFilterDocType("");
            setFilterMonth("");
            setFilterYear("");
          }}
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
        <span className="text-xs text-[var(--ink-muted)] shrink-0 ml-0.5">
          {sorted.length} doc.
        </span>
        <button
          type="button"
          disabled={sorted.length === 0 || zipExportPending}
          onClick={() => void handleClientFolderZipExport()}
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
              ? "Descarcă toate documentele vizibile (respectă filtrele)"
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
              {sorted.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--paper-3)] last:border-0"
                >
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
                  <td className="py-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openUpload(u.id)}
                      className="text-[var(--sage)] hover:underline"
                    >
                      Deschide
                    </button>
                    <a
                      href={`/api/uploads/${u.id}?download=1`}
                      download={u.file_name}
                      className="text-[var(--sage)] hover:underline"
                    >
                      Descarcă
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteUpload(u.id)}
                      disabled={deletingId === u.id}
                      className="text-[var(--terracotta)] hover:underline disabled:opacity-60"
                    >
                      {deletingId === u.id ? "Stergere..." : "Sterge"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
