import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
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
    const isTestPlan = body.plan === "test";

    if (isTestPlan) {
      // Plată unică de test 1 EUR → activează Premium 30 zile
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email ?? undefined,
        client_reference_id: user.id,
        metadata: {
          accountant_id: user.id,
          plan: "premium",
          interval: "monthly",
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              product_data: {
                name: "Vello – plată test Premium (1 EUR)",
                description: "Plată de test 1 EUR – activează planul Premium.",
              },
              unit_amount: 100,
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
    }

    // Abonament recurent (Standard sau Premium)
    const plan = (body.plan === "premium" ? "premium" : "standard") as PlanId;
    const interval = (body.interval === "annual" ? "annual" : "monthly") as Interval;
    const amountCents = getAmountCents(plan, interval);
    const description = getDescription(plan, interval);
    const stripeInterval = getStripeInterval(interval);

    // Dacă userul are deja un customer Stripe, îl refolosim
    const { data: accountant } = await supabase
      .from("accountants")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: accountant?.stripe_customer_id ?? undefined,
      customer_email: accountant?.stripe_customer_id ? undefined : (user.email ?? undefined),
      client_reference_id: user.id,
      metadata: {
        accountant_id: user.id,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          accountant_id: user.id,
          plan,
          interval,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: {
              name: description,
              description: interval === "annual" ? "12 luni de acces – reînnoire anuală automată" : "1 lună de acces – reînnoire lunară automată",
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
