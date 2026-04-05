type Row = {
  id: string;
  smartbill_series: string;
  smartbill_number: string;
  amount_cents: number;
  currency: string;
  plan: string | null;
  billing_interval: string | null;
  created_at: string;
};

function formatMoney(cents: number, currency: string): string {
  const major = cents / 100;
  const cur = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: cur === "RON" ? "RON" : cur === "EUR" ? "EUR" : cur,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${cur}`;
  }
}

export function IssuedInvoicesCard({ invoices }: { invoices: Row[] }) {
  if (invoices.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">Facturi emise</h3>
        <p className="text-sm text-[var(--ink-muted)]">
          După o plată reușită, factura fiscală apare aici — o poți deschide în PDF (emisă în SmartBill).
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Facturi emise</h3>
      <p className="text-sm text-[var(--ink-muted)] mb-3">
        Facturi fiscale emise automat la plăți. PDF-ul este preluat din SmartBill.
      </p>
      <ul className="space-y-2">
        {invoices.map((inv) => (
          <li
            key={inv.id}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm rounded-lg border border-[var(--paper-3)] bg-[var(--paper-2)] px-3 py-2"
          >
            <div className="text-[var(--ink)]">
              <span className="font-medium">
                {inv.smartbill_series} {inv.smartbill_number}
              </span>
              <span className="text-[var(--ink-muted)] mx-2">·</span>
              <span>{formatMoney(inv.amount_cents, inv.currency)}</span>
              {inv.plan && (
                <span className="text-[var(--ink-muted)] ml-2">
                  ({inv.plan}
                  {inv.billing_interval ? ` · ${inv.billing_interval}` : ""})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-[var(--ink-muted)]">
                {new Date(inv.created_at).toLocaleDateString("ro-RO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <a
                href={`/api/billing/invoices/${inv.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--sage)] font-semibold underline hover:no-underline"
              >
                Vezi factura (PDF)
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
