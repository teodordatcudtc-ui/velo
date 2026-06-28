import type Stripe from "stripe";
import type { Interval, PlanId } from "@/lib/stripe";
import { getAmountCents } from "@/lib/stripe";

/** Ofertă activă inclusiv în 5 iulie 2026 (ora României). */
export const LAUNCH_PROMO_END_ISO = "2026-07-05T23:59:59.999+03:00";

export const LAUNCH_PROMO_END_LABEL = "5 iulie 2026";

const PROMO_FIRST_MONTH_EUR: Record<PlanId, number> = {
  standard: 9,
  premium: 19,
};

/** Reducere fixă pe prima factură (EUR cenți). */
const PROMO_DISCOUNT_CENTS: Record<PlanId, number> = {
  standard: 1000,
  premium: 2000,
};

export function isLaunchPromoActive(now = new Date()): boolean {
  return now.getTime() <= new Date(LAUNCH_PROMO_END_ISO).getTime();
}

export function launchPromoAppliesToInterval(interval: Interval): boolean {
  return interval === "monthly";
}

export function isLaunchPromoCheckout(plan: PlanId, interval: Interval, now = new Date()): boolean {
  return isLaunchPromoActive(now) && launchPromoAppliesToInterval(interval);
}

export function getPlanMonthlyEur(plan: PlanId): number {
  return getAmountCents(plan, "monthly") / 100;
}

export function getLaunchPromoFirstMonthEur(plan: PlanId): number {
  return PROMO_FIRST_MONTH_EUR[plan];
}

export function getLaunchPromoDiscountCents(plan: PlanId): number {
  return PROMO_DISCOUNT_CENTS[plan];
}

export function getLaunchPromoCouponId(plan: PlanId): string {
  return `vello_launch_${plan}_monthly_v1`;
}

export type LaunchPromoPriceDisplay = {
  active: boolean;
  /** Preț afișat principal (EUR/lună) */
  displayMonthly: number;
  /** Preț normal tăiat, dacă promo activă */
  originalMonthly?: number;
  footnote: string;
};

export function getLaunchPromoPriceDisplay(
  plan: PlanId,
  interval: Interval,
  now = new Date()
): LaunchPromoPriceDisplay {
  const normalMonthly = getPlanMonthlyEur(plan);
  const active = isLaunchPromoCheckout(plan, interval, now);

  if (!active) {
    return {
      active: false,
      displayMonthly: interval === "annual" ? normalMonthly : normalMonthly,
      footnote:
        interval === "annual"
          ? `Plată anuală: ${interval === "annual" ? "" : ""}`
          : "Facturare lunară",
    };
  }

  const promo = getLaunchPromoFirstMonthEur(plan);
  return {
    active: true,
    displayMonthly: promo,
    originalMonthly: normalMonthly,
    footnote: `Prima lună ${promo} EUR. Din luna a doua: ${normalMonthly} EUR/lună.`,
  };
}

/** Creează / reutilizează cupon Stripe (durată: o singură factură). */
export async function ensureLaunchPromoCoupon(
  stripe: Stripe,
  plan: PlanId
): Promise<string | null> {
  if (!isLaunchPromoActive()) return null;

  const couponId = getLaunchPromoCouponId(plan);
  const redeemBy = Math.floor(new Date(LAUNCH_PROMO_END_ISO).getTime() / 1000);

  try {
    await stripe.coupons.retrieve(couponId);
    return couponId;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code !== "resource_missing") {
      console.error("launch promo coupon retrieve:", err);
      throw err;
    }
  }

  await stripe.coupons.create({
    id: couponId,
    amount_off: getLaunchPromoDiscountCents(plan),
    currency: "eur",
    duration: "once",
    name:
      plan === "standard"
        ? "Vello Standard — prima lună (lansare)"
        : "Vello Premium — prima lună (lansare)",
    redeem_by: redeemBy,
    metadata: { promo: "launch_2026_july" },
  });

  return couponId;
}
