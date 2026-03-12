"use client";

import { useState } from "react";
import Link from "next/link";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type PlanKey = "standard" | "premium";

type Props = {
  isOwner: boolean;
  currentPlan: string;
};

const PLANS: Array<{
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

export default function AbonamentePricing({ isOwner, currentPlan }: Props) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const interval = annual ? "annual" : "monthly";
        const checkoutUrl = `/checkout?plan=${encodeURIComponent(planId)}&interval=${encodeURIComponent(interval)}`;
        window.location.href = `/login?redirect=${encodeURIComponent(checkoutUrl)}`;
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
    <div>
      {/* Toggle Lunar / Anual – identic cu landing page */}
      <div className="pricing-toggle-wrap" style={{ marginBottom: 40 }}>
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

      {/* Carduri – identice cu landing page, cu clasa `visible` adăugată direct */}
      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan.toLowerCase() === plan.planId;
          return (
            <div key={plan.planId} className={`pricing-card visible ${plan.featured ? "featured" : ""}`}>
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
                <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 8 }}>
                  {error}
                </p>
              )}
              {isCurrent ? (
                <button type="button" className="pc-cta-primary" disabled style={{ opacity: 0.45, cursor: "default" }}>
                  Planul tău actual
                </button>
              ) : (
                <button
                  type="button"
                  className="pc-cta-primary"
                  onClick={() => handleCheckout(plan.planId)}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === plan.planId ? "Se încarcă…" : plan.cta}
                </button>
              )}
              <div className="pc-note">{plan.note}</div>
            </div>
          );
        })}
      </div>

      {/* Card test plată – doar pentru owner */}
      {isOwner && (
        <div className="pricing-card visible" style={{ maxWidth: 420, margin: "32px auto 0", textAlign: "center" }}>
          <div className="pc-eyebrow">Test owner</div>
          <div className="pc-name" style={{ fontSize: 24 }}>Testează plata</div>
          <div className="pc-desc">
            Activează planul <strong>Premium</strong> cu o plată reală de <strong>1 EUR</strong>.
            Verificare integrare Stripe.
          </div>
          <div className="pc-price-wrap">
            <div className="pc-price">
              <sup>EUR</sup>
              <span>1</span>
              <sub>/test</sub>
            </div>
            <div className="pc-annual-note">Plată unică de test – activează Premium 30 zile</div>
          </div>
          <div className="pc-divider" />
          <Link href="/checkout?plan=test&interval=monthly" className="pc-cta-primary">
            Plată test 1 EUR → Premium
          </Link>
          <div className="pc-note">Doar pentru contul owner</div>
        </div>
      )}
    </div>
  );
}
