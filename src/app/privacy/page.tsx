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
          Această pagină va descrie cum colectăm, folosim și protejăm datele în Vello.
        </p>

        <div className="mt-10 space-y-4 text-[var(--ink-soft)]">
          <h2 className="text-xl font-semibold text-[var(--ink)]">1. Date colectate</h2>
          <p>
            Colectăm date necesare pentru funcționarea aplicației (ex. email, nume cont, date clienți introduse de utilizator).
          </p>

          <h2 className="text-xl font-semibold text-[var(--ink)]">2. Scopul prelucrării</h2>
          <p>
            Folosim datele pentru autentificare, comunicări și livrarea funcționalităților produsului.
          </p>

          <h2 className="text-xl font-semibold text-[var(--ink)]">3. Placeholder</h2>
          <p>
            Conținutul este un placeholder și poate fi înlocuit cu textul legal final.
          </p>
        </div>
      </div>
    </main>
  );
}

