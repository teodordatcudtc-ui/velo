import Link from "next/link";

export const metadata = {
  title: "Privacy · Vello",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Politica de confidențialitate</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Politica de mai jos explică ce date prelucrăm, în ce scop și ce opțiuni ai. Textul este un model inițial și poate
          fi completat cu informații specifice operatorului și fluxurilor finale.
        </p>

        <div className="mt-10 space-y-6 text-[var(--ink-soft)]">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">1. Categorii de date</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Date de cont: nume, email, identificatori de autentificare.</li>
              <li>Date introduse de utilizator despre clienți: nume firmă/client, email, telefon (opțional).</li>
              <li>Date tehnice: loguri, informații despre dispozitiv/browser (în scop de securitate și diagnostic).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">2. Scopuri și temeiuri</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Furnizarea serviciului (executarea contractului / pașii la cererea utilizatorului).</li>
              <li>Securitate și prevenirea abuzurilor (interes legitim).</li>
              <li>Comunicări operaționale (ex. emailuri despre funcționarea serviciului).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">3. Destinatari</h2>
            <p>
              Putem partaja date cu furnizori necesari (ex. autentificare, hosting, email) doar în măsura necesară pentru
              funcționarea serviciului.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">4. Transferuri și stocare</h2>
            <p>
              Datele pot fi stocate pe infrastructura furnizorilor utilizați. Perioadele de păstrare depind de tipul de date
              și de obligațiile legale/contractuale.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">5. Cookie-uri</h2>
            <p>
              Folosim cookie-uri strict necesare pentru autentificare și funcționarea aplicației. Detalii în{" "}
              <Link href="/cookie-uri" className="text-[var(--sage)] font-600 hover:underline">
                pagina Cookie-uri
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">6. Drepturile tale</h2>
            <p>
              Pentru o listă a drepturilor și modul de exercitare, vezi{" "}
              <Link href="/gdpr" className="text-[var(--sage)] font-600 hover:underline">
                GDPR
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">7. Placeholder</h2>
            <p>
              Textul este orientativ și poate fi completat cu detalii specifice operatorului (denumire, adresă, DPO) și cu
              liste exacte de furnizori/subprocesatori.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

