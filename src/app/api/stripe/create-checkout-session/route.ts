import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isBillingRowComplete } from "@/lib/billing-validation";
import {
  getStripe,
  getAmountCents,
  getDescription,
  getInvoiceTestProductLabel,
  getStripeInterval,
  INVOICE_TEST_RON_AMOUNT_BANI,
  type PlanId,
  type Interval,
} from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  let body: { plan?: string; interval?: string; successUrl?: string; cancelUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = body.successUrl ?? `${origin}/dashboard?checkout=success`;
  const cancelUrl = body.cancelUrl ?? `${origin}/#pricing`;

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "Plățile nu sunt configurate." },
      { status: 503 }
    );
  }

  try {
    const isInvoiceTest = body.plan === "invoice_test";

    // Plată unică 2 RON — verificare factură SmartBill, fără abonament recurent
    if (isInvoiceTest) {
      const { data: accountantIt } = await supabase
        .from("accountants")
        .select(
          "stripe_customer_id, billing_legal_name, billing_vat_code, billing_address, billing_city, billing_county, billing_country"
        )
        .eq("id", user.id)
        .single();

      const accIt = accountantIt as {
        stripe_customer_id?: string | null;
        billing_legal_name: string | null;
        billing_vat_code: string | null;
        billing_address: string | null;
        billing_city: string | null;
        billing_county: string | null;
        billing_country: string | null;
      } | null;

      if (!accIt || !isBillingRowComplete(accIt)) {
        return NextResponse.json(
          {
            error:
              "Completează datele de facturare înainte de plată (checkout sau Setări → Date pentru factură).",
          },
          { status: 400 }
        );
      }

      const sessionIt = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: accIt.stripe_customer_id ?? undefined,
        customer_email: accIt.stripe_customer_id ? undefined : (user.email ?? undefined),
        client_reference_id: user.id,
        metadata: {
          accountant_id: user.id,
          plan: "none",
          interval: "monthly",
          checkout_product: "invoice_test",
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "ron",
              product_data: {
                name: getInvoiceTestProductLabel(),
                description:
                  "Plată unică pentru a verifica integrarea cu factura fiscală. Nu modifică planul de abonament.",
              },
              unit_amount: INVOICE_TEST_RON_AMOUNT_BANI,
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (!sessionIt.url) {
        return NextResponse.json({ error: "Stripe nu a returnat URL." }, { status: 500 });
      }
      return NextResponse.json({ url: sessionIt.url });
    }

    const isTestPlan = body.plan === "test";

    // Planul ales: test → premium cu 1 EUR, altfel standard sau premium
    const plan = (isTestPlan || body.plan === "premium" ? "premium" : "standard") as PlanId;
    const interval = (body.interval === "annual" ? "annual" : "monthly") as Interval;
    const stripeInterval = getStripeInterval(interval);

    // Prețul: 1 EUR pentru test, normal pentru standard/premium
    const amountCents = isTestPlan ? 100 : getAmountCents(plan, interval);
    const productName = isTestPlan
      ? "Vello Premium – test (1 EUR/lună)"
      : getDescription(plan, interval);
    const productDesc = isTestPlan
      ? "Abonament recurent de test – 1 EUR/lună, anulabil oricând din dashboard."
      : interval === "annual"
        ? "12 luni de acces – reînnoire anuală automată"
        : "1 lună de acces – reînnoire lunară automată";

    // Refolosim customer Stripe dacă există deja
    const { data: accountant } = await supabase
      .from("accountants")
      .select(
        "stripe_customer_id, billing_legal_name, billing_vat_code, billing_address, billing_city, billing_county, billing_country"
      )
      .eq("id", user.id)
      .single();

    const acc = accountant as {
      stripe_customer_id?: string | null;
      billing_legal_name: string | null;
      billing_vat_code: string | null;
      billing_address: string | null;
      billing_city: string | null;
      billing_county: string | null;
      billing_country: string | null;
    } | null;

    if (!acc || !isBillingRowComplete(acc)) {
      return NextResponse.json(
        {
          error:
            "Completează datele de facturare înainte de plată (checkout sau Setări → Date pentru factură).",
        },
        { status: 400 }
      );
    }

    const existingCustomerId = acc.stripe_customer_id ?? undefined;

    const checkoutProduct: "test" | PlanId = isTestPlan ? "test" : plan;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : (user.email ?? undefined),
      client_reference_id: user.id,
      metadata: {
        accountant_id: user.id,
        plan,
        interval,
        checkout_product: checkoutProduct,
      },
      subscription_data: {
        metadata: {
          accountant_id: user.id,
          plan,
          interval,
          checkout_product: checkoutProduct,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: amountCents,
            recurring: {
              interval: stripeInterval,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe nu a returnat URL." }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe create-checkout-session error:", err);
    return NextResponse.json(
      { error: "Nu s-a putut crea sesiunea de plată." },
      { status: 500 }
    );
  }
}
