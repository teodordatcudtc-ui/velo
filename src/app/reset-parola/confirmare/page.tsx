"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConfirmareResetParolaPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(
        "Nu am putut seta parola. Linkul poate fi expirat — solicită un nou link de resetare."
      );
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
        <div className="w-full max-w-sm text-center">
          <div
            style={{
              width: 56,
              height: 56,
              background: "#e8f5e9",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h1 className="text-2xl font-bold text-[var(--ink)] mb-3">Parolă actualizată!</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Parola a fost setată cu succes. Te redirecționăm la dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-2">Parolă nouă</h1>
        <p className="text-sm text-[var(--ink-soft)] mb-6">
          Alege o parolă nouă pentru contul tău Vello.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-500 text-[var(--ink-soft)] mb-1"
            >
              Parolă nouă
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Min. 6 caractere"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-500 text-[var(--ink-soft)] mb-1"
            >
              Confirmă parola
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Repetă parola"
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
            {loading ? "Se salvează..." : "Setează parola nouă"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/reset-parola" className="text-[var(--ink-muted)] hover:underline">
            ← Solicită un nou link
          </Link>
        </p>
      </div>
    </main>
  );
}
