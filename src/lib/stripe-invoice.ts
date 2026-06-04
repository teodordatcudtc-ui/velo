/** Helpers for Stripe Invoice payloads (API versions vary). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeInvoiceLike = Record<string, any>;

function asSubscriptionId(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("sub_")) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.startsWith("sub_")) return id;
  }
  return null;
}

/** Subscription ID from invoice (legacy `subscription` or newer `parent.subscription_details`). */
export function resolveSubscriptionIdFromInvoice(invoice: StripeInvoiceLike): string | null {
  const direct = asSubscriptionId(invoice.subscription);
  if (direct) return direct;

  const fromParent = asSubscriptionId(
    invoice.parent?.subscription_details?.subscription
  );
  if (fromParent) return fromParent;

  const lines = invoice.lines?.data;
  if (Array.isArray(lines)) {
    for (const line of lines) {
      const fromLine = asSubscriptionId(
        line?.parent?.subscription_item_details?.subscription
      );
      if (fromLine) return fromLine;
    }
  }

  return null;
}

/** Accountant ID from invoice / line metadata (fallback). */
export function resolveAccountantIdFromInvoice(invoice: StripeInvoiceLike): string | null {
  const fromParent = invoice.parent?.subscription_details?.metadata?.accountant_id;
  if (typeof fromParent === "string" && fromParent.length > 0) return fromParent;

  const lines = invoice.lines?.data;
  if (Array.isArray(lines)) {
    for (const line of lines) {
      const id = line?.metadata?.accountant_id;
      if (typeof id === "string" && id.length > 0) return id;
    }
  }

  return null;
}

/** Unix timestamp (seconds) for end of the billed subscription period on the invoice. */
export function resolveInvoicePeriodEndUnix(invoice: StripeInvoiceLike): number | undefined {
  const lineEnd = invoice.lines?.data?.[0]?.period?.end;
  if (typeof lineEnd === "number" && lineEnd > 0) return lineEnd;

  const invoiceEnd = invoice.period_end;
  if (typeof invoiceEnd === "number" && invoiceEnd > 0) return invoiceEnd;

  return undefined;
}

export function premiumUntilIsoFromPeriodEnd(periodEndUnix: number): string {
  return new Date(periodEndUnix * 1000).toISOString();
}
