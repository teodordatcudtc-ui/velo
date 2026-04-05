import { createClient } from "@/lib/supabase/server";
import { getClientLimit, hasPremiumAccess, hasActiveSubscription } from "@/lib/subscription";
import AbonamentePricing from "./AbonamentePricing";

export const dynamic = "force-dynamic";

export default async function AbonamentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: accountant } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until, stripe_subscription_id, stripe_subscription_status")
    .eq("id", user.id)
    .single();

  const limit = getClientLimit(accountant);
  const isPremium = hasPremiumAccess(accountant);
  const hasActiveSub = hasActiveSubscription(accountant);
  const planLabel = isPremium
    ? "Premium"
    : accountant?.subscription_plan === "none"
      ? "Gratuit"
      : "Standard";

  const stripeSubId = (accountant as { stripe_subscription_id?: string | null } | null)
    ?.stripe_subscription_id ?? null;
  const stripeSubStatus = (accountant as { stripe_subscription_status?: string | null } | null)
    ?.stripe_subscription_status ?? null;

  const isCanceling = stripeSubStatus === "canceling";
  // Poate anula dacă are abonament recurent Stripe activ (nu deja în anulare)
  const canCancel = hasActiveSub && !!stripeSubId && !isCanceling && stripeSubStatus !== "canceled";
  // Early access / alte cazuri: acces în timp fără subscription Stripe → nu există „anulare” în Stripe
  const nonStripePremiumAccess = !stripeSubId && (isPremium || hasActiveSub);
  // Arătăm secțiunea de gestionare ori de câte ori are plan activ
  const showSubscriptionSection = hasActiveSub || planLabel !== "Gratuit";

  const isOwner =
    !!user.email &&
    !!process.env.EARLY_ACCESS_ADMIN_EMAIL &&
    process.env.EARLY_ACCESS_ADMIN_EMAIL.trim().toLowerCase() ===
      user.email.toLowerCase();

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 32, textAlign: "center" }}>
        Plan actual:{" "}
        <strong style={{ color: "var(--ink)" }}>{planLabel}</strong>
        {" · "}
        {limit === null ? "clienți nelimitați" : `până la ${limit} clienți`}
        {isCanceling && (
          <span style={{ color: "#f59e0b", marginLeft: 8 }}>
            · se oprește la finalul perioadei
          </span>
        )}
      </p>

      <AbonamentePricing
        isOwner={isOwner}
        currentPlan={planLabel}
        canCancel={canCancel}
        isCanceling={isCanceling}
        showSubscriptionSection={showSubscriptionSection}
        nonStripePremiumAccess={nonStripePremiumAccess}
        premiumUntil={accountant?.premium_until ?? null}
      />
    </div>
  );
}
