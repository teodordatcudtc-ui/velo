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
          Termenii de mai jos reglementează utilizarea aplicației Vello. Textul este un model inițial și poate fi adaptat
          în funcție de forma juridică, fluxurile produsului și politicile comerciale.
        </p>

        <div className="mt-10 space-y-6 text-[var(--ink-soft)]">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">1. Definiții</h2>
            <p>
              „Vello” = aplicația și serviciile asociate. „Utilizator” = persoana/entitatea care își creează cont. „Client”
              = clientul utilizatorului, ale cărui date sunt introduse în aplicație.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">2. Cont și acces</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Trebuie să furnizezi date corecte și să păstrezi confidențialitatea credențialelor.</li>
              <li>Ești responsabil pentru activitatea desfășurată în contul tău.</li>
              <li>Poți solicita ștergerea contului conform politicilor aplicabile și legislației.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">3. Planuri, prețuri și trial</h2>
            <p>
              Vello poate oferi trial și planuri plătite. Detaliile despre prețuri și limite sunt afișate în paginile
              produsului și pot fi actualizate periodic.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">4. Utilizare acceptabilă</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Nu folosi serviciul pentru activități ilegale, fraudă, spam sau încălcarea drepturilor altora.</li>
              <li>Nu încerca să compromiți securitatea aplicației sau să ocolești limitările tehnice.</li>
              <li>Nu încărca conținut malițios (viruși, executabile, scripturi) sau materiale care încalcă legea.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">5. Date și confidențialitate</h2>
            <p>
              Detalii despre prelucrarea datelor sunt descrise în{" "}
              <Link href="/privacy" className="text-[var(--sage)] font-600 hover:underline">
                Politica de confidențialitate
              </Link>{" "}
              și în{" "}
              <Link href="/gdpr" className="text-[var(--sage)] font-600 hover:underline">
                pagina GDPR
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">6. Răspundere și limitări</h2>
            <p>
              Serviciul este oferit „ca atare”. În măsura permisă de lege, Vello nu răspunde pentru pierderi indirecte
              (ex. profit nerealizat) sau pentru erori cauzate de terți/furnizori.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">7. Modificări</h2>
            <p>
              Putem actualiza acești termeni. Versiunea curentă este cea publicată pe această pagină.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">8. Contact</h2>
            <p>
              Pentru întrebări, vizitează{" "}
              <Link href="/contact" className="text-[var(--sage)] font-600 hover:underline">
                Contact
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

