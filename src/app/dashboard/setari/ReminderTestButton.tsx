"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export function ReminderTestButton({ disabled = false }: { disabled?: boolean }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const toast = useToast();

  async function handleTest() {
    setResult(null);
    setSending(true);
    try {
      const res = await fetch("/api/test-reminder", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error ?? "Eroare la trimitere.";
        setResult(msg);
        toast.error(msg);
        return;
      }
      if (data.sent === 0 && data.message) {
        setResult(data.message);
        toast.info(data.message);
      } else {
        const text = data.errors?.length
          ? `Trimise ${data.sent} emailuri. Erori: ${data.errors.join("; ")}`
          : `Trimise ${data.sent} emailuri de test.`;
        setResult(text);
        toast.success(text);
      }
    } catch {
      setResult("Eroare la trimitere.");
      toast.error("Eroare la trimitere.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleTest}
        disabled={sending || disabled}
        className="btn btn-secondary"
      >
        {disabled ? "Disponibil pe Premium" : sending ? "Se trimit..." : "Trimite test acum"}
      </button>
      {result && (
        <p
          className={`mt-2 text-sm ${
            result.startsWith("Trimise")
              ? "text-[var(--sage)]"
              : result.startsWith("Eroare") || result.startsWith("RESEND")
              ? "text-[var(--terracotta)]"
              : "text-[var(--ink-soft)]"
          }`}
        >
          {result}
        </p>
      )}
    </div>
  );
}
