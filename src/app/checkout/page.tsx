"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const interval = searchParams.get("interval") ?? "monthly";
  const [status, setStatus] = useState<"loading" | "error" | "redirect">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const planId = plan === "premium" ? "premium" : "standard";
    const intervalVal = interval === "annual" ? "annual" : "monthly";

    fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, interval: intervalVal }),
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          const back = `/checkout?plan=${encodeURIComponent(planId)}&interval=${encodeURIComponent(intervalVal)}`;
          window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
          return { _skip: true };
        }
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        if (data?._skip) return;
        if (data?.url) {
          setStatus("redirect");
          window.location.href = data.url;
          return;
        }
        if (data?.error) {
          setStatus("error");
          setMessage(data.error);
          return;
        }
        setStatus("error");
        setMessage("Nu am putut deschide pagina de plată.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Eroare de rețea.");
      });
  }, [plan, interval]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
        <div className="text-center">
          <p className="text-[var(--ink)] font-500">Se deschide plata...</p>
          <p className="text-sm text-[var(--ink-muted)] mt-2">Nu închide această pagină.</p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
        <div className="text-center max-w-sm">
          <p className="text-[var(--ink)] font-500">{message}</p>
          <Link
            href="/#pricing"
            className="inline-block mt-4 py-2 px-4 rounded-lg bg-[var(--sage)] text-white font-500"
          >
            Înapoi la prețuri
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
      <div className="text-center">
        <p className="text-[var(--ink)] font-500">Se deschide Stripe...</p>
      </div>
    </main>
  );
}
