"use client";

import { useState } from "react";
import { updatePassword } from "@/app/actions/profile";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { useToast } from "@/app/components/ToastProvider";

export function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;
    const validation = validatePassword(password ?? "");
    if (!validation.ok) {
      setError(validation.error);
      toast.error(validation.error);
      return;
    }
    if (password !== confirm) {
      setError("Parolele nu coincid.");
      toast.error("Parolele nu coincid.");
      return;
    }
    setPending(true);
    const result = await updatePassword(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Parola a fost actualizată.");
    setSuccess(true);
    (document.getElementById("password-form") as HTMLFormElement)?.reset();
  }

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink-muted)]">
          Pentru a schimba parola, apasă butonul de mai jos.
        </p>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          Resetează parola
        </button>
      </div>
    );
  }

  return (
    <form id="password-form" action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--ink-soft)] mb-1">
          Parolă nouă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          className="dash-input"
          placeholder="Min. 10 caractere, litere, cifre, simbol"
        />
        <ul className="mt-1.5 text-xs text-[var(--ink-muted)] list-disc list-inside space-y-0.5">
          {PASSWORD_REQUIREMENTS.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-[var(--ink-soft)] mb-1">
          Confirmă parola
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={10}
          className="dash-input"
          placeholder="Repetă parola"
        />
      </div>
      {error && <p className="text-sm text-[var(--terracotta)]">{error}</p>}
      {success && <p className="text-sm text-[var(--sage)]">Parola a fost actualizată.</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Se actualizează..." : "Actualizează parola"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setSuccess(false);
            (document.getElementById("password-form") as HTMLFormElement)?.reset();
          }}
        >
          Anulează
        </button>
      </div>
    </form>
  );
}
