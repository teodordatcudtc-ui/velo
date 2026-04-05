import Stripe from "stripe";

/** Required: STRIPE_SECRET_KEY. For webhook: STRIPE_WEBHOOK_SECRET. */
const secret = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = secret
  ? new Stripe(secret, { typescript: true })
  : null;

export function getStripe(): Stripe {
  if (!stripe) throw new Error("STRIPE_SECRET_KEY is not set");
  return stripe;
}

/** Plan identifiers and amounts (EUR cents). */
export const STRIPE_PLANS = {
  standard: {
    monthly: 1900,   // 19 EUR/lună
    annual: 16800,   // 14 EUR/lună × 12 = 168 EUR/an
  },
  premium: {
    monthly: 3900,   // 39 EUR/lună
    annual: 34800,   // 29 EUR/lună × 12 = 348 EUR/an
  },
} as const;

export type PlanId = keyof typeof STRIPE_PLANS;
export type Interval = "monthly" | "annual";

export function getAmountCents(plan: PlanId, interval: Interval): number {
  return STRIPE_PLANS[plan][interval];
}

export function getDescription(plan: PlanId, interval: Interval): string {
  const labels: Record<PlanId, string> = {
    standard: "Vello Standard",
    premium: "Vello Premium",
  };
  return interval === "annual"
    ? `${labels[plan]} — 12 luni`
    : `${labels[plan]} — 1 lună`;
}

/** Returns the Stripe recurring interval for a given Interval value. */
export function getStripeInterval(interval: Interval): "month" | "year" {
  return interval === "annual" ? "year" : "month";
}

/** Plată unică în RON — doar pentru test integrare factură (Stripe + SmartBill), fără schimbare abonament. */
export const INVOICE_TEST_RON_AMOUNT_BANI = 200; // 2,00 RON

export function getInvoiceTestProductLabel(): string {
  return "Vello — test facturare (2 RON, plată unică)";
}
