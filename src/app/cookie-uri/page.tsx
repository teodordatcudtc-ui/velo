import Link from "next/link";
import { LegalSection } from "@/app/components/LegalSection";
import { COMPANY_LEGAL } from "@/lib/company-legal";

export const metadata = {
  title: "Politica de cookies · Vello",
};

export default function CookieUriPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm font-600 text-[var(--sage)] hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Politica de cookies</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Explicăm ce sunt cookie-urile, ce folosim în Vello și cum le poți controla. Completăm{" "}
          <Link href="/privacy" className="font-600 text-[var(--sage)] hover:underline">
            Politica de confidențialitate
          </Link>
          .
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Ultima actualizare: aprilie 2026.</p>

        <div className="mt-6 rounded-xl border border-[var(--paper-3)] bg-white/80 p-5 shadow-sm">
          <p className="text-[15px] text-[var(--ink-soft)]">
            Operator: {COMPANY_LEGAL.name}. Contact:{" "}
            <a href={`mailto:${COMPANY_LEGAL.email}`} className="font-600 text-[var(--sage)] hover:underline">
              {COMPANY_LEGAL.email}
            </a>
            .
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <LegalSection title="Ce sunt cookie-urile?" defaultOpen>
            <p>
              Cookie-urile sunt fișiere mici plasate pe dispozitivul tău de browser. Permit recunoașterea sesiunii,
              memorarea unor preferințe și funcționarea sigură a site-ului. Tehnologii similare includ stocarea locală
              (local storage) folosită de aplicații web moderne.
            </p>
          </LegalSection>

          <LegalSection title="Cookie-uri și module pe care le folosim">
            <div className="overflow-x-auto rounded-lg border border-[var(--paper-3)]">
              <table className="w-full min-w-[280px] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--paper-3)] bg-[var(--paper-2)] text-[var(--ink)]">
                    <th className="px-3 py-2 font-semibold">Categorie / furnizor</th>
                    <th className="px-3 py-2 font-semibold">Scop</th>
                    <th className="px-3 py-2 font-semibold">Durată</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--ink-soft)]">
                  <tr className="border-b border-[var(--paper-3)]">
                    <td className="px-3 py-2 align-top">
                      <strong className="text-[var(--ink)]">Necesare — Supabase Auth</strong>
                      <br />
                      Cookie-uri de sesiune (ex. prefix <code className="text-[13px] text-[var(--ink)]">sb-</code>)
                    </td>
                    <td className="px-3 py-2 align-top">Autentificare, menținere sesiune securizată</td>
                    <td className="px-3 py-2 align-top">Sesiune / conform setărilor furnizorului</td>
                  </tr>
                  <tr className="border-b border-[var(--paper-3)]">
                    <td className="px-3 py-2 align-top">
                      <strong className="text-[var(--ink)]">Necesare — Next.js / Vercel</strong>
                    </td>
                    <td className="px-3 py-2 align-top">Livrare pagini, rutare, securitate de bază</td>
                    <td className="px-3 py-2 align-top">Sesiune sau scurtă</td>
                  </tr>
                  <tr className="border-b border-[var(--paper-3)]">
                    <td className="px-3 py-2 align-top">
                      <strong className="text-[var(--ink)]">Plăți — Stripe</strong>
                    </td>
                    <td className="px-3 py-2 align-top">
                      Procesare plată și prevenire fraudă pe domeniile Stripe (la abonare)
                    </td>
                    <td className="px-3 py-2 align-top">Conform politicii Stripe</td>
                  </tr>
                  <tr className="border-b border-[var(--paper-3)]">
                    <td className="px-3 py-2 align-top">
                      <strong className="text-[var(--ink)]">Performanță — Vercel Analytics / Speed Insights</strong>
                    </td>
                    <td className="px-3 py-2 align-top">
                      Statistici agregate despre vizite și performanță (fără publicitate comportamentală)
                    </td>
                    <td className="px-3 py-2 align-top">Variabilă, date agregate</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">
              Nu rulăm, în prezent, campanii de publicitate care necesită cookie-uri de marketing sau profilare
              publicitară. Dacă introducem astfel de module, vom actualiza această pagină și, unde legea o cere, vom
              cere consimțământul în prealabil.
            </p>
          </LegalSection>

          <LegalSection title="Cum poți controla cookie-urile">
            <p>
              Poți șterge cookie-urile și limita acceptarea lor din setările browserului. Dacă blochezi cookie-urile
              strict necesare autentificării, nu vei putea rămâne conectat la Vello sau fluxurile de plată pot fi
              afectate.
            </p>
          </LegalSection>

          <LegalSection title="Legături utile">
            <p>
              Mai multe despre prelucrarea datelor personale:{" "}
              <Link href="/privacy" className="font-600 text-[var(--sage)] hover:underline">
                Politica de confidențialitate
              </Link>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </main>
  );
}
