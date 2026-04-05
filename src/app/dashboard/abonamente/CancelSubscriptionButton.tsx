"use client";

import { useState } from "react";

type Props = {
  premiumUntil: string | null;
  hasStripeSubscription?: boolean;
  /** Acces Premium limitat în timp fără Stripe (ex. cod early access) — nu există flux de anulare */
  nonStripePremiumAccess?: boolean;
  onCanceled?: () => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return "finalul perioadei";
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CancelSubscriptionButton({
  premiumUntil,
  hasStripeSubscription = false,
  nonStripePremiumAccess = false,
  onCanceled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
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
      setOpen(false);
      onCanceled?.();
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasStripeSubscription) {
    if (nonStripePremiumAccess) {
      return (
        <span
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            lineHeight: 1.5,
            display: "block",
            maxWidth: 340,
          }}
        >
          Accesul nu vine dintr-un abonament Stripe (ex. cod early access). Nu există reînnoire de anulat.
          {premiumUntil && (
            <> Accesul expiră pe {formatDate(premiumUntil)}.</>
          )}
        </span>
      );
    }
    return (
      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
        Nu există un abonament Stripe activ de gestionat aici.
      </span>
    );
  }

  return (
    <>
      {/* Trigger – text roșu discret */}
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); }}
        style={{
          background: "none",
          border: "none",
          color: "#dc2626",
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
          padding: 0,
          whiteSpace: "nowrap",
        }}
      >
        Oprește reînnoirea automată
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => { if (!loading) { setOpen(false); setError(null); } }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111", marginBottom: 12 }}>
              Ești sigur că vrei să oprești abonamentul?
            </h2>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
              Vei păstra accesul până la{" "}
              <strong style={{ color: "#111" }}>{formatDate(premiumUntil)}</strong>.
              După această dată, contul revine la planul gratuit (5 clienți).{" "}
              <strong>Nu se face rambursare.</strong>
            </p>

            {error && (
              <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? "Se procesează…" : "Da, oprește abonamentul"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: "#f4f4f5",
                  color: "#333",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
