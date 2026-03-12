"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEarlyAccessCode,
  redeemEarlyAccessCode,
  setSubscriptionPlanForTesting,
} from "@/app/actions/profile";
import { useToast } from "@/app/components/ToastProvider";

type Props = {
  isPremium: boolean;
  subscriptionPlan: "none" | "standard" | "premium";
  premiumUntil: string | null;
  canGenerateCodes?: boolean;
  canCancel?: boolean;
  isCanceling?: boolean;
};

function formatDate(dateIso: string | null): string {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PlanAccessCard({
  isPremium,
  subscriptionPlan,
  premiumUntil,
  canGenerateCodes = false,
  canCancel = false,
  isCanceling = false,
}: Props) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [lastSuccessText, setLastSuccessText] = useState<string | null>(null);
  const [creatingCode, setCreatingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  const statusText = useMemo(() => {
    if (subscriptionPlan === "premium" && premiumUntil && new Date(premiumUntil) > new Date())
      return "Premium activ";
    if (isPremium && premiumUntil) return `Early access activ până la ${formatDate(premiumUntil)}`;
    if (subscriptionPlan === "none") return "Plan gratuit (5 clienți)";
    if (premiumUntil && new Date(premiumUntil) <= new Date()) return "Fără plan activ (expirat)";
    if (subscriptionPlan === "standard" && !premiumUntil) return "Standard activ";
    return "Fără plan activ";
  }, [isPremium, premiumUntil, subscriptionPlan]);

  async function handleRedeem(formData: FormData) {
    setPending(true);
    setLastSuccessText(null);
    try {
      const result = await redeemEarlyAccessCode(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      const text = result.premiumUntil
        ? `Cod aplicat. Premium activ până la ${formatDate(result.premiumUntil)}.`
        : "Cod aplicat cu succes.";
      setLastSuccessText(text);
      toast.success(text);
      router.refresh();
    } catch {
      toast.error("Nu am putut valida codul acum. Verifică conexiunea și încearcă din nou.");
    } finally {
      setPending(false);
    }
  }

  async function handleCreateCode(formData: FormData) {
    setCreatingCode(true);
    setGeneratedCode(null);
    try {
      const result = await createEarlyAccessCode(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (result?.code) {
        setGeneratedCode(result.code);
        toast.success(`Cod creat: ${result.code}`);
      }
    } catch {
      toast.error("Nu am putut genera codul acum. Încearcă din nou.");
    } finally {
      setCreatingCode(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data.error ?? "Ceva a mers greșit. Încearcă din nou.");
        return;
      }
      setCancelDone(true);
      setCancelConfirming(false);
      toast.success("Reînnoirea automată a fost oprită. Accesul continuă până la finalul perioadei.");
      router.refresh();
    } catch {
      setCancelError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handlePlanSwitch(formData: FormData) {
    setSwitchingPlan(true);
    try {
      const result = await setSubscriptionPlanForTesting(formData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      const msg =
        result?.plan === "premium"
          ? "Plan schimbat pe Premium (test)."
          : result?.plan === "none"
            ? "Plan schimbat pe Fără pachet (test)."
            : "Plan schimbat pe Standard (test).";
      toast.success(msg);
    } catch {
      toast.error("Nu am putut salva schimbarea de plan. Încearcă din nou.");
    } finally {
      setSwitchingPlan(false);
    }
  }

  return (
    <div className="dash-card max-w-xl">
      <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Plan abonament</h2>
      <p className="text-sm text-[var(--ink-soft)] mb-3">{statusText}</p>
      <div className="text-sm text-[var(--ink-muted)] mb-4">
        {isPremium
          ? "Ai clienți nelimitați și acces la funcțiile Premium."
          : subscriptionPlan === "none"
            ? "Plan gratuit: maxim 5 clienți. Alege Standard sau Premium pentru mai mulți."
            : "Plan Standard: maxim 40 clienți activi. Upgrade la Premium pentru clienți nelimitați."}
      </div>

      {canGenerateCodes && (
        <div className="pt-4 mb-4 border-t border-[var(--paper-3)]">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">Schimbă planul (test)</h3>
          <p className="text-sm text-[var(--ink-muted)] mb-3">
            Temporar poți selecta manual planul pentru a testa restricțiile și funcțiile.
          </p>
          <form action={handlePlanSwitch} className="flex items-center gap-2">
            <select
              name="plan"
              defaultValue={subscriptionPlan}
              className="dash-input"
              style={{ minWidth: 200 }}
            >
              <option value="none">Plan gratuit (5 clienți)</option>
              <option value="standard">Standard (40 clienți)</option>
              <option value="premium">Premium (nelimitat)</option>
            </select>
            <button type="submit" className="btn btn-secondary" disabled={switchingPlan}>
              {switchingPlan ? "Se salvează..." : "Aplică planul"}
            </button>
          </form>
        </div>
      )}

      {/* Gestionare abonament – apare ori de câte ori ai un plan activ */}
      {subscriptionPlan !== "none" && (
        <div className="pt-4 mb-0 border-t border-[var(--paper-3)]">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">Abonament</h3>
          {(isCanceling || cancelDone) ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Reînnoirea automată este oprită. Accesul continuă până la{" "}
              <strong>{formatDate(premiumUntil)}</strong>, după care contul revine la planul gratuit.
            </p>
          ) : canCancel ? (
            cancelConfirming ? (
              <div style={{ background: "#fff8f8", border: "1px solid #fecaca", borderRadius: "var(--r-md)", padding: 12, marginTop: 8 }}>
                <p className="text-sm text-[var(--ink)] mb-2" style={{ fontWeight: 600 }}>
                  Ești sigur că vrei să oprești reînnoirea?
                </p>
                <p className="text-sm text-[var(--ink-soft)] mb-3">
                  Accesul continuă până la <strong>{formatDate(premiumUntil)}</strong>. Nu se face rambursare.
                </p>
                {cancelError && (
                  <p className="text-sm mb-2" style={{ color: "var(--red)" }}>{cancelError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="btn"
                    style={{ background: "#dc2626", color: "#fff", border: "none", fontSize: 13 }}
                  >
                    {cancelLoading ? "Se procesează…" : "Da, oprește"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCancelConfirming(false); setCancelError(null); }}
                    disabled={cancelLoading}
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                  >
                    Renunță
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[var(--ink-soft)] mb-2">
                  Abonamentul se reînnoiește automat.
                  {premiumUntil && ` Perioada curentă expiră pe ${formatDate(premiumUntil)}.`}
                </p>
                <button
                  type="button"
                  onClick={() => setCancelConfirming(true)}
                  className="text-sm"
                  style={{ color: "var(--ink-muted)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Oprește reînnoirea automată
                </button>
              </div>
            )
          ) : (
            <p className="text-sm text-[var(--ink-soft)]">
              {premiumUntil
                ? `Accesul expiră pe ${formatDate(premiumUntil)}. Nu există reînnoire automată.`
                : "Planul tău activ nu se reînnoiește automat."}
            </p>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-[var(--paper-3)]">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">Cod early access</h3>
        <p className="text-sm text-[var(--ink-muted)] mb-3">
          Introdu codul primit pentru acces Premium full 45 zile.
        </p>
        <form action={handleRedeem} className="flex gap-2 items-center">
          <input
            name="code"
            type="text"
            required
            autoComplete="off"
            placeholder="EX: EARLY-ABC123"
            className="dash-input flex-1"
            style={{ textTransform: "uppercase" }}
          />
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Se aplică..." : "Aplică cod"}
          </button>
        </form>
        {lastSuccessText && (
          <p className="text-sm text-[var(--sage)] mt-2">{lastSuccessText}</p>
        )}
      </div>

      {canGenerateCodes && (
        <div className="pt-4 mt-4 border-t border-[var(--paper-3)]">
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">Generează cod early access</h3>
          <p className="text-sm text-[var(--ink-muted)] mb-3">
            Poți personaliza formatul codului cu prefix și segment client.
          </p>
          <form action={handleCreateCode} className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Prefix cod</label>
              <input
                name="code_prefix"
                type="text"
                maxLength={16}
                defaultValue="EARLY"
                placeholder="EARLY"
                className="dash-input w-[130px]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Segment client</label>
              <input
                name="client_segment"
                type="text"
                maxLength={16}
                placeholder="ACME"
                className="dash-input w-[130px]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Zile</label>
              <input
                name="valid_days"
                type="number"
                min={1}
                max={365}
                defaultValue={45}
                className="dash-input w-[110px]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Utilizări</label>
              <input
                name="max_uses"
                type="number"
                min={1}
                max={1000}
                defaultValue={1}
                className="dash-input w-[110px]"
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={creatingCode}>
              {creatingCode ? "Se generează..." : "Generează cod"}
            </button>
          </form>
          {generatedCode && (
            <p className="text-sm text-[var(--sage)] mt-2">
              Cod generat: <strong>{generatedCode}</strong>
            </p>
          )}
          <p className="text-xs text-[var(--ink-muted)] mt-2">
            Exemplu format: <strong>EARLY-CLIENT-X7K2Q9</strong>
          </p>
        </div>
      )}
    </div>
  );
}
