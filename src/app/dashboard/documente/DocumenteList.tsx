"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UploadRow, ClientOption, DocTypeOption } from "./page";

const MONTH_NAMES = [
  "Ian.", "Feb.", "Mar.", "Apr.", "Mai", "Iun.",
  "Iul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

type SortBy = "date" | "client" | "type" | "month";
type Option = { value: string; label: string };

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
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", width, minWidth: width }}>
      <button
        type="button"
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
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid var(--paper-3)",
            borderRadius: "var(--r-md)",
            background: "#fff",
            boxShadow: "var(--shadow-md)",
            zIndex: 40,
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
        </div>
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
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterDocType, setFilterDocType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDesc, setSortDesc] = useState(true);

  const clientById = useMemo(
    () => new Map(clientOptions.map((c) => [c.id, c.name])),
    [clientOptions]
  );
  const docTypeById = useMemo(
    () => new Map(docTypeOptions.map((d) => [d.id, d.name])),
    [docTypeOptions]
  );

  const years = useMemo(() => {
    const set = new Set(uploads.map((u) => u.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [uploads]);

  const clientFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "Client" }, ...clientOptions.map((c) => ({ value: c.id, label: c.name }))],
    [clientOptions]
  );
  const docTypeFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "Tip" }, ...docTypeOptions.map((d) => ({ value: d.id, label: d.name }))],
    [docTypeOptions]
  );
  const monthFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "Lună" }, ...MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: name }))],
    []
  );
  const yearFilterOptions = useMemo<Option[]>(
    () => [{ value: "", label: "An" }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
    [years]
  );

  const filtered = useMemo(() => {
    return uploads.filter((u) => {
      if (filterClient && u.client_id !== filterClient) return false;
      if (filterDocType && u.document_type_id !== filterDocType) return false;
      if (filterMonth && u.month !== parseInt(filterMonth, 10)) return false;
      if (filterYear && u.year !== parseInt(filterYear, 10)) return false;
      return true;
    });
  }, [uploads, filterClient, filterDocType, filterMonth, filterYear]);

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

  if (uploads.length === 0) {
    return (
      <div className="dash-card-empty">
        Nu există încă documente încărcate. Ele vor apărea aici după ce clienții
        trimit fișiere pe linkul de colectare.
      </div>
    );
  }

  return (
    <div className="dash-card">
      <div className="flex flex-nowrap items-center gap-2 mb-4 pb-4 border-b border-[var(--paper-3)] overflow-x-auto">
        <span className="text-xs font-medium text-[var(--ink-muted)] shrink-0">
          Filtre:
        </span>
        <FilterDropdown
          label="Client"
          value={filterClient}
          options={clientFilterOptions}
          onChange={setFilterClient}
          width={160}
        />
        <FilterDropdown
          label="Tip"
          value={filterDocType}
          options={docTypeFilterOptions}
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
          options={yearFilterOptions}
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
                  <td className="py-2.5 pr-4 text-[var(--ink)]">
                    {clientById.get(u.client_id) ?? "—"}
                  </td>
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
