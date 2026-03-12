import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  // Autentificare cu client normal (respectă sesiunea user-ului)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 });
  }

  // Luăm subscription_id din baza de date
  const { data: accountant, error: fetchError } = await supabase
    .from("accountants")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    console.error("cancel-subscription fetch error:", fetchError);
    return NextResponse.json({ error: "Nu am putut citi datele contului." }, { status: 500 });
  }

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

    // Update DB cu admin client (bypass RLS) – la fel ca webhook-ul
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("accountants")
      .update({ stripe_subscription_status: "canceling" })
      .eq("id", user.id);

    if (updateError) {
      console.error("cancel-subscription DB update error:", updateError);
      // Stripe a setat cancel_at_period_end, dar DB nu s-a actualizat – returnăm succes oricum
      // la urmatorul webhook customer.subscription.updated se va actualiza și DB-ul
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("cancel-subscription error:", err);
    return NextResponse.json(
      { error: "Nu am putut anula abonamentul. Încearcă din nou." },
      { status: 500 }
    );
  }
}
