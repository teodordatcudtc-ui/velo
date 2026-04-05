import type { SupabaseClient } from "@supabase/supabase-js";
import { isBillingRowComplete } from "@/lib/billing-validation";
import { getDescription, type Interval, type PlanId } from "@/lib/stripe";
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

async function logSync(
  supabase: SupabaseClient,
  p: {
    accountantId: string;
    stripeCheckoutSessionId: string | null;
    stripeInvoiceId: string | null;
    status: "skipped" | "success" | "error";
    errorMessage?: string | null;
    smartbillSeries?: string | null;
    smartbillNumber?: string | null;
    detail?: string | null;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("smartbill_sync_log").insert({
    accountant_id: p.accountantId,
    stripe_checkout_session_id: p.stripeCheckoutSessionId,
    stripe_invoice_id: p.stripeInvoiceId,
    status: p.status,
    error_message: p.errorMessage ?? null,
    smartbill_series: p.smartbillSeries ?? null,
    smartbill_number: p.smartbillNumber ?? null,
    detail: p.detail ?? null,
  });
  if (error) {
    console.error("smartbill_sync_log insert:", error);
  }
}

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
  const baseLog = {
    accountantId: params.accountantId,
    stripeCheckoutSessionId: params.stripeCheckoutSessionId,
    stripeInvoiceId: params.stripeInvoiceId,
  };

  if (!isSmartBillConfigured()) {
    console.warn("SmartBill: omis — variabilele de mediu nu sunt setate.");
    await logSync(supabase, {
      ...baseLog,
      status: "skipped",
      errorMessage: "Variabile SmartBill lipsă pe server (SMARTBILL_EMAIL, SMARTBILL_TOKEN, SMARTBILL_COMPANY_VAT_CODE).",
      detail: "Adaugă-le în Vercel / env și redeploy.",
    });
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
      await logSync(supabase, {
        ...baseLog,
        status: "skipped",
        detail: "Factură deja înregistrată pentru această sesiune Stripe.",
      });
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
      await logSync(supabase, {
        ...baseLog,
        status: "skipped",
        detail: "Factură deja înregistrată pentru această factură Stripe.",
      });
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
    await logSync(supabase, {
      ...baseLog,
      status: "error",
      errorMessage: accErr?.message ?? "Cont contabil negăsit.",
    });
    return;
  }

  const row = acc as AccRow;
  if (!isBillingRowComplete(row)) {
    console.error("SmartBill: date de facturare incomplete pentru", params.accountantId);
    await logSync(supabase, {
      ...baseLog,
      status: "error",
      errorMessage: "Date de facturare incomplete în cont.",
    });
    return;
  }

  const envSb = getSmartBillEnvForInvoice();
  const amountMajor = params.amountCents / 100;
  const cur = params.currency.toUpperCase() === "EUR" ? "EUR" : params.currency.toUpperCase();

  const productName =
    params.checkoutProduct === "test"
      ? "Vello Premium — test (1 EUR/lună)"
      : params.checkoutProduct === "invoice_test"
        ? "Vello — plată unică (facturare)"
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
    await logSync(supabase, {
      ...baseLog,
      status: "error",
      errorMessage: result.error,
      detail:
        "Verifică în SmartBill: serie document, cote TVA (nume identic cu Cloud), SMTP pentru email. Env: SMARTBILL_TAX_NAME, SMARTBILL_INVOICE_SERIES.",
    });
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

  await logSync(supabase, {
    ...baseLog,
    status: "success",
    smartbillSeries: result.series,
    smartbillNumber: result.number,
    detail:
      result.note ??
      "Factură emisă. Dacă nu vezi încasarea automată, adaug-o manual din SmartBill (uneori primul apel reușește fără încasare la emitere).",
  });
}
