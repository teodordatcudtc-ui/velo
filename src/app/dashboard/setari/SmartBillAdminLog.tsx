"use client";

import { useEffect, useState } from "react";

type SyncLogRow = {
  id: string;
  accountant_name: string;
  stripe_checkout_session_id: string | null;
  stripe_invoice_id: string | null;
  status: string;
  error_message: string | null;
  smartbill_series: string | null;
  smartbill_number: string | null;
  detail: string | null;
  created_at: string;
};

export function SmartBillAdminLog() {
  const [logs, setLogs] = useState<SyncLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/smartbill-sync-log");
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data?.error ?? "Eroare la încărcare.");
          return;
        }
        if (!cancelled) setLogs(data.logs ?? []);
      } catch {
        if (!cancelled) setError("Eroare la încărcare.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dash-card w-full">
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">SmartBill — diagnostic</h2>
      <p className="text-sm text-[var(--ink-muted)] mb-4">
        Ultimele încercări de emitere factură după plăți Stripe (toți contabilii).
      </p>
      {loading && <p className="text-sm text-[var(--ink-muted)]">Se încarcă...</p>}
      {error && <p className="text-sm text-[var(--terracotta)]">{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p className="text-sm text-[var(--ink-muted)]">Nicio înregistrare în jurnal.</p>
      )}
      {logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--paper-3)] text-left text-[var(--ink-muted)]">
                <th className="py-2 pr-3">Data</th>
                <th className="py-2 pr-3">Contabil</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Factură SB</th>
                <th className="py-2 pr-3">Stripe</th>
                <th className="py-2">Detalii</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-[var(--paper-3)] last:border-0 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap text-[var(--ink-muted)]">
                    {new Date(row.created_at).toLocaleString("ro-RO")}
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">{row.accountant_name}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        row.status === "success"
                          ? "text-[var(--sage)] font-semibold"
                          : row.status === "error"
                            ? "text-[var(--terracotta)] font-semibold"
                            : "text-[var(--ink-muted)]"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink)]">
                    {row.smartbill_series && row.smartbill_number
                      ? `${row.smartbill_series} ${row.smartbill_number}`
                      : "—"}
                  </td>
                  <td className="py-2 pr-3 text-[var(--ink-muted)] max-w-[140px] truncate">
                    {row.stripe_invoice_id ?? row.stripe_checkout_session_id ?? "—"}
                  </td>
                  <td className="py-2 text-[var(--ink-soft)] max-w-xs">
                    {row.error_message ?? row.detail ?? "—"}
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
