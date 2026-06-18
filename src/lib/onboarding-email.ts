import { Resend } from "resend";
import { COMPANY_LEGAL } from "@/lib/company-legal";
import { createAdminClient } from "@/lib/supabase/admin";

const SAGE = "#4b7a6e";
const INK = "#1c1917";
const INK_SOFT = "#57534e";
const PAPER = "#f7f4ef";

/** Adresa From pentru emailuri Vello (platformă), nu numele contabilului. */
export function buildVelloFromAddress(): string {
  const base = process.env.RESEND_FROM ?? "Vello <noreply@vello.ro>";
  const match = base.match(/<([^>]+)>/);
  const address = match ? match[1] : base.trim();
  return `Vello <${address}>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayRecipientName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "acolo";
  return trimmed;
}

export function buildOnboardingEmailHtml(params: {
  recipientName: string;
  dashboardUrl: string;
  clientsUrl: string;
  contactEmail: string;
}): string {
  const greeting = escapeHtml(displayRecipientName(params.recipientName));
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e8e2d9;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:${INK};letter-spacing:-0.02em;">
                Vel<span style="color:${SAGE};font-style:italic;">lo</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${INK};font-weight:700;">
                Bun venit, ${greeting}!
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK_SOFT};">
                Mă bucur că ești aici. Vello te ajută să aduni documentele de la clienți fără WhatsApp haotic
                și fără să urmărești manual cine a trimis ce.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${INK};text-transform:uppercase;letter-spacing:0.04em;">
                3 pași simpli
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 14px;background:${PAPER};border-radius:12px;margin-bottom:8px;">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">
                      <strong style="color:${SAGE};">1.</strong>
                      <strong>Adaugă primul client</strong> — nume, email, tipurile de documente pe care le ceri lunar.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 14px;background:${PAPER};border-radius:12px;">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">
                      <strong style="color:${SAGE};">2.</strong>
                      <strong>Trimite primul link</strong> — clientul primește un link unic și încarcă fără cont.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 14px;background:${PAPER};border-radius:12px;">
                    <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">
                      <strong style="color:${SAGE};">3.</strong>
                      <strong>Verifică dashboard-ul</strong> — vezi cine a trimis, ce lipsește și ce e gata de lucru.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;text-align:center;">
              <a href="${params.dashboardUrl}" style="display:inline-block;padding:14px 28px;background:${SAGE};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;">
                Mergi la dashboard
              </a>
              <p style="margin:14px 0 0;font-size:13px;line-height:1.5;color:${INK_SOFT};">
                Sau adaugă direct primul client:
                <a href="${params.clientsUrl}" style="color:${SAGE};font-weight:600;">Clienți</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #e8e2d9;background:${PAPER};">
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${INK_SOFT};">
                Ai întrebări sau vrei un sfat rapid la setup? Scrie-mi la
                <a href="mailto:${params.contactEmail}" style="color:${SAGE};font-weight:600;">${params.contactEmail}</a>
                — îți răspund personal.
              </p>
              <p style="margin:0;font-size:14px;color:${INK};font-weight:600;">
                Teodor<br />
                <span style="font-weight:400;color:${INK_SOFT};">Fondator Vello</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#a8a29e;text-align:center;">
          © ${year} Vello
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Trimite emailul de onboarding o singură dată per contabil. */
export async function sendOnboardingEmailIfNeeded(params: {
  accountantId: string;
  email: string;
  name: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[onboarding-email] RESEND_API_KEY lipsește — email omis.");
    return;
  }

  const to = params.email.trim();
  if (!to) return;

  const admin = createAdminClient();
  const sentAt = new Date().toISOString();

  // Rezervă slotul atomic — evită duplicate la request-uri paralele.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimed, error: claimError } = await (admin as any)
    .from("accountants")
    .update({ onboarding_email_sent_at: sentAt })
    .eq("id", params.accountantId)
    .is("onboarding_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error("[onboarding-email] claim error:", claimError.message);
    return;
  }
  if (!claimed) return;

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://vello.ro").replace(/\/$/, "");
  const from = buildVelloFromAddress();
  const contactEmail = COMPANY_LEGAL.email;
  const recipientName = params.name.trim() || to.split("@")[0] || "acolo";

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from,
    replyTo: contactEmail,
    to,
    subject: "Bun venit în Vello — 3 pași și ești gata",
    html: buildOnboardingEmailHtml({
      recipientName,
      dashboardUrl: `${baseUrl}/dashboard`,
      clientsUrl: `${baseUrl}/dashboard/clienti`,
      contactEmail,
    }),
  });

  if (sendError) {
    console.error("[onboarding-email] send error:", sendError.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("accountants")
      .update({ onboarding_email_sent_at: null })
      .eq("id", params.accountantId);
  }
}
