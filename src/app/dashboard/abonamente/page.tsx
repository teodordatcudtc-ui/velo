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
      {/* Header pagină */}
      <header style={{ textAlign: "center", marginBottom: 8 }}>
        <h1 className="dash-page-title">Abonamente</h1>
      </header>

      {/* Planul actual – subtil, centrat */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "var(--paper-2)",
            border: "1px solid var(--paper-3)",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 13,
            color: "var(--ink-soft)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: planLabel === "Gratuit" ? "var(--ink-muted)" : "var(--sage)",
              flexShrink: 0,
            }}
          />
          <span>
            Plan actual:{" "}
            <strong style={{ color: "var(--ink)" }}>{planLabel}</strong>
            {" · "}
            {limit === null ? "clienți nelimitați" : `până la ${limit} clienți`}
          </span>
        </div>
      </div>

      {/* Pachete prețuri cu toggle anual/lunar */}
      <AbonamentePricing isOwner={isOwner} currentPlan={planLabel} />
    </div>
  );
}
