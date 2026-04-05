import type { SupabaseClient } from "@supabase/supabase-js";
import { isBillingRowComplete } from "@/lib/billing-validation";
import {
  getDescription,
  getInvoiceTestProductLabel,
  type Interval,
  type PlanId,
} from "@/lib/stripe";
import {
  getSmartBillEnvForInvoice,
  isSmartBillConfigured,
  issueInvoice,
} from "@/lib/smartbill";

type AccRow = {
  billing_legal_name: string | null;
  billing_vat_code: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_county: string | null;
  billing_country: string | null;
  billing_email: string | null;
  billing_is_company: boolean | null;
};

/**
 * Emite factura SmartBill după plată Stripe; idempotent pe ID sesiune / factură Stripe.
 * Citește mereu datele de facturare din `accountants` (billing_*) — aceleași câmpuri la prima plată
 * și la fiecare reînnoire automată, fără să ceară utilizatorului să le reintroducă.
 */
export async function issueSmartBillAfterStripePayment(
  supabase: SupabaseClient,
  params: {
    accountantId: string;
    stripeCheckoutSessionId: string | null;
    stripeInvoiceId: string | null;
    amountCents: number;
    currency: string;
    checkoutProduct: "test" | "invoice_test" | PlanId;
    interval: Interval;
    mentionExtra: string;
  }
): Promise<void> {
  if (!isSmartBillConfigured()) {
    console.warn("SmartBill: omis — variabilele de mediu nu sunt setate.");
    return;
  }

  if (params.stripeCheckoutSessionId) {
    const { data: existing } = await supabase
      .from("smartbill_invoices")
      .select("id")
      .eq("stripe_checkout_session_id", params.stripeCheckoutSessionId)
      .maybeSingle();
    if (existing) {
      console.log("SmartBill: factură deja emisă pentru sesiunea", params.stripeCheckoutSessionId);
      return;
    }
  }

  if (params.stripeInvoiceId) {
    const { data: existingInv } = await supabase
      .from("smartbill_invoices")
      .select("id")
      .eq("stripe_invoice_id", params.stripeInvoiceId)
      .maybeSingle();
    if (existingInv) {
      console.log("SmartBill: factură deja emisă pentru factura Stripe", params.stripeInvoiceId);
      return;
    }
  }

  const { data: acc, error: accErr } = await supabase
    .from("accountants")
    .select(
      "billing_legal_name, billing_vat_code, billing_address, billing_city, billing_county, billing_country, billing_email, billing_is_company"
    )
    .eq("id", params.accountantId)
    .single();

  if (accErr || !acc) {
    console.error("SmartBill: nu găsesc accountant", params.accountantId, accErr);
    return;
  }

  const row = acc as AccRow;
  if (!isBillingRowComplete(row)) {
    console.error("SmartBill: date de facturare incomplete pentru", params.accountantId);
    return;
  }

  const envSb = getSmartBillEnvForInvoice();
  const amountMajor = params.amountCents / 100;
  const cur = params.currency.toUpperCase() === "EUR" ? "EUR" : params.currency.toUpperCase();

  const productName =
    params.checkoutProduct === "test"
      ? "Vello Premium — test (1 EUR/lună)"
      : params.checkoutProduct === "invoice_test"
        ? getInvoiceTestProductLabel()
        : getDescription(params.checkoutProduct, params.interval);

  const issueDate = new Date().toISOString().slice(0, 10);

  let clientEmail = row.billing_email?.trim() || null;
  if (!clientEmail) {
    const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(
      params.accountantId
    );
    if (authErr) {
      console.warn("SmartBill: email cont indisponibil pentru factură pe email:", authErr.message);
    } else {
      clientEmail = authData.user?.email?.trim() ?? null;
    }
  }

  const clientIsCompany = row.billing_is_company !== false;

  if (envSb.sendInvoiceEmail && !clientEmail) {
    console.warn(
      "SmartBill: nu se trimite factura pe email — lipsește adresa (completează „Email pentru factură” la checkout sau asigură-te că contul are email)."
    );
  }

  const result = await issueInvoice({
    clientName: row.billing_legal_name!,
    clientVatCode: row.billing_vat_code!,
    clientAddress: row.billing_address!,
    clientCity: row.billing_city!,
    clientCounty: row.billing_county!,
    clientCountry: row.billing_country!.trim() || "România",
    clientEmail,
    clientIsCompany,
    productName,
    totalAmountEur: amountMajor,
    currency: cur,
    issueDate,
    mentions: `Plată online Stripe. ${params.mentionExtra}`.slice(0, 2000),
    companyChargesVat: envSb.companyChargesVat,
    taxName: envSb.taxName,
    taxPercentage: envSb.taxPercentage,
    seriesName: envSb.seriesName,
    measuringUnit: envSb.measuringUnit,
    sendInvoiceEmail: envSb.sendInvoiceEmail,
  });

  if (!result.ok) {
    console.error("SmartBill emitere eșuată:", result.error);
    return;
  }

  const { error: insErr } = await supabase.from("smartbill_invoices").insert({
    accountant_id: params.accountantId,
    stripe_checkout_session_id: params.stripeCheckoutSessionId,
    stripe_invoice_id: params.stripeInvoiceId,
    smartbill_series: result.series,
    smartbill_number: result.number,
    amount_cents: params.amountCents,
    currency: cur,
    plan: params.checkoutProduct,
    billing_interval: params.interval,
  });

  if (insErr) {
    console.error("SmartBill: inserare istoric eșuată (factura a fost emisă în SmartBill):", insErr);
  }
}
