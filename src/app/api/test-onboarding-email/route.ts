import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_LEGAL } from "@/lib/company-legal";
import { buildOnboardingEmailHtml } from "@/lib/onboarding-email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const adminEmail = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json(
      { error: "Doar contul admin poate folosi acest test." },
      { status: 403 }
    );
  }

  let toEmail: string | null = null;
  let previewName: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.to === "string" && body.to.includes("@")) {
      toEmail = body.to.trim();
    }
    if (body && typeof body.name === "string" && body.name.trim()) {
      previewName = body.name.trim();
    }
  } catch {
    // ignore
  }

  if (!toEmail) {
    return NextResponse.json(
      { error: "Adresa destinatarului lipsește sau nu este validă." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY lipsă. Configurează Resend în variabilele de mediu." },
      { status: 500 }
    );
  }

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", user.id)
    .single();

  const recipientName = previewName ?? accountant?.name ?? "Contabil Demo";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://vello.ro").replace(/\/$/, "");
  const from = process.env.RESEND_FROM ?? "Vello <noreply@vello.ro>";
  const contactEmail = COMPANY_LEGAL.email;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    replyTo: contactEmail,
    to: toEmail,
    subject: "[TEST] Bun venit în Vello — 3 pași și ești gata",
    html: buildOnboardingEmailHtml({
      recipientName,
      dashboardUrl: `${baseUrl}/dashboard`,
      clientsUrl: `${baseUrl}/dashboard/clienti`,
      contactEmail,
    }),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to: toEmail, previewName: recipientName });
}
