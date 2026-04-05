"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BillingDetailsForm } from "@/app/components/BillingDetailsForm";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const interval = searchParams.get("interval") ?? "monthly";

  const planId = plan === "premium" ? "premium" : "standard";
  const intervalVal = interval === "annual" ? "annual" : "monthly";

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        const back = `/checkout?plan=${encodeURIComponent(planId)}&interval=${encodeURIComponent(intervalVal)}`;
        window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
      }
    });
  }, [planId, intervalVal]);

  const planSummary = useMemo(() => {
    const intLabel = intervalVal === "annual" ? "anual" : "lunar";
    if (planId === "premium") return `Vello Premium (${intLabel})`;
    return `Vello Standard (${intLabel})`;
  }, [planId, intervalVal]);

  const openStripe = useCallback(async () => {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, interval: intervalVal }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      const back = `/checkout?plan=${encodeURIComponent(planId)}&interval=${encodeURIComponent(intervalVal)}`;
      window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error(data?.error ?? "Nu am putut deschide plata.");
  }, [planId, intervalVal]);

  return (
    <main className="min-h-screen px-4 py-12 bg-[var(--paper)]">
      <div className="max-w-lg mx-auto">
        <p className="text-sm text-[var(--ink-muted)] mb-2">
          <Link href="/#pricing" className="underline hover:text-[var(--ink)]">
            ← Înapoi la prețuri
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Date pentru factură</h1>
        <p className="text-sm text-[var(--ink-muted)] mb-6">
          Completează datele pentru factura fiscală (SmartBill / e-Factura), apoi vei fi redirecționat către
          Stripe pentru plată securizată. Datele se salvează în cont: la reînnoirile lunare sau anuale nu
          trebuie introduse din nou — factura se emite automat la fiecare plată.
        </p>

        <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <BillingDetailsForm
            variant="checkout"
            planSummary={planSummary}
            onAfterSave={openStripe}
          />
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--paper)]">
          <p className="text-[var(--ink)] font-500">Se încarcă…</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
