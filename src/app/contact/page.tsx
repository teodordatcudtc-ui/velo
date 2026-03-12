import Link from "next/link";

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
          Pentru întrebări sau suport, ne poți scrie și revenim cât mai repede.
        </p>

        <div className="mt-8 space-y-3 text-[var(--ink-soft)]">
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Email</div>
            <div className="text-[var(--ink)] font-semibold">support@vello.ro</div>
          </div>
          <div className="dash-card" style={{ padding: 16 }}>
            <div className="text-sm text-[var(--ink-muted)]">Program</div>
            <div className="text-[var(--ink)] font-semibold">Luni–Vineri, 09:00–18:00</div>
          </div>
        </div>
      </div>
    </main>
  );
}

