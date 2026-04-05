import Link from "next/link";
import { COMPANY_LEGAL } from "@/lib/company-legal";

export const metadata = {
  title: "Contact · Vello",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Contact</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Pentru întrebări sau suport, ne poți scrie sau suna și revenim cât mai repede.
        </p>

        <div className="mt-8 space-y-3 text-[var(--ink-soft)]">
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Operator</div>
            <div className="text-[var(--ink)] font-semibold">{COMPANY_LEGAL.shortName}</div>
          </div>
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Sediu profesional</div>
            <div className="whitespace-pre-line text-[var(--ink)] font-semibold">
              {COMPANY_LEGAL.addressLines.join("\n")}
            </div>
            <div className="mt-1 text-sm text-[var(--ink-soft)]">
              CUI {COMPANY_LEGAL.cui} · CAEN {COMPANY_LEGAL.caen}
            </div>
          </div>
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Email</div>
            <a
              href={`mailto:${COMPANY_LEGAL.email}`}
              className="text-[var(--ink)] font-semibold hover:underline"
            >
              {COMPANY_LEGAL.email}
            </a>
          </div>
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Telefon</div>
            <a
              href={`tel:${COMPANY_LEGAL.phoneE164}`}
              className="text-[var(--ink)] font-semibold hover:underline"
            >
              {COMPANY_LEGAL.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

