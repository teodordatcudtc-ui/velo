export const NO_SUBSCRIPTION_CLIENT_LIMIT = 5;
export const STANDARD_CLIENT_LIMIT = 50;

export type AccountantSubscriptionRow = {
  subscription_plan?: string | null;
  premium_until?: string | null;
};

function hasFuturePremiumUntil(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant?.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

/**
 * Acces la funcții Premium (clienți nelimitați, reminder etc).
 * Se acordă pentru:
 * - plan premium activ; sau
 * - early-access pe cont "none" (premium_until în viitor).
 * Nu include planul standard activ.
 */
export function hasPremiumAccess(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (!hasFuturePremiumUntil(accountant, now)) return false;
  return accountant.subscription_plan === "premium" || accountant.subscription_plan === "none";
}

/** Are abonament activ (Standard sau Premium plătit) – nu pentru plan "none". */
export function hasActiveSubscription(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (accountant.subscription_plan === "none") return false;
  return hasFuturePremiumUntil(accountant, now);
}

/** Limită clienți: null = nelimitat (Premium), 5 = fără abonament/expirat, 50 = Standard activ. */
export function getClientLimit(
  accountant: AccountantSubscriptionRow | null | undefined
): number | null {
  if (!accountant) return STANDARD_CLIENT_LIMIT;
  if (hasPremiumAccess(accountant)) return null;
  if (!hasActiveSubscription(accountant)) return NO_SUBSCRIPTION_CLIENT_LIMIT;
  return STANDARD_CLIENT_LIMIT;
}
