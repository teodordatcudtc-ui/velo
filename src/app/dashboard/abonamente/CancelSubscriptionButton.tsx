"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  premiumUntil: string | null;
  hasStripeSubscription?: boolean;
};

export default function CancelSubscriptionButton({ premiumUntil, hasStripeSubscription = false }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Ceva a mers greșit. Încearcă din nou.");
        return;
      }
      setDone(true);
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--paper-3)",
          borderRadius: "var(--r-lg)",
          padding: "14px 16px",
          fontSize: 13,
          color: "var(--ink-soft)",
        }}
      >
        ✓ Abonamentul va fi oprit la sfârșitul perioadei curente
        {endDate && <span style={{ fontWeight: 600, color: "var(--ink)" }}> ({endDate})</span>}.
        Până atunci ai acces complet.
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        style={{
          background: "#fff8f8",
          border: "1px solid #fecaca",
          borderRadius: "var(--r-lg)",
          padding: "16px",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--ink)", marginBottom: 8, fontWeight: 600 }}>
          Ești sigur că vrei să oprești abonamentul?
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          Vei păstra accesul până la{" "}
          <strong style={{ color: "var(--ink)" }}>{endDate ?? "sfârșitul perioadei"}</strong>.
          După această dată, contul revine la planul gratuit (5 clienți). Nu se face rambursare.
        </p>
        {error && (
          <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 8 }}>{error}</p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-md)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Se procesează…" : "Da, oprește abonamentul"}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={loading}
            style={{
              background: "var(--paper-2)",
              color: "var(--ink)",
              border: "1px solid var(--paper-3)",
              borderRadius: "var(--r-md)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Anulează
          </button>
        </div>
      </div>
    );
  }

  // Dacă nu are stripe_subscription_id (ex: plată one-time sau migrație neaplicată)
  // → nu putem anula din Stripe, dar afișăm oricum o notă informativă
  if (!hasStripeSubscription) {
    return (
      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
        Reînnoire automată activă
      </span>
    );
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: 13, color: "var(--red)", marginBottom: 8 }}>{error}</p>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-muted)",
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        Oprește reînnoirea automată
      </button>
    </div>
  );
}
