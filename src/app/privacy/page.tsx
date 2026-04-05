import Link from "next/link";
import { LegalSection } from "@/app/components/LegalSection";
import { COMPANY_LEGAL, LEGAL_LINKS } from "@/lib/company-legal";

export const metadata = {
  title: "Politica de confidențialitate (GDPR) · Vello",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] px-4">
      <div className="mx-auto w-full max-w-3xl py-14">
        <Link href="/" className="text-sm font-600 text-[var(--sage)] hover:underline">
          Înapoi acasă
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-[var(--ink)]">
          Politica de confidențialitate
        </h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Documentul explică ce date cu caracter personal prelucrăm prin site-ul și aplicația Vello, în ce scop, cât timp
          și ce drepturi ai. Este aliniată informărilor prevăzute la art. 12–14 din Regulamentul (UE) 2016/679 (GDPR).
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Ultima actualizare: aprilie 2026.</p>

        <div className="mt-6 rounded-xl border border-[var(--paper-3)] bg-white/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Operatorul de date</h2>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-soft)]">
            {COMPANY_LEGAL.name}
            {"\n"}
            {COMPANY_LEGAL.addressLines.join("\n")}
            {"\n"}
            Cod unic de înregistrare (CUI): {COMPANY_LEGAL.cui}, din data de {COMPANY_LEGAL.cuiDate}.
            {"\n"}
            Activitate principală (CAEN {COMPANY_LEGAL.caen}): {COMPANY_LEGAL.caenLabel}.
          </p>
          <p className="mt-3 text-[15px] text-[var(--ink-soft)]">
            Email:{" "}
            <a href={`mailto:${COMPANY_LEGAL.email}`} className="font-600 text-[var(--sage)] hover:underline">
              {COMPANY_LEGAL.email}
            </a>
            {" · "}
            Telefon:{" "}
            <a href={`tel:${COMPANY_LEGAL.phoneE164}`} className="font-600 text-[var(--sage)] hover:underline">
              {COMPANY_LEGAL.phoneDisplay}
            </a>
            {" · "}
            <Link href="/contact" className="font-600 text-[var(--sage)] hover:underline">
              Pagina Contact
            </Link>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <LegalSection title="Responsabil cu protecția datelor (DPO)" defaultOpen>
            <p>
              Nu am desemnat un responsabil cu protecția datelor (DPO), întrucât în situația concretă nu există obligația
              legală de desemnare (art. 37 GDPR). Solicitările privind protecția datelor cu caracter personal se trimit la
              adresa de email de mai sus sau prin{" "}
              <Link href="/contact" className="font-600 text-[var(--sage)] hover:underline">
                Contact
              </Link>
              ; răspundem fără întârzieri nejustificate.
            </p>
          </LegalSection>

          <LegalSection title="Ce categorii de date prelucrăm">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-[var(--ink)]">Date de cont și identificare:</strong> nume (sau denumire utilizator),
                adresă de email, parolă sub formă criptată, identificatori tehnici de autentificare furnizați de serviciul
                de autentificare.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Date despre clienții tăi (introduse de tine în aplicație):</strong>{" "}
                denumire persoană juridică / nume client, adresă de email, număr de telefon dacă îl adaugi, alte note
                operaționale pe care le introduci voluntar.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Documente și fișiere:</strong> materiale încărcate prin fluxurile
                aplicației (ex. documente contabile), metadate tehnice asociate (nume fișier, dată încărcare).
              </li>
              <li>
                <strong className="text-[var(--ink)]">Date despre plată:</strong> identificatori de tranzacție și client
                la procesatorul de plăți (Stripe); nu stocăm numărul complet al cardului pe serverele noastre.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Date tehnice și de utilizare:</strong> adrese IP, tip de browser,
                marcă de timp, identificatori de sesiune în loguri, mesaje de eroare — pentru securitate, audit și
                funcționare.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Comunicări:</strong> conținutul mesajelor trimise prin email
                (remindere, notificări operaționale) în măsura necesară livrării serviciului.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="În ce scopuri și cu ce temei juridic prelucrăm datele">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-[var(--ink)]">Furnizarea serviciului Vello</strong> (creare cont, autentificare,
                gestionare clienți și documente, remindere, abonamente) —{" "}
                <strong className="text-[var(--ink)]">executarea contractului</strong> sau{" "}
                <strong className="text-[var(--ink)]">pașii precontractuali</strong> la cererea ta (art. 6 alin. (1) lit.
                b GDPR).
              </li>
              <li>
                <strong className="text-[var(--ink)]">Facturare, contabilitate și obligații fiscale</strong> —{" "}
                <strong className="text-[var(--ink)]">obligație legală</strong> (art. 6 alin. (1) lit. c GDPR).
              </li>
              <li>
                <strong className="text-[var(--ink)]">Securitatea aplicației, prevenirea fraudelor și abuzurilor</strong>{" "}
                — <strong className="text-[var(--ink)]">interes legitim</strong> (art. 6 alin. (1) lit. f GDPR), echilibrat
                cu drepturile tale.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Îmbunătățirea serviciului și diagnostic tehnic</strong> (ex.
                statistici agregate, viteză de încărcare) — interes legitim sau, unde este cazul, consimțământ pentru
                module opționale — vezi{" "}
                <Link href="/cookie-uri" className="font-600 text-[var(--sage)] hover:underline">
                  Politica de cookies
                </Link>
                .
              </li>
              <li>
                <strong className="text-[var(--ink)]">Comunicări despre funcționarea serviciului</strong> (ex. modificări
                esențiale, securitate) — executarea contractului și/sau interes legitim în a te informa despre serviciul
                folosit.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Destinatari și subîmputerniciți">
            <p>
              Datele sunt accesibile operatorului și unor furnizori care prestează servicii strict necesare livrării
              Vello, în calitate de împuterniciți:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-[var(--ink)]">Supabase</strong> — bază de date, autentificare, stocare fișiere
                (conform documentației și termenilor lor).
              </li>
              <li>
                <strong className="text-[var(--ink)]">Vercel</strong> — găzduire și infrastructură front-end.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Stripe</strong> — procesare plăți pentru abonamente.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Resend</strong> — trimitere emailuri tranzacționale și operaționale.
              </li>
            </ul>
            <p className="mt-2">
              Lista poate fi actualizată; îți comunicăm modificări relevante prin această politică sau prin notificări
              rezonabile. Poți solicita informații suplimentare despre subîmputerniciți la adresa de contact de mai sus.
            </p>
          </LegalSection>

          <LegalSection title="Transferuri în afara Spațiului Economic European">
            <p>
              Unele furnizori pot procesa date în state din afara SEE (de exemplu Statele Unite). În aceste situații
              folosim instrumente prevăzute de GDPR (ex. clauze contractuale tip aprobate de Comisie, sau alte garanții
              adecvate) și/sau decizii de adecvare, astfel încât datele tale să beneficieze de un nivel de protecție
              echivalent.
            </p>
          </LegalSection>

          <LegalSection title="Cât timp păstrăm datele">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Datele de cont și conținutul necesar serviciului: pe durata relației contractuale și după încheiere,
                intervalul strict necesar soluționării obligațiilor legale și eventualelor reclamații.
              </li>
              <li>
                Datele fiscale și documentele justificative: conform termenelor prevăzute de legea fiscală și comercială
                aplicabilă (de regulă ani calendaristici de la momentul evenimentului).
              </li>
              <li>
                Loguri tehnice: perioade scurte, rotative, suficiente pentru securitate și diagnostic, dacă nu există
                obligații de păstrare mai lungi.
              </li>
            </ul>
            <p className="mt-2">
              După expirarea termenelor, datele sunt șterse sau anonimizate acolo unde legea permite.
            </p>
          </LegalSection>

          <LegalSection title="Cookie-uri și tehnologii similare">
            <p>
              Folosim cookie-uri și stocare locală strict necesare autentificării și funcționării aplicației. Detalii
              despre tipuri, scopuri și opțiuni:{" "}
              <Link href="/cookie-uri" className="font-600 text-[var(--sage)] hover:underline">
                Politica de cookies
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="Drepturile tale">
            <p>Ai următoarele drepturi în condițiile legii:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>dreptul de acces la date;</li>
              <li>dreptul la rectificare;</li>
              <li>dreptul la ștergere („dreptul de a fi uitat”), unde se aplică;</li>
              <li>dreptul la restricționarea prelucrării;</li>
              <li>dreptul la portabilitatea datelor (unde este cazul);</li>
              <li>dreptul la opoziție la prelucrarea bazată pe interes legitim;</li>
              <li>
                dreptul de a retrage consimțământul în orice moment, fără a afecta legalitatea prelucrării efectuate înainte
                de retragere (când prelucrarea se bazează pe consimțământ).
              </li>
            </ul>
            <p className="mt-2">
              Pentru exercitarea drepturilor, contactează-ne la emailul operatorului. Îți răspundem în termen de o lună
              (cu posibilitate de prelungire conform GDPR, despre care te informăm).
            </p>
          </LegalSection>

          <LegalSection title="Decizii automate și profilare">
            <p>
              Nu luăm decizii automate care să producă efecte juridice sau să te afecteze în mod semnificativ similar.
              Nu desfășurăm profilare în sensul art. 22 GDPR pentru marketing comportamental.
            </p>
          </LegalSection>

          <LegalSection title="Plângere la autoritatea de supraveghere">
            <p>
              Ai dreptul să depui plângere la autoritatea de protecție a datelor. În România: Autoritatea Națională de
              Supraveghere a Prelucrării Datelor cu Caracter Personal —{" "}
              <a
                href={LEGAL_LINKS.anspdcp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-600 text-[var(--sage)] hover:underline"
              >
                www.dataprotection.ro
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Modificări ale acestei politici">
            <p>
              Actualizăm politica când se schimbă modul de prelucrare sau când este necesar din punct de vedere legal.
              Versiunea aplicabilă este cea publicată pe această pagină, cu data „ultima actualizare”. Te încurajăm să
              revii periodic la această secțiune.
            </p>
          </LegalSection>
        </div>

        <p className="mt-8 text-sm text-[var(--ink-muted)]">
          Pentru termenii de utilizare ai serviciului, vezi{" "}
          <Link href="/termeni" className="font-600 text-[var(--sage)] hover:underline">
            Termenii și condițiile
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
