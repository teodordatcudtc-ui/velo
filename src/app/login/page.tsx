"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success("Te-ai autentificat.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">Autentificare</h1>
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
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="contabil@email.ro"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-500 text-[var(--ink-soft)] mb-1">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Min. 6 caractere"
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
            {loading ? "Se încarcă..." : "Intră în cont"}
          </button>
        </form>
        <p className="mt-4 text-center text-[var(--ink-soft)] text-sm">
          Nu ai cont?{" "}
          <Link href="/signup" className="text-[var(--sage)] font-600 hover:underline">
            Înregistrare
          </Link>
        </p>
      </div>
    </main>
  );
}
