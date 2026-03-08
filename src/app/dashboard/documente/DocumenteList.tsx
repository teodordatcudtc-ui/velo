"use client";

import { useMemo, useState } from "react";
import type { UploadRow, ClientOption, DocTypeOption } from "./page";
import { useToast } from "@/app/components/ToastProvider";

const MONTH_NAMES = [
  "Ian.", "Feb.", "Mar.", "Apr.", "Mai", "Iun.",
  "Iul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec.",
];

type SortBy = "date" | "client" | "type" | "month";

export function DocumenteList({
  uploads,
  clientOptions,
  docTypeOptions,
}: {
  uploads: UploadRow[];
  clientOptions: ClientOption[];
  docTypeOptions: DocTypeOption[];
}) {
  const toast = useToast();
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

  async function openUpload(id: string) {
    try {
      const res = await fetch(`/api/uploads/${id}`);
      const data = await res.json();
      if (data?.url) window.open(data.url, "_blank");
      else toast.error(data?.error ?? "Eroare la deschidere.");
    } catch {
      toast.error("Eroare la deschidere.");
    }
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
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="dash-input !w-[160px] !max-w-[160px] shrink-0 text-xs py-1.5 px-2 box-border"
        >
          <option value="">Client</option>
          {clientOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterDocType}
          onChange={(e) => setFilterDocType(e.target.value)}
          className="dash-input !w-[110px] !max-w-[110px] shrink-0 text-xs py-1.5 px-2 box-border"
        >
          <option value="">Tip</option>
          {docTypeOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="dash-input !w-[82px] !max-w-[82px] shrink-0 text-xs py-1.5 px-2 box-border"
        >
          <option value="">Lună</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="dash-input !w-[88px] !max-w-[88px] shrink-0 text-xs py-1.5 px-2 box-border"
        >
          <option value="">An</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
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
