import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildFromWithAccountantName(accountantName: string | null | undefined): string {
  const base = process.env.RESEND_FROM ?? "Vello <noreply@vello.ro>";
  const name = accountantName?.trim();
  if (!name) return base;
  const match = base.match(/<(.+)>/);
  const address = match ? match[1] : base;
  return `${name} – Vello <${address}>`;
}

export async function POST(request: NextRequest) {
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

  let toEmail: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.to === "string" && body.to.includes("@")) {
      toEmail = body.to.trim();
    }
  } catch {
    // ignore JSON errors, we'll fall back mai jos
  }

  if (!toEmail) {
    return NextResponse.json({ error: "Adresa destinatarului lipsește sau nu este validă." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în variabilele de mediu." },
      { status: 500 },
    );
  }

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", user.id)
    .single();
  const accountantName = accountant?.name ?? "Contabil";

  const resend = new Resend(apiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const demoClientName = "Client Demo SRL";
  const uploadLink = `${appUrl}/upload/EXEMPLU-TOKEN-TEST`;
  const docsHtml = `
    <ul>
      <li>Facturi vânzare (PDF)</li>
      <li>Extrase bancare</li>
      <li>Bonuri și chitanțe relevante</li>
    </ul>
  `;
  const customMessage = `
    <p><strong>Mesaj:</strong> acesta este un email de test, pentru a vedea cum arată cererea de documente pentru client.</p>
  `;

  const subject = `Cerere documente - ${accountantName}`;
  const html = `
        <p>Bună ziua, ${demoClientName},</p>
        <p>${accountantName} vă solicită documentele pentru perioada curentă.</p>
        ${docsHtml}
        ${customMessage}
        <p>Puteți încărca documentele aici:</p>
        <p><a href="${uploadLink}" style="color:#4b7a6e;font-weight:600">${uploadLink}</a></p>
        <p>Mulțumim,<br/>Echipa Vello</p>
      `;

  const { error } = await resend.emails.send({
    from: buildFromWithAccountantName(accountantName),
    to: toEmail,
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: toEmail });
}

