import Link from "next/link";

export const metadata = {
  title: "Termeni și condiții · Vello",
};

export default function TermeniPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Termeni și condiții</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Această pagină va conține termenii și condițiile de utilizare pentru Vello.
        </p>

        <div className="mt-10 space-y-4 text-[var(--ink-soft)]">
          <h2 className="text-xl font-semibold text-[var(--ink)]">1. Utilizarea serviciului</h2>
          <p>
            Prin utilizarea Vello, accepți să folosești serviciul în mod legal și responsabil.
          </p>

          <h2 className="text-xl font-semibold text-[var(--ink)]">2. Conturi și acces</h2>
          <p>
            Ești responsabil pentru confidențialitatea credențialelor și pentru activitatea din contul tău.
          </p>

          <h2 className="text-xl font-semibold text-[var(--ink)]">3. Limitări</h2>
          <p>
            Conținutul acestei pagini este un placeholder și poate fi completat cu textul legal final.
          </p>
        </div>
      </div>
    </main>
  );
}

