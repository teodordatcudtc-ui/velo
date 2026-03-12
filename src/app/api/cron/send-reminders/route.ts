import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

type ClientReminderRow = {
  id: string;
  name: string;
  email: string | null;
  unique_token: string;
  accountant_id: string;
  accountants: { name: string } | null;
};

type RequestReminderRow = {
  id: string;
  client_id: string;
  month: number;
  year: number;
  sent_at: string;
  message: string | null;
  doc_type_names: string[] | null;
  clients:
    | {
        id: string;
        name: string;
        email: string | null;
        unique_token: string;
        accountants: { name: string } | null;
      }
    | {
        id: string;
        name: string;
        email: string | null;
        unique_token: string;
        accountants: { name: string } | null;
      }[]
    | null;
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function buildFromWithAccountantName(accountantName: string | null | undefined): string {
  const base = process.env.RESEND_FROM ?? "Vello <noreply@vello.ro>";
  const name = accountantName?.trim();
  if (!name) return base;
  const match = base.match(/<(.+)>/);
  const address = match ? match[1] : base;
  return `${name} – Vello <${address}>`;
}

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în .env.local" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
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
      <p>Mulțumim,<br/>Echipa Vello</p>
    `;

    const { error: sendError } = await resend.emails.send({
      from: buildFromWithAccountantName(accName),
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

  // 3-day reminders for explicitly created document requests
  const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendingReqs, error: reqErr } = await supabase
    .from("document_requests")
    .select(
      "id, client_id, month, year, sent_at, message, doc_type_names, clients(id, name, email, unique_token, accountants(name))"
    )
    .eq("reminder_after_3_days", true)
    .is("reminder_sent_at", null)
    .lte("sent_at", threeDaysAgoIso);

  if (reqErr) {
    return NextResponse.json({
      ok: true,
      sent: totalSent,
      clients: withEmail.length,
      requestRemindersSent: 0,
      errors: [`document_requests: ${reqErr.message}`, ...errors],
    });
  }

  let requestRemindersSent = 0;
  const reqRows = (pendingReqs ?? []) as RequestReminderRow[];
  for (const req of reqRows) {
    const clientRaw = req.clients;
    const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
    if (!client?.email?.trim()) continue;

    // send reminder only when there are zero uploads for that requested period
    const { count: uploadCount, error: uploadsErr } = await supabase
      .from("uploads")
      .select("*", { count: "exact", head: true })
      .eq("client_id", req.client_id)
      .eq("month", req.month)
      .eq("year", req.year);
    if (uploadsErr) {
      errors.push(`uploads check ${req.id}: ${uploadsErr.message}`);
      continue;
    }
    if ((uploadCount ?? 0) > 0) continue;

    const accName = client.accountants?.name ?? "Contabilul tău";
    const uploadLink = `${baseUrl}/upload/${client.unique_token}`;
    const docsList =
      req.doc_type_names && req.doc_type_names.length > 0
        ? `<ul>${req.doc_type_names.map((d) => `<li>${d}</li>`).join("")}</ul>`
        : "";
    const customMessage = req.message?.trim()
      ? `<p><strong>Mesaj inițial:</strong> ${req.message.trim()}</p>`
      : "";

    const { error: sendError } = await resend.emails.send({
      from: buildFromWithAccountantName(accName),
      to: client.email,
      subject: `Reminder documente – ${accName}`,
      html: `
        <p>Bună ziua, ${client.name},</p>
        <p>Este un reminder că încă așteptăm documentele solicitate de <strong>${accName}</strong>.</p>
        ${docsList}
        ${customMessage}
        <p>Le puteți încărca aici:</p>
        <p><a href="${uploadLink}" style="color: #4b7a6e; font-weight: 600;">${uploadLink}</a></p>
        <p>Mulțumim,<br/>Echipa Vello</p>
      `,
    });

    if (sendError) {
      errors.push(`${client.email}: ${sendError.message}`);
      continue;
    }

    const { error: markErr } = await (supabase as any)
      .from("document_requests")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", req.id);
    if (markErr) {
      errors.push(`mark reminder ${req.id}: ${markErr.message}`);
      continue;
    }

    requestRemindersSent++;
  }

  return NextResponse.json({
    ok: true,
    sent: totalSent,
    clients: withEmail.length,
    requestRemindersSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
