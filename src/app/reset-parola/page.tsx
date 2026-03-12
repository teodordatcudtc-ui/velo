"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetParolaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-parola/confirmare`,
    });

    setLoading(false);

    if (err) {
      setError("Nu am putut trimite emailul. Verifică adresa și încearcă din nou.");
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
        <div className="w-full max-w-sm text-center">
          <div
            style={{
              width: 56,
              height: 56,
              background: "var(--sage-light, #e8f5e9)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 24,
            }}
          >
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-3">Verifică emailul</h1>
          <p className="text-sm text-[var(--ink-soft)] mb-6">
            Am trimis un link de resetare la <strong>{email}</strong>. Accesează linkul din email pentru a-ți seta o parolă nouă.
          </p>
          <p className="text-xs text-[var(--ink-muted)] mb-4">
            Nu ai primit emailul? Verifică și folderul de spam.
          </p>
          <Link href="/login" className="text-sm text-[var(--sage)] font-600 hover:underline">
            ← Înapoi la autentificare
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Resetează parola</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-6">
          Introdu adresa de email și îți trimitem un link pentru a seta o parolă nouă.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-500 text-[var(--ink-soft)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="contabil@email.ro"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--terracotta)] font-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--sage)] text-white font-medium hover:bg-[var(--sage-dark)] transition disabled:opacity-50"
          >
            {loading ? "Se trimite..." : "Trimite link de resetare"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-[var(--ink-muted)] hover:underline">
            ← Înapoi la autentificare
          </Link>
        </p>
      </div>
    </main>
  );
}
