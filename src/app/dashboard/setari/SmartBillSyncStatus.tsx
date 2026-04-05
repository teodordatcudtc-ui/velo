"use client";

import { useEffect, useState } from "react";

type Entry = {
  status: "skipped" | "success" | "error";
  error_message: string | null;
  smartbill_series: string | null;
  smartbill_number: string | null;
  detail: string | null;
  created_at: string;
  stripe_checkout_session_id: string | null;
};

export function SmartBillSyncStatus() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/smartbill-log", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setEntries(d.entries ?? []);
      })
      .catch(() => setErr("Eroare la încărcare."));
  }, []);

  if (err) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Jurnal facturare: {err} (aplică migrarea 017 dacă lipsește tabelul.)
      </p>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Încă nu există înregistrări după plăți Stripe către SmartBill. După o plată, aici apare
        succesul sau mesajul de eroare de la API.
      </p>
    );
  }

  const last = entries[0];

  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-[var(--ink)]">Ultima sincronizare SmartBill</p>
      <div
        className={`rounded-lg px-3 py-2 border ${
          last.status === "success"
            ? "border-green-200 bg-green-50/80 text-green-900"
            : last.status === "error"
              ? "border-red-200 bg-red-50/80 text-red-900"
              : "border-amber-200 bg-amber-50/80 text-amber-900"
        }`}
      >
        <p className="font-medium">
          {last.status === "success" && "Succes"}
          {last.status === "error" && "Eroare"}
          {last.status === "skipped" && "Omis / deja făcut"}
        </p>
        {last.status === "success" && last.smartbill_series && last.smartbill_number && (
          <p>
            Factură: {last.smartbill_series} {last.smartbill_number}
          </p>
        )}
        {last.error_message && <p className="mt-1 whitespace-pre-wrap">{last.error_message}</p>}
        {last.detail && <p className="mt-1 text-xs opacity-90">{last.detail}</p>}
        <p className="text-xs mt-2 opacity-75">
          {new Date(last.created_at).toLocaleString("ro-RO")}
        </p>
      </div>
      {entries.length > 1 && (
        <details className="text-xs text-[var(--ink-muted)]">
          <summary className="cursor-pointer">Istoric recent ({entries.length})</summary>
          <ul className="mt-2 space-y-2 list-disc pl-4">
            {entries.slice(1).map((e) => (
              <li key={e.created_at + (e.stripe_checkout_session_id ?? "")}>
                <span className="font-medium">{e.status}</span> —{" "}
                {e.error_message ?? e.detail ?? "—"}{" "}
                <span className="opacity-75">
                  ({new Date(e.created_at).toLocaleString("ro-RO")})
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
