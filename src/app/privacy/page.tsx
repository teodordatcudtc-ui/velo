import Link from "next/link";

export const metadata = {
  title: "Politica de confidențialitate · Vello",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Politica de confidențialitate</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Această politică descrie ce date sunt prelucrate, în ce scop și ce drepturi ai.
        </p>

        <div className="mt-4 space-y-3 text-[var(--ink-soft)]">
          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Operator (responsabil prelucrare)</h2>
            <p>
              <strong>Datcu Teodor Andrei</strong>, București. Contact:{" "}
              <Link href="/contact" className="text-[var(--sage)] font-600 hover:underline">
                pagina Contact
              </Link>.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">1. Categorii de date</h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Date de cont: nume, email, identificatori de autentificare.</li>
              <li>Date introduse de utilizator despre clienți: nume firmă/client, email, telefon (opțional).</li>
              <li>Date tehnice: loguri, informații despre dispozitiv/browser (securitate și diagnostic).</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">2. Scopuri și temeiuri</h2>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Furnizarea serviciului (executarea contractului / pașii la cererea utilizatorului).</li>
              <li>Securitate și prevenirea abuzurilor (interes legitim).</li>
              <li>Comunicări operaționale (ex. emailuri despre funcționarea serviciului).</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">3. Destinatari</h2>
            <p>
              Datele sunt transmise către furnizori tehnici (autentificare, hosting, email) doar în măsura necesară pentru furnizarea serviciului. Lista subprocesatorilor poate fi solicitată prin Contact.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">4. Perioada de păstrare</h2>
            <p>
              Datele sunt păstrate pe perioada necesară pentru furnizarea serviciului și îndeplinirea obligațiilor legale și contractuale; după încetarea relației contractuale, conform politicii interne și legislației.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">5. Cookie-uri</h2>
            <p>
              Serviciul utilizează cookie-uri strict necesare pentru autentificare și funcționare. Detalii:{" "}
              <Link href="/cookie-uri" className="text-[var(--sage)] font-600 hover:underline">
                pagina Cookie-uri
              </Link>.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--ink)]">6. Drepturile tale</h2>
            <p>
              Ai dreptul la acces, rectificare, ștergere, restricționare, portabilitate și opoziție. Pentru exercitarea drepturilor sau pentru plângeri: contactează operatorul prin{" "}
              <Link href="/contact" className="text-[var(--sage)] font-600 hover:underline">
                Contact
              </Link>{" "}
              sau depune plângere la ANSPDCP.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

