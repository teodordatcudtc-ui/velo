export const STANDARD_CLIENT_LIMIT = 40;

export type AccountantSubscriptionRow = {
  subscription_plan?: string | null;
  premium_until?: string | null;
};

/** Acces la funcții Premium (clienți nelimitați, reminder etc). Expiră la premium_until. */
export function hasPremiumAccess(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (accountant.subscription_plan !== "premium") return false;
  if (!accountant.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

/** Are abonament activ (Standard sau Premium) – premium_until în viitor. */
export function hasActiveSubscription(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant?.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

export function getClientLimit(
  accountant: AccountantSubscriptionRow | null | undefined
): number | null {
  return hasPremiumAccess(accountant) ? null : STANDARD_CLIENT_LIMIT;
}
