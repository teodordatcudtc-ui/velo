"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/password";
import { useToast } from "@/app/components/ToastProvider";

export default function SignupPage() {
  const [name, setName] = useState("");
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
    const validation = validatePassword(password);
    if (!validation.ok) {
      setError(validation.error);
      toast.error(validation.error);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success("Cont creat. Te poți autentifica.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--ink)] mb-6">
          Înregistrare contabil
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-500 text-[var(--ink-soft)] mb-1">
              Nume
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Numele tău"
            />
          </div>
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
              minLength={10}
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Min. 10 caractere, litere, cifre, simbol"
            />
            <ul className="mt-1.5 text-xs text-[var(--ink-muted)] list-disc list-inside space-y-0.5">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>
          {error && (
            <p className="text-sm text-[var(--terracotta)] font-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--sage)] text-white font-medium hover:bg-[var(--sage-dark)] transition disabled:opacity-50"
          >
            {loading ? "Se încarcă..." : "Creează cont"}
          </button>
        </form>
        <p className="mt-4 text-center text-[var(--ink-soft)] text-sm">
          Ai deja cont?{" "}
          <Link href="/login" className="text-[var(--sage)] font-600 hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </main>
  );
}
