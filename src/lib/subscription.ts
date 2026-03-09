export const STANDARD_CLIENT_LIMIT = 40;

export type AccountantSubscriptionRow = {
  subscription_plan?: string | null;
  premium_until?: string | null;
};

export function hasPremiumAccess(
  accountant: AccountantSubscriptionRow | null | undefined,
  now: Date = new Date()
): boolean {
  if (!accountant) return false;
  if (accountant.subscription_plan === "premium") return true;
  if (!accountant.premium_until) return false;
  return new Date(accountant.premium_until).getTime() > now.getTime();
}

export function getClientLimit(
  accountant: AccountantSubscriptionRow | null | undefined
): number | null {
  return hasPremiumAccess(accountant) ? null : STANDARD_CLIENT_LIMIT;
}
