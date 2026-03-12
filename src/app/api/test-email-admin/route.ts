import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const adminEmail = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Doar contul admin poate folosi acest test." }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în variabilele de mediu." },
      { status: 500 },
    );
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM ?? "Vello <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const subject = "Test email Vello (Resend + vello.ro)";
  const html = `
    <p>Bună,</p>
    <p>Aceasta este un email de test trimis din aplicația Vello folosind domeniul <strong>vello.ro</strong>.</p>
    <p>Dacă vezi acest mesaj, configurarea cu Resend și domeniul este funcțională.</p>
    <p>Pentru verificare rapidă poți apăsa linkul de mai jos:</p>
    <p><a href="${appUrl}" style="color:#4b7a6e;font-weight:600;">Deschide Vello</a></p>
    <p>Mulțumim,<br/>Echipa Vello</p>
  `;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: user.email,
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: user.email });
}

