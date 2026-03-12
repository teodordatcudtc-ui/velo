import Link from "next/link";

export const metadata = {
  title: "GDPR · Vello",
};

export default function GdprPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm text-[var(--sage)] font-600 hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">GDPR</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Informații despre drepturile tale și despre modul în care Vello prelucrează datele cu caracter personal.
        </p>

        <div className="mt-10 space-y-6 text-[var(--ink-soft)]">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Operator și date de contact</h2>
            <p>
              Detaliile operatorului (denumire, adresă, DPO) pot fi completate aici. Pentru solicitări, vezi pagina{" "}
              <Link href="/contact" className="text-[var(--sage)] font-600 hover:underline">Contact</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Drepturile persoanei vizate</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Dreptul de acces</li>
              <li>Dreptul la rectificare</li>
              <li>Dreptul la ștergere („dreptul de a fi uitat”)</li>
              <li>Dreptul la restricționarea prelucrării</li>
              <li>Dreptul la portabilitatea datelor</li>
              <li>Dreptul la opoziție</li>
              <li>Dreptul de a depune o plângere la ANSPDCP</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Perioada de stocare</h2>
            <p>
              Datele sunt păstrate cât timp este necesar pentru furnizarea serviciului, respectarea obligațiilor legale și
              soluționarea eventualelor dispute, conform politicilor interne.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Împuterniciți / Subprocesatori</h2>
            <p>
              Vello poate folosi furnizori (ex. infrastructură, autentificare, email) pentru a livra serviciul. Lista poate
              fi completată aici.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Placeholder</h2>
            <p>
              Această pagină este un text inițial și poate fi înlocuită cu documentul GDPR final (avocat / consultant).
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

