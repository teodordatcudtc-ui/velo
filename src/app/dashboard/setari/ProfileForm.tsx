"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { useToast } from "@/app/components/ToastProvider";

export function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    setPending(true);
    const result = await updateProfile(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Profil actualizat.");
    setSuccess(true);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--ink-soft)] mb-1">
          Nume
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="dash-input"
          placeholder="Numele tău"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1">
          Email (cont)
        </label>
        <input
          type="text"
          value={email}
          readOnly
          className="dash-input bg-[var(--paper)] cursor-not-allowed"
        />
        <p className="text-xs text-[var(--ink-muted)] mt-1">
          Emailul se modifică din contul Supabase / recuperare parolă.
        </p>
      </div>
      {error && <p className="text-sm text-[var(--terracotta)]">{error}</p>}
      {success && <p className="text-sm text-[var(--sage)]">Profil actualizat.</p>}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Se salvează..." : "Salvează"}
      </button>
    </form>
  );
}
