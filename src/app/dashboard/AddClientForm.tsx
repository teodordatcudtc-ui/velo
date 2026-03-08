"use client";

import { useState } from "react";
import { addClient } from "@/app/actions/clients";
import { useToast } from "@/app/components/ToastProvider";

export function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await addClient(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Client adăugat.");
    setOpen(false);
    (document.getElementById("add-client-form") as HTMLFormElement)?.reset();
  }

  return (
    <div className="dash-card">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-tutorial="add-client"
          className="w-full py-4 flex items-center justify-center gap-2 rounded-[var(--r-md)] border-2 border-dashed border-[var(--paper-3)] text-[var(--ink-soft)] font-medium hover:border-[var(--sage)] hover:text-[var(--sage)] hover:bg-[var(--sage-xlight)] transition"
        >
          <span className="text-lg">+</span> Adaugă client
        </button>
      ) : (
        <form
          id="add-client-form"
          action={handleSubmit}
          className="space-y-4"
        >
          <h3 className="font-semibold text-[var(--ink)]">Client nou</h3>
          <input
            name="name"
            required
            placeholder="Nume client"
            className="dash-input"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (opțional)"
            className="dash-input"
          />
          <input
            name="phone"
            placeholder="Telefon (opțional)"
            className="dash-input"
          />
          {error && (
            <p className="text-sm text-[var(--terracotta)]">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "Se salvează..." : "Salvează"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="btn btn-secondary"
            >
              Anulare
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
