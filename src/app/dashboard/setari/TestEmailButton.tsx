"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export function TestEmailButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const toast = useToast();

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/test-email-admin", { method: "POST" });
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
      <button
        type="button"
        className="btn btn-secondary"
        disabled={pending}
        onClick={handleClick}
      >
        {pending ? "Se trimite..." : "Trimite email de test (admin)"}
      </button>
      {message && (
        <p className="text-sm text-[var(--ink-soft)]">
          {message}
        </p>
      )}
    </div>
  );
}

