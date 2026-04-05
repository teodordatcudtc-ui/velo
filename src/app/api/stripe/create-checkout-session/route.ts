import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isBillingRowComplete } from "@/lib/billing-validation";
import {
  getStripe,
  getAmountCents,
  getDescription,
  getStripeInterval,
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
    const rawPlan = body.plan;
    if (rawPlan !== "standard" && rawPlan !== "premium") {
      return NextResponse.json({ error: "Plan invalid." }, { status: 400 });
    }

    const plan = rawPlan as PlanId;
    const interval = (body.interval === "annual" ? "annual" : "monthly") as Interval;
    const stripeInterval = getStripeInterval(interval);

    const amountCents = getAmountCents(plan, interval);
    const productName = getDescription(plan, interval);
    const productDesc =
      interval === "annual"
        ? "12 luni de acces – reînnoire anuală automată"
        : "1 lună de acces – reînnoire lunară automată";

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : (user.email ?? undefined),
      client_reference_id: user.id,
      metadata: {
        accountant_id: user.id,
        plan,
        interval,
        checkout_product: plan,
      },
      subscription_data: {
        metadata: {
          accountant_id: user.id,
          plan,
          interval,
          checkout_product: plan,
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
