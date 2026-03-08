"use client";

import { useState } from "react";
import Link from "next/link";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      eyebrow: "Starter",
      name: "Starter",
      desc: "Perfect pentru contabili independenți cu portofoliu mic",
      monthly: 49,
      annual: 39,
      features: [
        { text: "Până la 25 clienți", included: true },
        { text: "Cereri nelimitate", included: true },
        { text: "Email + SMS", included: true },
        { text: "5 GB stocare", included: true },
        { text: "Reminder automat", included: false },
      ],
      cta: "Începe gratuit 14 zile",
      ctaHref: "/signup",
      note: "Fără card, fără obligații",
      featured: false,
    },
    {
      eyebrow: "Pro",
      name: "Pro",
      desc: "Pentru contabili cu activitate intensă",
      monthly: 99,
      annual: 79,
      features: [
        { text: "Până la 100 clienți", included: true },
        { text: "Cereri nelimitate", included: true },
        { text: "Email + SMS", included: true },
        { text: "20 GB stocare", included: true },
        { text: "Reminder automat configurat", included: true },
        { text: "Rapoarte lunare PDF", included: true },
      ],
      cta: "Încearcă Pro gratuit",
      ctaHref: "/signup",
      note: "14 zile trial, anulezi oricând",
      featured: true,
    },
    {
      eyebrow: "Cabinet",
      name: "Cabinet",
      desc: "Pentru birouri cu mai mulți contabili în echipă",
      monthly: 199,
      annual: 159,
      features: [
        { text: "Clienți nelimitați", included: true },
        { text: "5 utilizatori în echipă", included: true },
        { text: "Toate canalele de notificare", included: true },
        { text: "100 GB stocare", included: true },
        { text: "API + integrări custom", included: true },
        { text: "Suport prioritar dedicat", included: true },
      ],
      cta: "Contactează-ne",
      ctaHref: "mailto:contact@velo.ro",
      note: "Demo personalizat disponibil",
      featured: false,
    },
  ];

  return (
    <section id="pricing">
      <div className="container">
        <div className="pricing-header">
          <span className="overline">Prețuri</span>
          <div className="h2" style={{ marginTop: 12, marginBottom: 8 }}>
            Simplu, <em>transparent,</em>
            <br />
            fără surprize
          </div>
          <p className="body" style={{ marginTop: 8, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            Fără contract pe termen lung. Anulezi oricând.
          </p>

          <div className="pricing-toggle-wrap">
            <span className={`pricing-toggle-label ${!annual ? "active" : ""}`}>Lunar</span>
            <div
              className={`pricing-toggle ${annual ? "on" : ""}`}
              onClick={() => setAnnual(!annual)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAnnual(!annual); } }}
              role="button"
              tabIndex={0}
              aria-label={annual ? "Facturare anuală" : "Facturare lunară"}
            />
            <span className={`pricing-toggle-label ${annual ? "active" : ""}`}>
              Anual <span className="save-badge">-20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
              {plan.featured && <div className="popular-badge">⚡ Cel mai popular</div>}
              <div className="pc-eyebrow">{plan.eyebrow}</div>
              <div className="pc-name">{plan.name}</div>
              <div className="pc-desc">{plan.desc}</div>
              <div className="pc-price-wrap">
                <div className="pc-price">
                  <sup>RON</sup>
                  <span>{annual ? plan.annual : plan.monthly}</span>
                  <sub>/lună</sub>
                </div>
                <div className="pc-annual-note">{annual ? "facturat anual" : "\u00a0"}</div>
              </div>
              <div className="pc-divider" />
              <ul className="pc-features">
                {plan.features.map((f) => (
                  <li key={f.text} className={`pc-feature ${!f.included ? "pc-feature-x" : ""}`}>
                    <div className="pc-feature-check">{CHECK}</div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href={plan.ctaHref} className="pc-cta-primary">
                {plan.cta}
              </Link>
              <div className="pc-note">{plan.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
