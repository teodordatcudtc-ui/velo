import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

function todayStrInTimeZone(timeZone: string) {
  // Returns YYYY-MM-DD in the given IANA timezone (e.g. Europe/Bucharest)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const y = get("year");
  const m = get("month");
  const d = get("day");
  return y && m && d ? `${y}-${m}-${d}` : new Date().toISOString().slice(0, 10);
}

function addDaysYmd(ymd: string, days: number) {
  // ymd is YYYY-MM-DD
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

type ClientReminderRow = {
  id: string;
  name: string;
  email: string | null;
  unique_token: string;
  accountant_id: string;
  accountants: { name: string } | null;
  reminder_enabled?: boolean;
  archived?: boolean;
};

type RequestReminderRow = {
  id: string;
  client_id: string;
  month: number;
  year: number;
  sent_at: string;
  message: string | null;
  doc_type_names: string[] | null;
  reminder_after_3_days?: boolean;
  clients:
    | {
        id: string;
        name: string;
        email: string | null;
        unique_token: string;
        accountant_id?: string;
        reminder_enabled?: boolean;
        archived?: boolean;
        accountants: { name: string } | null;
      }
    | {
        id: string;
        name: string;
        email: string | null;
        unique_token: string;
        accountant_id?: string;
        reminder_enabled?: boolean;
        archived?: boolean;
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

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const todayRo = todayStrInTimeZone("Europe/Bucharest");

  const supabase = createAdminClient();

  // We look a bit ahead (next 14 days) and then filter by RO calendar day.
  // This allows "send in the morning" even if the stored time is later in the day.
  const horizonIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: scheduledReqs, error: scheduledErr } = await supabase
    .from("document_requests")
    .select(
      "id, client_id, month, year, sent_at, message, reminder_after_3_days, doc_type_names, clients(id, name, email, unique_token, accountant_id, archived, reminder_enabled, accountants(name))"
    )
    .eq("channel", "email_scheduled")
    .lte("sent_at", horizonIso);

  if (scheduledErr) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      requestRemindersSent: 0,
      errors: [`scheduled_requests: ${scheduledErr.message}`],
    });
  }

  const dueScheduled = ((scheduledReqs ?? []) as RequestReminderRow[])
    .map((r) => {
      const clientRaw = r.clients;
      const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
      return { req: r, client };
    })
    .filter(({ req, client }) => {
      if (!client?.email?.trim()) return false;
      if (client.archived) return false;
      // Cererea programată (email_scheduled) nu depinde de clients.reminder_enabled —
      // acel toggle e doar pentru reminder lunar recurent din UI; aici contabilul a ales explicit data.
      // due by RO calendar day (never before the scheduled date in RO)
      return req.sent_at.slice(0, 10) <= todayRo;
    });

  let totalSent = 0;
  const errors: string[] = [];

  for (const { req, client } of dueScheduled) {
    const accName = client?.accountants?.name ?? "Contabilul tău";

    // Always read current doc types at send time (reflect latest changes).
    const { data: docTypes, error: docErr } = await supabase
      .from("document_types")
      .select("name")
      .eq("client_id", req.client_id);
    if (docErr) {
      errors.push(`doc_types ${req.client_id}: ${docErr.message}`);
    }
    const docs = (docTypes ?? []) as { name: string }[];
    const docsHtml =
      docs.length > 0
        ? `<ul>${docs.map((d) => `<li>${d.name}</li>`).join("")}</ul>`
        : "";

    const uploadLink = `${baseUrl}/upload/${client!.unique_token}`;
    const subject = `Documente lunare – ${accName}`;
    const html = `
      <p>Bună ziua, ${client!.name},</p>
      <p>Contabilul <strong>${accName}</strong> vă solicită documentele pentru luna curentă.</p>
      ${docsHtml}
      ${req.message?.trim() ? `<p><strong>Mesaj:</strong> ${req.message.trim()}</p>` : ""}
      <p>Accesați linkul de mai jos pentru a încărca documentele (nu este nevoie de cont):</p>
      <p><a href="${uploadLink}" style="color: #4b7a6e; font-weight: 600;">${uploadLink}</a></p>
      <p>Mulțumim,<br/>Echipa Vello</p>
    `;

    const { error: sendError } = await resend.emails.send({
      from: buildFromWithAccountantName(accName),
      to: client!.email!,
      subject,
      html,
    });

    if (sendError) {
      errors.push(`${client!.email}: ${sendError.message}`);
      continue;
    }

    totalSent++;

    // Mark this scheduled request as sent (prevents re-sending).
    await (supabase as any)
      .from("document_requests")
      .update({
        channel: "email",
        sent_at: new Date().toISOString(),
        doc_type_names: docs.map((d) => d.name),
      })
      .eq("id", req.id);

    // Auto-schedule the next request 30 days after the scheduled date (RO calendar date).
    const scheduledDateRo = req.sent_at.slice(0, 10);
    const nextDateRo = addDaysYmd(scheduledDateRo, 30);
    const nextScheduledIso = `${nextDateRo}T12:00:00.000Z`;
    const [ny, nm] = nextDateRo.split("-").map(Number);

    // Upsert (manual): keep a single scheduled request for that future period.
    const accountantId = (client as any).accountant_id;
    const { data: existing, error: existingError } = await (supabase as any)
      .from("document_requests")
      .select("id")
      .eq("client_id", req.client_id)
      .eq("accountant_id", accountantId)
      .eq("month", nm)
      .eq("year", ny)
      .order("sent_at", { ascending: false });
    if (existingError) {
      errors.push(`next upsert select ${req.client_id}: ${existingError.message}`);
      continue;
    }

    if (!existing || existing.length === 0) {
      const { error: insErr } = await (supabase as any)
        .from("document_requests")
        .insert({
          client_id: req.client_id,
          accountant_id: accountantId,
          month: nm,
          year: ny,
          channel: "email_scheduled",
          doc_type_names: null,
          message: req.message ?? null,
          reminder_after_3_days: !!req.reminder_after_3_days,
          sent_at: nextScheduledIso,
          reminder_sent_at: null,
        });
      if (insErr) {
        errors.push(`next upsert insert ${req.client_id}: ${insErr.message}`);
      }
    } else {
      const keepId = existing[0].id;
      const { error: updErr } = await (supabase as any)
        .from("document_requests")
        .update({
          channel: "email_scheduled",
          doc_type_names: null,
          message: req.message ?? null,
          reminder_after_3_days: !!req.reminder_after_3_days,
          sent_at: nextScheduledIso,
          reminder_sent_at: null,
        })
        .eq("id", keepId);
      if (updErr) {
        errors.push(`next upsert update ${req.client_id}: ${updErr.message}`);
      }
      if (existing.length > 1) {
        const dupIds = existing.slice(1).map((r: any) => r.id);
        await (supabase as any).from("document_requests").delete().in("id", dupIds);
      }
    }
  }

  // 3-day reminders for explicitly created document requests
  const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendingReqs, error: reqErr } = await supabase
    .from("document_requests")
    .select(
      "id, client_id, month, year, sent_at, message, doc_type_names, clients(id, name, email, unique_token, accountants(name))"
    )
    .eq("channel", "email")
    .eq("reminder_after_3_days", true)
    .is("reminder_sent_at", null)
    .lte("sent_at", threeDaysAgoIso);

  if (reqErr) {
    return NextResponse.json({
      ok: true,
      sent: totalSent,
      clients: dueScheduled.length,
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

    // Send reminder only when NOT all required documents are uploaded for that requested period.
    // We treat the client's current document_types list as the required set.
    const { data: requiredTypes, error: typesErr } = await supabase
      .from("document_types")
      .select("id")
      .eq("client_id", req.client_id);
    if (typesErr) {
      errors.push(`doc_types check ${req.id}: ${typesErr.message}`);
      continue;
    }
    const requiredIds = new Set(((requiredTypes ?? []) as { id: string }[]).map((t) => t.id));
    if (requiredIds.size === 0) continue;

    const { data: uploadedRows, error: uploadsErr } = await supabase
      .from("uploads")
      .select("document_type_id")
      .eq("client_id", req.client_id)
      .eq("month", req.month)
      .eq("year", req.year);
    if (uploadsErr) {
      errors.push(`uploads check ${req.id}: ${uploadsErr.message}`);
      continue;
    }
    const uploadedIds = new Set(((uploadedRows ?? []) as { document_type_id: string }[]).map((u) => u.document_type_id));
    let complete = true;
    for (const id of requiredIds) {
      if (!uploadedIds.has(id)) {
        complete = false;
        break;
      }
    }
    if (complete) continue;

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
    clients: dueScheduled.length,
    requestRemindersSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
