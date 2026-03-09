import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { PlanAccessCard } from "./PlanAccessCard";
import { hasPremiumAccess } from "@/lib/subscription";

export default async function SetariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name, subscription_plan, premium_until")
    .eq("id", user.id)
    .single();

  const isPremium = hasPremiumAccess(accountant);
  const subscriptionPlan =
    accountant?.subscription_plan === "premium" ? "premium" : "standard";
  const premiumUntil = accountant?.premium_until ?? null;
  const canGenerateCodes =
    !!user.email &&
    (process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase() ===
      user.email.toLowerCase());

  return (
    <div className="space-y-8">
      <header>
        <h1 className="dash-page-title">Setări și profil</h1>
        <p className="dash-page-sub">
          Gestionează datele contului tău și preferințele.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          alignItems: "start",
          maxWidth: 980,
        }}
      >
        <div className="dash-card">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
            Profil
          </h2>
          <ProfileForm
            initialName={accountant?.name ?? ""}
            email={user.email ?? ""}
          />
        </div>

        <div className="dash-card">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
            Schimbă parola
          </h2>
          <PasswordForm />
          <p className="text-sm text-[var(--ink-muted)] mt-3">
            Parola este gestionată prin Supabase Auth. Schimbarea ei va fi efectivă imediat.
          </p>
        </div>
      </div>

      <PlanAccessCard
        isPremium={isPremium}
        subscriptionPlan={subscriptionPlan}
        premiumUntil={premiumUntil}
        canGenerateCodes={canGenerateCodes}
      />

    </div>
  );
}
