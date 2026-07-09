import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe, type Interval, type PlanId } from "@/lib/stripe";
import { issueSmartBillAfterStripePayment } from "@/lib/smartbill-issue";

export function resolveStripeInvoiceIdFromCheckoutSession(session: {
  invoice?: string | { id?: string } | null;
}): string | null {
  if (typeof session.invoice === "string") return session.invoice;
  if (session.invoice && typeof session.invoice === "object") {
    const id = session.invoice.id;
    if (typeof id === "string") return id;
  }
  return null;
}

/** ID factură Stripe pentru prima plată abonament (sesiune checkout). */
export async function resolveCheckoutInvoiceId(
  session: Stripe.Checkout.Session,
  subscriptionId: string | null
): Promise<string | null> {
  const fromSession = resolveStripeInvoiceIdFromCheckoutSession(session);
  if (fromSession) return fromSession;

  const stripe = getStripe();

  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["latest_invoice"],
      });
      const inv = sub.latest_invoice;
      if (typeof inv === "string") return inv;
      if (inv && typeof inv === "object" && typeof inv.id === "string") return inv.id;
    } catch (e) {
      console.warn(
        "resolveCheckoutInvoiceId: subscription latest_invoice:",
        e instanceof Error ? e.message : e
      );
    }
  }

  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["invoice"],
    });
    return resolveStripeInvoiceIdFromCheckoutSession(full);
  } catch (e) {
    console.warn(
      "resolveCheckoutInvoiceId: session retrieve:",
      e instanceof Error ? e.message : e
    );
  }

  return null;
}

/** Evită factură dublă SmartBill la prima plată (checkout + subscription_create). */
export async function shouldSkipSmartBillForSubscriptionCreate(
  supabase: SupabaseClient,
  accountantId: string,
  stripeInvoiceId: string,
  amountCents: number
): Promise<boolean> {
  const { data: byInvoice } = await supabase
    .from("smartbill_invoices")
    .select("id")
    .eq("stripe_invoice_id", stripeInvoiceId)
    .maybeSingle();
  if (byInvoice) return true;

  const since = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("smartbill_invoices")
    .select("id, stripe_invoice_id")
    .eq("accountant_id", accountantId)
    .eq("amount_cents", amountCents)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!recent) return false;

  if (!recent.stripe_invoice_id) {
    await supabase
      .from("smartbill_invoices")
      .update({ stripe_invoice_id: stripeInvoiceId })
      .eq("id", recent.id);
  }

  return true;
}

/** Emite SmartBill pentru o factură Stripe plătită (reînnoire sau prima factură abonament). */
export async function issueSmartBillAfterStripeInvoice(
  supabase: SupabaseClient,
  params: {
    accountantId: string;
    accountantPlan: string | null;
    stripeInvoiceId: string;
    amountCents: number;
    currency: string;
    subscriptionId: string | null;
    mentionExtra: string;
  }
): Promise<void> {
  let checkoutProduct: "test" | "invoice_test" | PlanId =
    params.accountantPlan === "premium"
      ? "premium"
      : params.accountantPlan === "standard"
        ? "standard"
        : "standard";
  let interval: Interval = "monthly";

  if (params.subscriptionId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(params.subscriptionId);
      checkoutProduct =
        (sub.metadata?.checkout_product as "test" | "invoice_test" | PlanId | undefined) ??
        (sub.metadata?.plan as PlanId | undefined) ??
        checkoutProduct;
      interval = (sub.metadata?.interval as Interval | undefined) ?? interval;
    } catch (e) {
      console.warn(
        "SmartBill: nu am putut citi abonamentul Stripe, folosesc planul din DB:",
        e instanceof Error ? e.message : e
      );
    }
  }

  await issueSmartBillAfterStripePayment(supabase, {
    accountantId: params.accountantId,
    stripeCheckoutSessionId: null,
    stripeInvoiceId: params.stripeInvoiceId,
    amountCents: params.amountCents,
    currency: params.currency,
    checkoutProduct,
    interval,
    mentionExtra: params.mentionExtra,
  });
}
