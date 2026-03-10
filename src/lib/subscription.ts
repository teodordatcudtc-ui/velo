export const NO_SUBSCRIPTION_CLIENT_LIMIT = 5;
export const STANDARD_CLIENT_LIMIT = 40;

export type AccountantSubscriptionRow = {
  subscription_plan?: string | null;
  premium_until?: string | null;
};

/** Acces la funcții Premium (clienți nelimitați, reminder etc). Include early access: dacă premium_until e în viitor, ai acces indiferent de subscription_plan. */
export function hasPremiumAccess(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (!accountant.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

/** Are abonament activ (Standard sau Premium plătit) – nu pentru plan "none". */
export function hasActiveSubscription(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (accountant.subscription_plan === "none") return false;
  if (!accountant.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

/** Limită clienți: null = nelimitat (Premium), 5 = fără abonament (gratuit), 40 = Standard. */
export function getClientLimit(
  accountant: AccountantSubscriptionRow | null | undefined
): number | null {
  if (!accountant) return STANDARD_CLIENT_LIMIT;
  if (hasPremiumAccess(accountant)) return null;
  if (accountant.subscription_plan === "none") return NO_SUBSCRIPTION_CLIENT_LIMIT;
  return STANDARD_CLIENT_LIMIT;
}
