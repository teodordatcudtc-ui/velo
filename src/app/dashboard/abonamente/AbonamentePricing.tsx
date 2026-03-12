"use client";

import { useState } from "react";
import Link from "next/link";

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

type PlanKey = "standard" | "premium";

import CancelSubscriptionButton from "./CancelSubscriptionButton";

type Props = {
  isOwner: boolean;
  currentPlan: string;
  canCancel?: boolean;
  isCanceling?: boolean;
  showSubscriptionSection?: boolean;
  hasStripeSubscription?: boolean;
  premiumUntil?: string | null;
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

export default function AbonamentePricing({
  isOwner,
  currentPlan,
  canCancel = false,
  isCanceling = false,
  showSubscriptionSection = false,
  hasStripeSubscription = false,
  premiumUntil = null,
}: Props) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Optimistic: ascundem butonul imediat după anulare reușită, fără să așteptăm refresh
  const [localCanceled, setLocalCanceled] = useState(false);

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
          // Nu poți cumpăra un plan inferior celui actual
          const isDowngrade =
            currentPlan.toLowerCase() === "premium" && plan.planId === "standard";
          const isBlocked = isCurrent || isDowngrade;
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
              {isBlocked ? (
                <button type="button" className="pc-cta-primary" disabled style={{ opacity: 0.45, cursor: "default" }}>
                  {isCurrent ? "Planul tău actual" : "Inclus în Premium"}
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

      {/* Secțiunea de gestionare abonament – apare când ai orice plan activ */}
      {showSubscriptionSection && (
        <div
          style={{
            maxWidth: 860,
            margin: "32px auto 0",
            padding: "16px 20px",
            background: "var(--paper-2)",
            border: "1px solid var(--paper-3)",
            borderRadius: "var(--r-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
              {isCanceling
                ? "Abonamentul se oprește la finalul perioadei"
                : "Gestionează abonamentul"}
            </p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {isCanceling
                ? "Reînnoirea automată a fost oprită. Accesul continuă până la finalul perioadei plătite."
                : "Abonamentul se reînnoiește automat. Poți opri oricând — accesul rămâne activ până la finalul perioadei."}
              {!isCanceling && premiumUntil && (
                <span style={{ marginLeft: 4, color: "var(--ink-muted)" }}>
                  (perioadă curentă până pe {new Date(premiumUntil).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" })})
                </span>
              )}
            </p>
          </div>
          {(isCanceling || localCanceled) && (
            <span style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", borderRadius: 100, padding: "4px 12px", fontWeight: 600, whiteSpace: "nowrap" }}>
              Se oprește la finalul perioadei
            </span>
          )}
          {!isCanceling && !localCanceled && (
            <CancelSubscriptionButton
              premiumUntil={premiumUntil}
              hasStripeSubscription={hasStripeSubscription || canCancel}
              onCanceled={() => setLocalCanceled(true)}
            />
          )}
        </div>
      )}

      {/* Card test plată – vizibil pentru toți */}
      <div className="pricing-card visible" style={{ maxWidth: 420, margin: "32px auto 0", textAlign: "center" }}>
        <div className="pc-eyebrow">Testare</div>
        <div className="pc-name" style={{ fontSize: 24 }}>Testează plata</div>
        <div className="pc-desc">
          Verifică integrarea cu Stripe cu o plată reală de <strong>1 EUR</strong>.
          Activează planul <strong>Premium</strong> 30 de zile.
        </div>
        <div className="pc-price-wrap">
          <div className="pc-price">
            <sup>EUR</sup>
            <span>1</span>
            <sub>/test</sub>
          </div>
          <div className="pc-annual-note">Plată unică – activează Premium 30 zile</div>
        </div>
        <div className="pc-divider" />
        <Link href="/checkout?plan=test&interval=monthly" className="pc-cta-primary">
          Plată test 1 EUR → Premium
        </Link>
        <div className="pc-note">Fără reînnoire automată</div>
      </div>

      {/* Cardul de owner rămâne separat pentru funcțiile de admin */}
      {isOwner && null}
    </div>
  );
}
