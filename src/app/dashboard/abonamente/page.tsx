import { createClient } from "@/lib/supabase/server";
import { getClientLimit, hasPremiumAccess } from "@/lib/subscription";
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
    .select("subscription_plan, premium_until")
    .eq("id", user.id)
    .single();

  const limit = getClientLimit(accountant);
  const isPremium = hasPremiumAccess(accountant);
  const planLabel = isPremium
    ? "Premium"
    : accountant?.subscription_plan === "none"
      ? "Gratuit"
      : "Standard";

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
      </p>

      <AbonamentePricing isOwner={isOwner} currentPlan={planLabel} />
    </div>
  );
}
