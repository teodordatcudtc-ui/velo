import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  // Luăm subscription_id din baza de date
  const { data: accountant } = await supabase
    .from("accountants")
    .select("stripe_subscription_id, subscription_plan, premium_until")
    .eq("id", user.id)
    .single();

  const subscriptionId = (accountant as { stripe_subscription_id?: string | null } | null)
    ?.stripe_subscription_id;

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Nu ai un abonament Stripe activ de anulat." },
      { status: 400 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Plățile nu sunt configurate." }, { status: 503 });
  }

  try {
    // Anulare la sfârșitul perioadei curente (nu imediat)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Marcăm în DB că abonamentul e în curs de anulare
    await (supabase
      .from("accountants") as unknown as { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
      .update({ stripe_subscription_status: "canceling" })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("cancel-subscription error:", err);
    return NextResponse.json(
      { error: "Nu am putut anula abonamentul. Încearcă din nou." },
      { status: 500 }
    );
  }
}
