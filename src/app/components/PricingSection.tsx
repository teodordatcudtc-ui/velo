"use client";

import { useState } from "react";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type PlanKey = "standard" | "premium";

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: Array<{
    planId: PlanKey;
    eyebrow: string;
    name: string;
    desc: string;
    monthly: number;
    annual: number;
    features: Array<{ text: string; included: boolean }>;
    cta: string;
    note: string;
    featured: boolean;
  }> = [
    {
      planId: "standard",
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
      note: "Fără costuri ascunse",
      featured: false,
    },
    {
      planId: "premium",
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
      note: "Include toate funcțiile Standard",
      featured: true,
    },
  ];

  async function handleCheckout(planId: PlanKey) {
    setError(null);
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          interval: annual ? "annual" : "monthly",
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + "#pricing")}`;
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Ceva a mers greșit.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Nu am primit link de plată.");
    } catch {
      setError("Eroare de rețea.");
    } finally {
      setLoadingPlan(null);
    }
  }

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
          <div className="pricing-toggle-wrap" suppressHydrationWarning>
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
              suppressHydrationWarning
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
              {error && (
                <p className="body" style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>
                  {error}
                </p>
              )}
              <button
                type="button"
                className="pc-cta-primary"
                onClick={() => handleCheckout(plan.planId)}
                disabled={!!loadingPlan}
              >
                {loadingPlan === plan.planId ? "Se încarcă…" : plan.cta}
              </button>
              <div className="pc-note">{plan.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
