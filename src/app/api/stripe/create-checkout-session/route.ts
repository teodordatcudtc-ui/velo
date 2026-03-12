import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getStripe, getAmountCents, getDescription, type PlanId, type Interval } from "@/lib/stripe";

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

    const session = await stripe.checkout.sessions.create(
      isTestPlan
        ? {
            mode: "payment",
            customer_email: user.email ?? undefined,
            client_reference_id: user.id,
            metadata: {
              accountant_id: user.id,
              plan: "test",
              interval: "one_time",
            },
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "ron",
                  product_data: {
                    name: "Vello – plată test",
                    description: "Plată de test 1 RON pentru verificarea integrării Stripe.",
                  },
                  unit_amount: 100, // 1 RON
                },
              },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
          }
        : (() => {
            const plan = (body.plan === "premium" ? "premium" : "standard") as PlanId;
            const interval = (body.interval === "annual" ? "annual" : "monthly") as Interval;
            const amountCents = getAmountCents(plan, interval);
            const description = getDescription(plan, interval);
            return {
              mode: "payment" as const,
              customer_email: user.email ?? undefined,
              client_reference_id: user.id,
              metadata: {
                accountant_id: user.id,
                plan,
                interval,
              },
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency: "eur",
                    product_data: {
                      name: description,
                      description: interval === "annual" ? "12 luni de acces" : "1 lună de acces",
                    },
                    unit_amount: amountCents,
                  },
                },
              ],
              success_url: successUrl,
              cancel_url: cancelUrl,
            };
          })()
    );

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
