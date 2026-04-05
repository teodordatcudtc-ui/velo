import Link from "next/link";
import { LegalSection } from "@/app/components/LegalSection";
import { COMPANY_LEGAL, LEGAL_LINKS } from "@/lib/company-legal";

export const metadata = {
  title: "Termeni și condiții · Vello",
};

export default function TermeniPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm font-600 text-[var(--sage)] hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">Termeni și condiții de utilizare</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Acești termeni reglementează accesul și utilizarea site-ului și a aplicației Vello. Îi poți parcurge pe
          secțiuni folosind meniul de mai jos.
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Ultima actualizare: aprilie 2026.</p>

        <div className="mt-6 rounded-xl border border-[var(--paper-3)] bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Furnizorul serviciului</h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {COMPANY_LEGAL.name}
            {"\n"}
            {COMPANY_LEGAL.addressLines.join("\n")}
            {"\n"}
            CUI: {COMPANY_LEGAL.cui} (din {COMPANY_LEGAL.cuiDate}) · CAEN {COMPANY_LEGAL.caen}: {COMPANY_LEGAL.caenLabel}.
          </p>
          <p className="mt-3 text-[15px] text-[var(--ink-soft)]">
            Contact:{" "}
            <a href={`mailto:${COMPANY_LEGAL.email}`} className="font-600 text-[var(--sage)] hover:underline">
              {COMPANY_LEGAL.email}
            </a>
            {" · "}
            <a href={`tel:${COMPANY_LEGAL.phoneE164}`} className="font-600 text-[var(--sage)] hover:underline">
              {COMPANY_LEGAL.phoneDisplay}
            </a>
            {" · "}
            <Link href="/contact" className="font-600 text-[var(--sage)] hover:underline">
              Contact
            </Link>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <LegalSection title="1. Definiții" defaultOpen>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-[var(--ink)]">„Vello”</strong> — site-ul public, aplicația web și serviciile
                aferente de gestionare a cererilor de documente și materiale de la clienții utilizatorului.
              </li>
              <li>
                <strong className="text-[var(--ink)]">„Utilizator”</strong> — persoana fizică sau juridică care creează
                cont și folosește Vello în activitatea sa (de regulă contabil sau firmă de contabilitate).
              </li>
              <li>
                <strong className="text-[var(--ink)]">„Client”</strong> — clientul final al utilizatorului, despre care
                utilizatorul introduce date în aplicație.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. Acceptarea termenilor">
            <p>
              Prin crearea unui cont, autentificare sau utilizare continuă a Vello, confirmi că ai citit și înțeles
              acești termeni și{" "}
              <Link href="/privacy" className="font-600 text-[var(--sage)] hover:underline">
                Politica de confidențialitate
              </Link>
              . Dacă nu ești de acord, nu utiliza serviciul.
            </p>
          </LegalSection>

          <LegalSection title="3. Cont, securitate și date corecte">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Furnizezi date reale și actualizate la înregistrare și le menții corecte.</li>
              <li>Ești responsabil pentru păstrarea confidențialității parolei și pentru activitatea din contul tău.</li>
              <li>
                Ne anunți prompt la suspiciune de acces neautorizat. Putem suspenda contul pentru motive de securitate sau
                neplată, cu notificare rezonabilă când legea o permite.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Licență de utilizare și proprietate">
            <p>
              Îți acordăm un drept neexclusiv, netransferabil, revocabil de a folosi Vello conform planului ales, în
              scopul pentru care este destinat serviciul. Platforma, designul, codul și marca Vello rămân proprietatea
              furnizorului sau a licențiatorilor săi. Nu copia, nu revinde și nu face inginerie inversă asupra
              serviciului, cu excepția cazurilor permise de lege.
            </p>
          </LegalSection>

          <LegalSection title="5. Planuri, prețuri, trial și plăți">
            <p>
              Vello poate include perioadă de probă și abonamente plătite. Prețurile și limitele sunt afișate în
              aplicație sau pe site la momentul comenzii. Plățile sunt procesate de Stripe; aplicăm TVA conform
              legislației române în vigoare pentru facturare. Modificăm prețurile pentru viitor cu anunț prealabil
              rezonabil; continuarea după intrarea în vigoare a noilor prețuri poate însemna acceptarea lor.
            </p>
          </LegalSection>

          <LegalSection title="6. Obligațiile tale privind datele clienților">
            <p>
              Ești singurul responsabil să ai temei legal (contract, împuternicire etc.) pentru datele despre clienții
              pe care le introduci în Vello. Ne tratezi ca pe împuternicit la prelucrarea datelor pe care le
              gestionăm în numele tău în cadrul serviciului, conform{" "}
              <Link href="/privacy" className="font-600 text-[var(--sage)] hover:underline">
                Politicii de confidențialitate
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="7. Utilizare interzisă">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Nu folosi Vello pentru activități ilegale, fraudă, spam sau încălcarea drepturilor terților.</li>
              <li>Nu încerca să compromiți securitatea, să ocolești limitele tehnice sau să accesezi date fără drept.</li>
              <li>Nu încărca malware sau conținut care încalcă legea sau drepturi de proprietate intelectuală.</li>
            </ul>
          </LegalSection>

          <LegalSection title="8. Disponibilitate și modificări ale serviciului">
            <p>
              Ne străduim să menținem serviciul disponibil, însă nu garantăm funcționare neîntreruptă. Putem actualiza,
              restrânge sau încheia anumite funcții cu notificare rezonabilă când este posibil.
            </p>
          </LegalSection>

          <LegalSection title="9. Limitarea răspunderii">
            <p>
              Serviciul este furnizat „ca atare”. În limita permisă de lege, nu răspundem pentru pierderi indirecte sau
              consecințiale (inclusiv profit nerealizat), pentru conținutul introdus de utilizatori sau pentru
              indisponibilitate cauzată de terți (inclusiv furnizori de infrastructură). Nu excludem răspunderea pentru
              vătămare corporală sau moarte cauzată de neglijență sau alte situații unde legea nu permite excluderea.
            </p>
          </LegalSection>

          <LegalSection title="10. Reziliere">
            <p>
              Poți înceta utilizarea oricând; poți solicita ștergerea contului conform Politicii de confidențialitate.
              Putem închide sau suspenda contul pentru încălcarea gravă a acestor termeni sau pentru neplată, cu respectarea
              preavizului unde este cazul.
            </p>
          </LegalSection>

          <LegalSection title="11. Consumatori — drepturi și soluționarea litigiilor">
            <p>
              Dacă ești consumator în sensul legii române, beneficiezi de drepturile prevăzute de legislația aplicabilă
              (inclusiv privind contractele la distanță). Poți depune o reclamație sau sesizare la Autoritatea Națională
              pentru Protecția Consumatorilor:{" "}
              <a
                href={LEGAL_LINKS.anpc}
                target="_blank"
                rel="noopener noreferrer"
                className="font-600 text-[var(--sage)] hover:underline"
              >
                anpc.ro
              </a>
              , inclusiv prin formular online:{" "}
              <a
                href={LEGAL_LINKS.anpcComplaints}
                target="_blank"
                rel="noopener noreferrer"
                className="font-600 text-[var(--sage)] hover:underline"
              >
                eservicii.anpc.ro
              </a>
              . Pentru soluționarea alternativă a litigiilor (SAL) în România:{" "}
              <a
                href={LEGAL_LINKS.sal}
                target="_blank"
                rel="noopener noreferrer"
                className="font-600 text-[var(--sage)] hover:underline"
              >
                reclamatii SAL
              </a>
              . Informații generale despre drepturile consumatorilor în UE:{" "}
              <a
                href={LEGAL_LINKS.euConsumers}
                target="_blank"
                rel="noopener noreferrer"
                className="font-600 text-[var(--sage)] hover:underline"
              >
                Your Europe — consumatori
              </a>
              . Fostul portal european ODR a fost închis; mecanismele aplicabile sunt cele naționale și ghidurile UE
              actualizate.
            </p>
          </LegalSection>

          <LegalSection title="12. Lege aplicabilă și litigii">
            <p>
              Acești termeni sunt guvernați de legea română. Pentru litigiile care nu pot fi soluționate pe cale amiabilă,
              sunt competente instanțele din România, sub rezerva dispozițiilor imperativ aplicabile consumatorilor.
            </p>
          </LegalSection>

          <LegalSection title="13. Modificări ale termenilor">
            <p>
              Putem modifica acești termeni; versiunea publicată pe site este cea aplicabilă. Continuarea utilizării după
              publicarea modificărilor poate constitui acceptarea lor; dacă modificările sunt esențiale, vom indica data
              intrării în vigoare.
            </p>
          </LegalSection>

          <LegalSection title="14. Contact">
            <p>
              Pentru întrebări despre acești termeni:{" "}
              <a href={`mailto:${COMPANY_LEGAL.email}`} className="font-600 text-[var(--sage)] hover:underline">
                {COMPANY_LEGAL.email}
              </a>{" "}
              sau{" "}
              <Link href="/contact" className="font-600 text-[var(--sage)] hover:underline">
                pagina Contact
              </Link>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </main>
  );
}
