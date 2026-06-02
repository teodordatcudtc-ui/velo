import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { PlanAccessCard } from "./PlanAccessCard";
import { TestEmailButton } from "./TestEmailButton";
import { BillingDetailsForm } from "@/app/components/BillingDetailsForm";
import { IssuedInvoicesCard } from "./IssuedInvoicesCard";
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
  const nonStripePremiumAccess = !stripeSubId && isPremium && !!premiumUntil;
  const showSubscriptionBlock = subscriptionPlan !== "none" || nonStripePremiumAccess;
  const canGenerateCodes =
    !!user.email &&
    (process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase() ===
      user.email.toLowerCase());

  const { data: issuedInvoices } = await supabase
    .from("smartbill_invoices")
    .select(
      "id, smartbill_series, smartbill_number, amount_cents, currency, plan, billing_interval, created_at"
    )
    .eq("accountant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-3">
      <header>
        <h1 className="dash-page-title !mb-0">Setări și profil</h1>
        <p className="text-[14px] text-[var(--ink-soft)]">
          Gestionează datele contului tău și preferințele.
        </p>
      </header>

      {/* Cont: două carduri egale pe desktop */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Cont
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="dash-card flex flex-col h-full">
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
              Profil
            </h2>
            <ProfileForm
              initialName={accountant?.name ?? ""}
              email={user.email ?? ""}
            />
          </div>
          <div className="dash-card flex flex-col h-full">
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
              Schimbă parola
            </h2>
            <PasswordForm />
            <p className="text-sm text-[var(--ink-muted)] mt-4">
              Parola este gestionată prin Supabase Auth. Schimbarea ei va fi efectivă imediat.
            </p>
          </div>
        </div>
      </div>

      {/* Facturare */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Facturare
        </p>
        <div className="dash-card">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
            Date pentru factură (abonament)
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mb-4">
            Folosite la emiterea facturilor pentru plățile Stripe (SmartBill). Le poți actualiza oricând înainte
            de o nouă plată.
          </p>
          <BillingDetailsForm variant="settings" />
          <IssuedInvoicesCard invoices={issuedInvoices ?? []} />
        </div>
      </div>

      {/* Abonament & early access */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          Abonament
        </p>
        <PlanAccessCard
          isPremium={isPremium}
          subscriptionPlan={subscriptionPlan}
          premiumUntil={premiumUntil}
          canGenerateCodes={canGenerateCodes}
          canCancel={canCancel}
          isCanceling={isCanceling}
          nonStripePremiumAccess={nonStripePremiumAccess}
          showSubscriptionBlock={showSubscriptionBlock}
        />
      </div>

      {canGenerateCodes && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            Admin
          </p>
          <div className="dash-card w-full">
            <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">
              Testează trimiterea emailurilor
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mb-3">
              Trimite un email de test către adresa ta, folosind domeniul vello.ro și configurarea actuală Resend.
            </p>
            <TestEmailButton />
          </div>
        </div>
      )}
    </div>
  );
}
