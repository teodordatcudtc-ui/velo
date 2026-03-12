"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export function TestEmailButton() {
  const [pending, setPending] = useState(false);
  const [to, setTo] = useState("");
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
      const res = await fetch("/api/test-email-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data?.error ?? "Eroare la trimiterea emailului de test.";
        setMessage(err);
        toast.error(err);
        return;
      }
      const text = `Email de test trimis către ${data.to}.`;
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          placeholder="ex. client@test.com"
          className="dash-input w-full sm:w-72"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={pending}
          onClick={handleClick}
        >
          {pending ? "Se trimite..." : "Trimite email de test"}
        </button>
      </div>
      {message && (
        <p className="text-sm text-[var(--ink-soft)]">
          {message}
        </p>
      )}
    </div>
  );
}

