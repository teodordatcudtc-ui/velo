import Link from "next/link";

export const metadata = {
  title: "Cookie-uri · Vello",
};

export default function CookieUriPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Cookie-uri</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Folosim cookie-uri strict necesare pentru autentificare și funcționarea aplicației.
        </p>

        <div className="mt-10 space-y-6 text-[var(--ink-soft)]">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Ce sunt cookie-urile?</h2>
            <p>
              Cookie-urile sunt fișiere mici stocate în browser, folosite pentru a reține preferințe și a menține sesiunea
              activă.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Ce cookie-uri folosim</h2>
            <p>
              În prezent, Vello folosește în principal cookie-uri de sesiune pentru autentificare (Supabase Auth / Next.js).
              Nu folosim cookie-uri de marketing în mod implicit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Cum le poți controla</h2>
            <p>
              Poți șterge sau bloca cookie-urile din setările browserului. Reține că blocarea cookie-urilor strict necesare
              poate împiedica autentificarea și funcționarea corectă a aplicației.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Placeholder</h2>
            <p>
              Textul este orientativ și poate fi completat cu detalii specifice (nume cookie, durată, scop) după stabilirea
              configurației finale.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

