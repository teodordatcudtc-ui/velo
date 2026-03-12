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

  const supabase = createAdminClient();

  switch (event.type) {
    // ─── Checkout finalizat (prima plată sau plată one-time test) ───────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountantId = session.metadata?.accountant_id;
      const plan = session.metadata?.plan as "standard" | "premium" | undefined;
      const interval = session.metadata?.interval as "monthly" | "annual" | undefined;

      if (!accountantId || !plan) {
        console.error("checkout.session.completed: missing metadata", session.metadata);
        break;
      }

      if (session.mode === "payment") {
        // Plată one-time (e.g. test 1 EUR) – activăm manual 30 zile
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);

        await supabase
          .from("accountants")
          // @ts-expect-error - Supabase inferred type
          .update({
            subscription_plan: plan,
            premium_until: premiumUntil.toISOString().slice(0, 10),
          })
          .eq("id", accountantId);
      } else if (session.mode === "subscription") {
        // Subscription – salvăm customer_id și subscription_id
        const customerId = typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

        await supabase
          .from("accountants")
          // @ts-expect-error - Supabase inferred type
          .update({
            subscription_plan: plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_subscription_status: "active",
            // premium_until setat la 30 zile ca fallback
            // va fi actualizat corect de invoice.payment_succeeded
            premium_until: (() => {
              const d = new Date();
              interval === "annual"
                ? d.setFullYear(d.getFullYear() + 1)
                : d.setDate(d.getDate() + 31);
              return d.toISOString().slice(0, 10);
            })(),
          })
          .eq("id", accountantId);
      }
      break;
    }

    // ─── Factură plătită cu succes (reînnoire lunară/anuală automată) ────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;

      // Ignorăm prima factură – e deja gestionată de checkout.session.completed
      if (invoice.billing_reason === "subscription_create") break;

      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;

      if (!subscriptionId) break;

      // Găsim accountantul după stripe_subscription_id
      const { data: accountant } = await supabase
        .from("accountants")
        .select("id, subscription_plan")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (!accountant) {
        console.error("invoice.payment_succeeded: no accountant for sub", subscriptionId);
        break;
      }

      // Extindem premium_until cu perioada corespunzătoare
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      let premiumUntil: string;
      if (periodEnd) {
        premiumUntil = new Date(periodEnd * 1000).toISOString().slice(0, 10);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 31);
        premiumUntil = d.toISOString().slice(0, 10);
      }

      await supabase
        .from("accountants")
        // @ts-expect-error - Supabase inferred type
        .update({
          premium_until: premiumUntil,
          stripe_subscription_status: "active",
        })
        .eq("id", accountant.id);

      break;
    }

    // ─── Factură eșuată (card expirat, fonduri insuficiente etc.) ───────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;

      if (!subscriptionId) break;

      await supabase
        .from("accountants")
        // @ts-expect-error - Supabase inferred type
        .update({ stripe_subscription_status: "past_due" })
        .eq("stripe_subscription_id", subscriptionId);

      break;
    }

    // ─── Abonament anulat sau expirat ────────────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const accountantId = subscription.metadata?.accountant_id;

      const filter = accountantId
        ? { column: "id", value: accountantId }
        : { column: "stripe_subscription_id", value: subscription.id };

      await supabase
        .from("accountants")
        // @ts-expect-error - Supabase inferred type
        .update({
          subscription_plan: "none",
          stripe_subscription_status: "canceled",
          premium_until: new Date().toISOString().slice(0, 10),
        })
        .eq(filter.column, filter.value);

      break;
    }

    // ─── Abonament actualizat (upgrade/downgrade) ────────────────────────────
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const accountantId = subscription.metadata?.accountant_id;
      const plan = subscription.metadata?.plan as "standard" | "premium" | undefined;

      if (!accountantId) break;

      await supabase
        .from("accountants")
        // @ts-expect-error - Supabase inferred type
        .update({
          ...(plan ? { subscription_plan: plan } : {}),
          stripe_subscription_status: subscription.status,
        })
        .eq("id", accountantId);

      break;
    }

    default:
      // Ignorăm celelalte evenimente
      break;
  }

  return NextResponse.json({ received: true });
}
