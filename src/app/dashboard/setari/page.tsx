import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { PlanAccessCard } from "./PlanAccessCard";
import { TestEmailButton } from "./TestEmailButton";
import { BillingDetailsForm } from "@/app/components/BillingDetailsForm";
import { SmartBillSyncStatus } from "./SmartBillSyncStatus";
import { hasPremiumAccess } from "@/lib/subscription";

export default async function SetariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name, subscription_plan, premium_until, stripe_subscription_id, stripe_subscription_status")
    .eq("id", user.id)
    .single();

  const isPremium = hasPremiumAccess(accountant);
  const subscriptionPlan =
    accountant?.subscription_plan === "premium"
      ? "premium"
      : accountant?.subscription_plan === "none"
        ? "none"
        : "standard";
  const premiumUntil = accountant?.premium_until ?? null;
  const stripeSubId = (accountant as { stripe_subscription_id?: string | null } | null)
    ?.stripe_subscription_id ?? null;
  const stripeSubStatus = (accountant as { stripe_subscription_status?: string | null } | null)
    ?.stripe_subscription_status ?? null;
  const isCanceling = stripeSubStatus === "canceling";
  const canCancel =
    !!stripeSubId &&
    !isCanceling &&
    stripeSubStatus !== "canceled" &&
    subscriptionPlan !== "none";
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
        <div className="dash-card md:col-span-2 max-w-2xl">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
            Date pentru factură (abonament)
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mb-4">
            Folosite la emiterea facturilor pentru plățile Stripe (SmartBill). Le poți actualiza oricând înainte
            de o nouă plată.
          </p>
          <BillingDetailsForm variant="settings" />
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <SmartBillSyncStatus />
          </div>
        </div>

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
        canCancel={canCancel}
        isCanceling={isCanceling}
      />

      {canGenerateCodes && (
        <div className="dash-card max-w-xl">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
            Testează trimiterea emailurilor
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mb-3">
            Trimite un email de test către adresa ta, folosind domeniul vello.ro și configurarea actuală Resend.
          </p>
          <TestEmailButton />
        </div>
      )}

    </div>
  );
}
