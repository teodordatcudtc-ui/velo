"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SpvState = {
  connected: boolean;
  companyCif: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export function SpvConnectCard({
  token,
  clientName,
  initial,
  spvQuery,
}: {
  token: string;
  clientName: string;
  initial: SpvState;
  spvQuery?: { spv?: string; spv_error?: string };
}) {
  const router = useRouter();
  const [companyCif, setCompanyCif] = useState(initial.companyCif ?? "");
  const [consent, setConsent] = useState(!!initial.connected);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    spvQuery?.spv_error || initial.lastError
  );
  const justConnected = spvQuery?.spv === "connected";

  const connected = initial.connected || justConnected;

  async function handleConnect() {
    setError(null);
    setPending(true);
    try {
      const saveRes = await fetch("/api/integrations/anaf/client/company-cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, companyCif, consent }),
      });
      const saveJson = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        setError(saveJson.error ?? "Nu am putut salva datele.");
        setPending(false);
        return;
      }
      window.location.href = `/api/integrations/anaf/client/oauth/start?token=${encodeURIComponent(token)}`;
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setPending(false);
    }
  }

  function dismissBanner() {
    router.replace(`/upload/${encodeURIComponent(token)}`, { scroll: false });
  }

  if (connected) {
    return (
      <div className="mt-6 rounded-[var(--r-lg)] border border-[var(--sage-light)] bg-[var(--sage-xlight)] p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sage)] text-white text-sm font-bold"
            aria-hidden
          >
            ✓
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)]">SPV e-Factura conectat</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Facturile din SPV pentru CUI <strong>{initial.companyCif ?? companyCif}</strong> apar automat la
              contabilul tău, în documentele pentru <strong>{clientName}</strong>.
            </p>
            {initial.lastSyncedAt && (
              <p className="text-xs text-[var(--ink-muted)] mt-2">
                Ultima sincronizare:{" "}
                {new Date(initial.lastSyncedAt).toLocaleString("ro-RO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
            {justConnected && (
              <button
                type="button"
                onClick={dismissBanner}
                className="mt-3 text-xs font-medium text-[var(--sage)] hover:underline"
              >
                Închide
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-[var(--r-lg)] border border-[var(--paper-3)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--sage)] mb-1">
        Opțional — e-Factura SPV
      </p>
      <h2 className="font-[var(--f-display)] text-lg font-600 text-[var(--ink)] mb-2">
        Conectează SPV e-Factura
      </h2>
      <p className="text-sm text-[var(--ink-soft)] mb-4">
        Dacă vrei, poți autoriza accesul la facturile tale din SPV. Contabilul le va vedea automat în Vello — nu
        trebuie să le trimiți manual.
      </p>

      {error && (
        <div
          className="mb-4 rounded-[var(--r-md)] border border-[var(--terra-light)] bg-[var(--terra-light)] px-3 py-2 text-sm text-[var(--terra)]"
          role="alert"
        >
          {error}
        </div>
      )}

      <label className="block text-sm font-medium text-[var(--ink)] mb-1" htmlFor="spv-cui">
        CUI firmă (fără RO)
      </label>
      <input
        id="spv-cui"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="ex. 12345678"
        value={companyCif}
        onChange={(e) => setCompanyCif(e.target.value.replace(/[^0-9]/g, ""))}
        className="w-full rounded-[var(--r-md)] border border-[var(--paper-3)] px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--sage-light)]"
      />

      <label className="flex items-start gap-2 text-sm text-[var(--ink-soft)] mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Autorizez conectarea contului meu SPV e-Factura (CUI de mai sus) cu platforma Vello, pentru ca
          contabilul meu să poată importa facturile relevante.
        </span>
      </label>

      <button
        type="button"
        disabled={pending || !companyCif.trim() || !consent}
        onClick={() => void handleConnect()}
        className="w-full rounded-[var(--r-md)] bg-[var(--sage)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity"
      >
        {pending ? "Se deschide ANAF…" : "Conectează SPV"}
      </button>
      <p className="text-xs text-[var(--ink-muted)] mt-3">
        Vei fi redirecționat la ANAF pentru autentificare cu certificatul digital al firmei.
      </p>
    </div>
  );
}
