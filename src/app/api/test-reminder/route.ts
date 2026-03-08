import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

type AccountantRow = { id: string; name: string };
type ClientReminderRow = { id: string; name: string; email: string | null; unique_token: string };

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în .env.local" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM ?? "Velo <onboarding@resend.dev>";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const admin = createAdminClient();

  const { data: accountant, error: accError } = await admin
    .from("accountants")
    .select("id, name")
    .eq("id", user.id)
    .single();

  if (accError || !accountant) {
    return NextResponse.json({ error: "Contabil negăsit" }, { status: 404 });
  }

  const acc = accountant as AccountantRow;

  const { data: clients } = await admin
    .from("clients")
    .select("id, name, email, unique_token")
    .eq("accountant_id", acc.id)
    .eq("reminder_enabled", true)
    .not("email", "is", null);

  const withEmail = ((clients ?? []) as ClientReminderRow[]).filter((c) => c.email?.trim());
  if (withEmail.length === 0) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      message: "Niciun client cu reminder activ și email setat. Activează programarea la fiecare client (în cardul lui) și completează emailul.",
    });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const client of withEmail) {
    const uploadLink = `${baseUrl}/upload/${client.unique_token}`;
    const subject = `[Test] Documente lunare – ${acc.name}`;
    const html = `
      <p>Bună ziua, ${client.name},</p>
      <p>Contabilul <strong>${acc.name}</strong> vă solicită documentele pentru luna curentă.</p>
      <p><em>Acesta este un email de test.</em></p>
      <p>Accesați linkul de mai jos pentru a încărca documentele (nu este nevoie de cont):</p>
      <p><a href="${uploadLink}" style="color: #4b7a6e; font-weight: 600;">${uploadLink}</a></p>
      <p>Mulțumim,<br/>Echipa Velo</p>
    `;

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: client.email!,
      subject,
      html,
    });

    if (sendError) {
      errors.push(`${client.email}: ${sendError.message}`);
    } else {
      sent++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: withEmail.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
