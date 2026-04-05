"use client";

import { useCallback, useEffect, useState } from "react";
import { RO_COUNTIES } from "@/lib/ro-counties";

type LoadState = { status: "loading" | "ready" | "error"; message?: string };

export type BillingDetailsFormProps = {
  variant: "checkout" | "settings";
  /** După salvare reușită — ex. deschidere Stripe (doar checkout). */
  onAfterSave?: () => Promise<void>;
  planSummary?: string;
};

export function BillingDetailsForm({
  variant,
  onAfterSave,
  planSummary,
}: BillingDetailsFormProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCompany, setIsCompany] = useState(true);
  const [legalName, setLegalName] = useState("");
  const [vatCode, setVatCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [country, setCountry] = useState("România");
  const [billingEmail, setBillingEmail] = useState("");

  const loadData = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      const res = await fetch("/api/billing", { credentials: "include" });
      if (res.status === 401) {
        setLoad({ status: "error", message: "Neautorizat." });
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoad({ status: "error", message: data.error ?? "Eroare la încărcare." });
        return;
      }
      setLegalName(String(data.legalName ?? ""));
      setVatCode(String(data.vatCode ?? ""));
      setAddress(String(data.address ?? ""));
      setCity(String(data.city ?? ""));
      setCounty(String(data.county ?? ""));
      setCountry(String(data.country ?? "România"));
      setBillingEmail(String(data.billingEmail ?? ""));
      setIsCompany(data.isCompany !== false);
      setLoad({ status: "ready" });
    } catch {
      setLoad({ status: "error", message: "Eroare de rețea." });
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          legalName,
          vatCode,
          address,
          city,
          county,
          country,
          billingEmail,
          isCompany,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Nu am putut salva.");
        return;
      }
      if (onAfterSave) {
        try {
          await onAfterSave();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Nu s-a putut continua la plată.");
        }
      }
    } catch {
      setError("Eroare de rețea.");
    } finally {
      setSaving(false);
    }
  }

  if (load.status === "loading") {
    return (
      <p className="text-sm text-[var(--ink-muted)]">Se încarcă datele de facturare…</p>
    );
  }

  if (load.status === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{load.message}</p>
        <button
          type="button"
          className="text-sm underline text-[var(--sage)]"
          onClick={() => void loadData()}
        >
          Încearcă din nou
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {planSummary && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--ink)]">
          <span className="font-medium">Comandă: </span>
          {planSummary}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--ink)]">
          <input
            type="radio"
            name="entity"
            checked={isCompany}
            onChange={() => setIsCompany(true)}
          />
          Persoană juridică
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--ink)]">
          <input
            type="radio"
            name="entity"
            checked={!isCompany}
            onChange={() => setIsCompany(false)}
          />
          Persoană fizică
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          {isCompany ? "Denumire firmă" : "Nume și prenume"}
        </label>
        <input
          required
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          autoComplete="organization"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          {isCompany ? "CIF (cu RO dacă e cazul)" : "CNP sau 0 / -"}
        </label>
        <input
          required
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
          value={vatCode}
          onChange={(e) => setVatCode(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          Pentru e-Factura: PJ cu CIF valid; PF — CNP valid sau 0 / - conform ghidului SmartBill.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Adresă</label>
        <input
          required
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">
            Localitate
          </label>
          <input
            required
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Cluj-Napoca, Sector 3"
          />
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            În București: localitatea = sectorul (ex. Sector 3), județ = București.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--ink)] mb-1">Județ</label>
          <select
            required
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">— Alege —</option>
            {RO_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">Țară</label>
        <input
          required
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ink)] mb-1">
          Email pentru factură (opțional)
        </label>
        <input
          type="email"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
          placeholder="Lasă gol pentru a folosi emailul contului"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[var(--sage)] text-white font-medium disabled:opacity-60"
      >
        {saving
          ? "Se salvează…"
          : variant === "checkout"
            ? "Continuă la plată (Stripe)"
            : "Salvează datele de facturare"}
      </button>

      {variant === "settings" && (
        <p className="text-xs text-[var(--ink-muted)]">
          Datele rămân salvate în cont — nu trebuie completate din nou la fiecare lună. La fiecare
          reînnoire automată a abonamentului (Stripe) se emite factura în SmartBill cu aceleași date;
          dacă le actualizezi aici, se folosesc de la următoarea plată.
        </p>
      )}
    </form>
  );
}
