"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Clientul meu trebuie să creeze un cont pe Vello?",
    a: "Nu, niciodată. Clientul primește un link unic securizat pe email sau SMS. Deschide linkul direct pe telefon, fără instalare, fără înregistrare. Experiența e la fel de simplă ca și cum ar trimite o poză unui prieten.",
  },
  {
    q: "Ce se întâmplă dacă un client nu trimite documentele?",
    a: "Vello trimite automat un reminder după 3 zile (configurabil). Dacă tot nu răspunde, poți activa o a doua notificare sau primi o alertă ca să poți interveni manual. Tu controlezi tot fluxul.",
  },
  {
    q: "Documentele sunt în siguranță?",
    a: "Da. Toate fișierele sunt stocate criptat în centre de date din UE, conform GDPR. Linkurile de upload expiră automat după termenul setat. Niciun terț nu are acces la datele tale sau ale clienților.",
  },
  {
    q: "Funcționează și pe telefon, nu doar pe desktop?",
    a: "100% responsive. Atât aplicația ta (ca și contabil) cât și pagina clientului sunt optimizate pentru telefon. Clientul poate face poze direct din cameră și le trimite instantaneu.",
  },
  {
    q: "Pot importa clienții existenți?",
    a: "Da! Poți importa lista de clienți dintr-un fișier Excel / CSV. Durează 5 minute să ai toți clienții în Vello și să trimiți prima cerere.",
  },
  {
    q: "Mă pot dezabona oricând?",
    a: "Absolut. Nu există contract minim sau penalitate. Anulezi cu un click, fără întrebări. Poți exporta toate datele tale oricând.",
  },
  {
    q: "Cum mă ajută Vello la colectare documente contabili?",
    a: "Vello automatizează colectare documente contabili: trimiți cereri de documente către clienți și urmărești într-un singur loc cine a trimis și ce lipsește. Fiecare încărcare este asociată de aplicație cu clientul și luna fiscală corectă.",
  },
  {
    q: "Cum funcționează upload documente clienți contabil în Vello?",
    a: "Pentru upload documente clienți contabil, trimiți fiecărui client un link unic de încărcare. Clientul deschide linkul pe telefon sau laptop, încarcă PDF-uri sau poze, iar documentele apar instant în contul tău, sortate pe client, tip de document și perioadă.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq">
      <div className="container">
        <script
          type="application/ld+json"
          // FAQ schema pentru Google / AI, bazat pe aceleași întrebări vizibile
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
            }),
          }}
        />
        <div className="faq-inner">
          <div className="faq-left">
            <span className="overline">Întrebări frecvente</span>
            <div className="h2" style={{ marginTop: 12, marginBottom: 20 }}>
              Ai <em>întrebări?</em>
              <br />
              Avem răspunsuri.
            </div>
            <p className="body">
              Nu găsești ce cauți? Scrie-ne și răspundem în câteva minute.
            </p>
            <a
              href="mailto:contact@vello.ro"
              className="btn btn-primary"
              style={{ marginTop: 24, display: "inline-flex" }}
            >
              Vorbește cu noi
            </a>
          </div>

          <div className="faq-list" suppressHydrationWarning>
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.q}
                className={`faq-item ${openIndex === i ? "open" : ""}`}
              >
                <div
                  className="faq-question"
                  suppressHydrationWarning
                  onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenIndex(openIndex === i ? -1 : i);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {item.q}
                  <div className="faq-arrow">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                <div className="faq-answer">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
