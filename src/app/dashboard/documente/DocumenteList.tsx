"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { UploadRow, ClientOption, DocTypeOption } from "./page";

const MONTH_NAMES = [
  "Ian.", "Feb.", "Mar.", "Apr.", "Mai", "Iun.",
  "Iul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

type SortBy = "date" | "client" | "type" | "month";
type Option = { value: string; label: string };

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

export function DocumenteList({
  uploads,
  clientOptions,
  docTypeOptions,
}: {
  uploads: UploadRow[];
  clientOptions: ClientOption[];
  docTypeOptions: DocTypeOption[];
}) {
  const [filterDocType, setFilterDocType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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

  if (uploads.length === 0) {
    if (clientOptions.length === 0) {
      return (
        <div className="dash-card-empty">
          Nu există încă clienți. Adaugă primul client și vei vedea aici folderul lui
          cu documente.
        </div>
      );
    }
    return (
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
    );
  }

  if (!selectedClientId) {
    return (
      <div className="dash-card">
        <p className="text-sm text-[var(--ink-muted)] mb-4">
          Deschide folderul unui client ca să vezi documentele lui.
        </p>
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
    );
  }

  return (
    <div className="dash-card">
      <div className="flex items-center justify-between mb-3">
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
  );
}
