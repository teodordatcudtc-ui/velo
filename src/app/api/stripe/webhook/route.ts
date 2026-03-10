import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set; webhook will reject.");
}

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const accountantId = session.metadata?.accountant_id;
  const plan = session.metadata?.plan as "standard" | "premium" | undefined;
  const interval = session.metadata?.interval as "monthly" | "annual" | undefined;

  if (!accountantId || !plan) {
    console.error("Webhook missing metadata:", session.metadata);
    return NextResponse.json({ received: true });
  }

  const now = new Date();
  const premiumUntil = new Date(now);
  if (interval === "annual") {
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
  } else {
    premiumUntil.setDate(premiumUntil.getDate() + 30);
  }
  const premiumUntilStr = premiumUntil.toISOString().slice(0, 10);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("accountants")
    // @ts-expect-error - Supabase inferred update type can be never in API route context
    .update({
      subscription_plan: plan,
      premium_until: premiumUntilStr,
    })
    .eq("id", accountantId);

  if (error) {
    console.error("Webhook: failed to update accountant:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
