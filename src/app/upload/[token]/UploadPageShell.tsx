"use client";

import { useMemo, useState } from "react";
import {
  buildSelectableUploadPeriods,
  formatUploadPeriodLabel,
  periodKey,
  type UploadPeriod,
} from "@/lib/upload-period";
import { ClientUploadForm } from "./ClientUploadForm";

type UploadRow = {
  id: string;
  documentTypeId: string;
  file_name: string;
  month: number;
  year: number;
};

export function UploadPageShell({
  clientId,
  token,
  documentTypes,
  allUploads,
  defaultPeriod,
}: {
  clientId: string;
  token: string;
  documentTypes: { id: string; name: string }[];
  allUploads: UploadRow[];
  defaultPeriod: UploadPeriod;
}) {
  const periods = useMemo(() => buildSelectableUploadPeriods(), []);
  const [period, setPeriod] = useState(defaultPeriod);

  const initialUploads = useMemo(
    () =>
      allUploads.filter((u) => u.month === period.month && u.year === period.year),
    [allUploads, period]
  );

  return (
    <>
      <div className="px-6 py-3 border-b border-[var(--paper-3)] bg-[var(--paper)] flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="upload-period" className="text-[var(--ink-muted)] shrink-0">
          Documente pentru
        </label>
        <select
          id="upload-period"
          value={periodKey(period)}
          onChange={(e) => {
            const [yearStr, monthStr] = e.target.value.split("-");
            const year = Number(yearStr);
            const month = Number(monthStr);
            if (Number.isInteger(month) && Number.isInteger(year)) {
              setPeriod({ month, year });
            }
          }}
          className="rounded-[var(--r-sm)] border border-[var(--paper-3)] bg-white px-2.5 py-1.5 text-[var(--ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--sage)]/40"
        >
          {periods.map((p) => (
            <option key={periodKey(p)} value={periodKey(p)}>
              {formatUploadPeriodLabel(p.month, p.year)}
            </option>
          ))}
        </select>
      </div>
      <ClientUploadForm
        key={periodKey(period)}
        clientId={clientId}
        documentTypes={documentTypes}
        token={token}
        initialUploads={initialUploads}
        uploadPeriod={period}
      />
    </>
  );
}
