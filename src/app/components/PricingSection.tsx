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
      eyebrow: "Standard",
      name: "Standard",
      desc: "Ideal pentru început și pentru portofolii mici",
      monthly: 19,
      annual: 14,
      features: [
        { text: "Până la 40 clienți", included: true },
        { text: "Linkuri unice per client", included: true },
        { text: "Dashboard documente", included: true },
        { text: "Categorii documente", included: true },
        { text: "Reminder automat SMS", included: false },
        { text: "Export ZIP lunar", included: false },
        { text: "Suport prioritar", included: false },
      ],
      cta: "Alege Standard",
      ctaHref: "/signup",
      note: "Fără costuri ascunse",
      featured: false,
    },
    {
      eyebrow: "Premium",
      name: "Premium",
      desc: "Pentru contabili care vor automatizări și creștere",
      monthly: 39,
      annual: 29,
      features: [
        { text: "Clienți nelimitați", included: true },
        { text: "Tot ce este în Standard", included: true },
        { text: "Reminder automat SMS (coming soon)", included: true },
        { text: "Export ZIP lunar (coming soon)", included: true },
        { text: "Suport prioritar", included: true },
      ],
      cta: "Alege Premium",
      ctaHref: "/signup",
      note: "Include toate funcțiile Standard",
      featured: true,
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
          <p className="body" style={{ marginTop: 8, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
            Pachete simple, în EUR, fără surprize: Standard sau Premium.
          </p>
          <div className="pricing-toggle-wrap">
            <span className={`pricing-toggle-label ${!annual ? "active" : ""}`}>Lunar</span>
            <div
              className={`pricing-toggle ${annual ? "on" : ""}`}
              onClick={() => setAnnual(!annual)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAnnual(!annual);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={annual ? "Facturare anuală" : "Facturare lunară"}
            />
            <span className={`pricing-toggle-label ${annual ? "active" : ""}`}>
              Anual <span className="save-badge">-25%</span>
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
                  <sup>EUR</sup>
                  <span>{annual ? plan.annual : plan.monthly}</span>
                  <sub>/lună</sub>
                </div>
                <div className="pc-annual-note">
                  {annual
                    ? `Plată anuală: ${plan.annual * 12} EUR (12 luni achitate în avans)`
                    : "Facturare lunară"}
                </div>
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
