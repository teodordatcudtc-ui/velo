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
  const [earlyCode, setEarlyCode] = useState("");
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
    const code = earlyCode.trim().toUpperCase();
    const nextUrl = code ? `/dashboard?early_code=${encodeURIComponent(code)}` : "/dashboard";
    toast.success("Cont creat. Te poți autentifica.");
    router.push(nextUrl);
    router.refresh();
  }

  async function handleGoogleSignUp() {
    setError(null);
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const code = earlyCode.trim().toUpperCase();
    const nextPath = code ? `/dashboard?early_code=${encodeURIComponent(code)}` : "/dashboard";
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
    }
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
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="new-password"
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)]"
              placeholder="Min. 10 caractere, litere, cifre, simbol"
            />
            <ul className="mt-1.5 text-xs text-[var(--ink-muted)] list-disc list-inside space-y-0.5">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </div>
          <div>
            <label htmlFor="early_code" className="block text-sm font-500 text-[var(--ink-soft)] mb-1">
              Cod early access (opțional)
            </label>
            <input
              id="early_code"
              type="text"
              value={earlyCode}
              onChange={(e) => setEarlyCode(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--sage)] focus:ring-2 focus:ring-[var(--sage-light)] uppercase"
              placeholder="EX: EARLY-ABC123"
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
            {loading ? "Se încarcă..." : "Creează cont"}
          </button>

          <div className="relative my-6">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--paper-3)]" />
            </span>
            <span className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-[var(--paper)] px-2 text-[var(--ink-muted)]">sau</span>
            </span>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignUp}
            className="w-full py-3 rounded-lg bg-white border-2 border-[var(--paper-3)] text-[var(--ink)] font-medium hover:border-[var(--paper-2)] hover:bg-[var(--paper)] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuă cu Google
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
