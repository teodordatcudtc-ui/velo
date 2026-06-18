"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export function TestOnboardingEmailButton({ defaultName }: { defaultName: string }) {
  const [pending, setPending] = useState(false);
  const [to, setTo] = useState("");
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState<string | null>(null);
  const toast = useToast();

  async function handleClick() {
    if (!to.trim()) {
      const err = "Introdu o adresă de email de test.";
      setMessage(err);
      toast.error(err);
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/test-onboarding-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error ?? "Eroare la trimiterea emailului de test.";
        setMessage(err);
        toast.error(err);
        return;
      }
      const text = `Email onboarding (test) trimis către ${data.to}.`;
      setMessage(text);
      toast.success(text);
    } catch {
      const err = "Eroare la trimiterea emailului de test.";
      setMessage(err);
      toast.error(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2 pt-4 border-t border-[var(--paper-3)]">
      <h3 className="text-sm font-semibold text-[var(--ink)]">Email onboarding (cont nou)</h3>
      <p className="text-sm text-[var(--ink-muted)]">
        Previzualizează emailul de bun venit trimis automat la înregistrare. Nu modifică flag-ul din baza de date.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          placeholder="Destinatar (ex. tu@gmail.com)"
          className="dash-input w-full sm:w-56"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          autoComplete="off"
        />
        <input
          type="text"
          placeholder="Nume în salut"
          className="dash-input w-full sm:w-44"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={pending}
          onClick={handleClick}
        >
          {pending ? "Se trimite..." : "Trimite onboarding test"}
        </button>
      </div>
      {message && <p className="text-sm text-[var(--ink-soft)]">{message}</p>}
    </div>
  );
}
