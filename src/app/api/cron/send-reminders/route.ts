import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type ClientReminderRow = {
  id: string;
  name: string;
  email: string | null;
  unique_token: string;
  accountant_id: string;
  accountants: { name: string } | null;
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const secretParam = url.searchParams.get("secret");
  const provided = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : secretParam;
  if (cronSecret && provided !== cronSecret) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în .env.local" },
      { status: 500 }
    );
  }

  const fromEmail = process.env.RESEND_FROM ?? "Velo <onboarding@resend.dev>";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (request.headers.get("x-forwarded-host")
      ? `https://${request.headers.get("x-forwarded-host")}`
      : "http://localhost:3000");

  const today = new Date();
  const dayOfMonth = today.getDate();

  const supabase = createAdminClient();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, email, unique_token, accountant_id, accountants(name)")
    .eq("reminder_enabled", true)
    .eq("reminder_day_of_month", dayOfMonth)
    .not("email", "is", null);

  if (clientsError) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      message: "Eroare la citire clienți",
    });
  }

  const withEmail = ((clients ?? []) as ClientReminderRow[]).filter((c) => c.email?.trim());
  let totalSent = 0;
  const errors: string[] = [];

  for (const client of withEmail) {
    const accName =
      client.accountants?.name ??
      "Contabilul tău";
    const uploadLink = `${baseUrl}/upload/${client.unique_token}`;
    const subject = `Documente lunare – ${accName}`;
    const html = `
      <p>Bună ziua, ${client.name},</p>
      <p>Contabilul <strong>${accName}</strong> vă solicită documentele pentru luna curentă.</p>
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
      totalSent++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    clients: withEmail.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
