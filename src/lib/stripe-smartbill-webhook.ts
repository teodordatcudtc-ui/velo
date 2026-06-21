import type { SupabaseClient } from "@supabase/supabase-js";
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
