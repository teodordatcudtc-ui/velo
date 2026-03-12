import { createClient } from "@/lib/supabase/server";
import { getClientLimit, hasPremiumAccess } from "@/lib/subscription";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AbonamentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Next.js middleware or route protection should already redirect,
    // dar pentru siguranță:
    return null;
  }

  const { data: accountant } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until")
    .eq("id", user.id)
    .single();

  const limit = getClientLimit(accountant);
  const isPremium = hasPremiumAccess(accountant);
  const plan =
    isPremium
      ? "Premium"
      : accountant?.subscription_plan === "none"
        ? "Gratuit"
        : "Standard";

  const isOwner =
    !!user.email &&
    !!process.env.EARLY_ACCESS_ADMIN_EMAIL &&
    process.env.EARLY_ACCESS_ADMIN_EMAIL.trim().toLowerCase() ===
      user.email.toLowerCase();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="dash-page-title">Abonamente</h1>
        <p className="dash-page-sub">
          Vezi ce plan ai acum și opțiunile pentru mai mulți clienți.
        </p>
      </header>

      <div className="dash-card max-w-2xl">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-1">
          Planul tău actual
        </h2>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          {plan === "Gratuit" &&
            "Plan gratuit: poți avea până la 5 clienți activi."}
          {plan === "Standard" &&
            "Plan Standard: poți avea până la 40 clienți activi."}
          {plan === "Premium" &&
            "Plan Premium: clienți nelimitați și acces la toate funcțiile noi."}
        </p>
        <p className="text-sm text-[var(--ink-muted)]">
          Limită curentă de clienți:{" "}
          <strong>{limit === null ? "nelimitat" : `${limit} clienți`}</strong>.
        </p>
      </div>

      <section>
        <div className="container">
          <div className="pricing-header" style={{ marginBottom: 16 }}>
            <span className="overline">Pachete</span>
            <div className="h2" style={{ marginTop: 12, marginBottom: 8 }}>
              Alege planul potrivit
              <br />
              pentru cabinetul tău
            </div>
            <p
              className="body"
              style={{
                marginTop: 8,
                maxWidth: 520,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Aceleași pachete ca pe landing, dar cu acțiuni directe în contul
              tău.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pc-eyebrow">Standard</div>
              <div className="pc-name">Standard</div>
              <div className="pc-desc">
                Ideal pentru început și pentru portofolii mici.
              </div>
              <div className="pc-price-wrap">
                <div className="pc-price">
                  <sup>EUR</sup>
                  <span>19</span>
                  <sub>/lună</sub>
                </div>
                <div className="pc-annual-note">
                  Limita de până la 40 clienți activi.
                </div>
              </div>
              <div className="pc-divider" />
              <ul className="pc-features">
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Până la 40 clienți
                </li>
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Linkuri unice per client
                </li>
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Dashboard documente și categorii
                </li>
              </ul>
              <Link
                href="/checkout?plan=standard&interval=monthly"
                className="pc-cta-primary"
              >
                Alege Standard
              </Link>
              <div className="pc-note">Fără costuri ascunse</div>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">⚡ Cel mai popular</div>
              <div className="pc-eyebrow">Premium</div>
              <div className="pc-name">Premium</div>
              <div className="pc-desc">
                Pentru contabili care vor automatizări și creștere.
              </div>
              <div className="pc-price-wrap">
                <div className="pc-price">
                  <sup>EUR</sup>
                  <span>39</span>
                  <sub>/lună</sub>
                </div>
                <div className="pc-annual-note">
                  Clienți nelimitați și toate funcțiile noi.
                </div>
              </div>
              <div className="pc-divider" />
              <ul className="pc-features">
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Clienți nelimitați
                </li>
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Tot ce este în Standard
                </li>
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Reminder automat SMS (când devine disponibil)
                </li>
                <li className="pc-feature">
                  <div className="pc-feature-check">✓</div>
                  Export ZIP lunar (când devine disponibil)
                </li>
              </ul>
              <Link
                href="/checkout?plan=premium&interval=monthly"
                className="pc-cta-primary"
              >
                Alege Premium
              </Link>
              <div className="pc-note">
                Include toate funcțiile Standard
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--ink-muted)] mt-6 text-center">
            Pentru mai multe detalii despre prețuri și facturare, poți verifica și
            secțiunea de prețuri de pe landing:{" "}
            <Link href="/#pricing" className="text-[var(--sage)] font-600">
              vezi prețuri complete
            </Link>
            .
          </p>

          {isOwner && (
            <div className="dash-card max-w-xl mx-auto mt-8 text-center">
              <h3 className="text-base font-semibold text-[var(--ink)] mb-1">
                Testează plata (1 RON)
              </h3>
              <p className="text-sm text-[var(--ink-soft)] mb-3">
                Doar pentru tine (owner). Deschide o sesiune Stripe de test cu o plată
                reală de <strong>1 RON</strong>, ca să verifici că banii intră corect.
              </p>
              <Link
                href="/checkout?plan=test&interval=monthly"
                className="btn btn-secondary"
              >
                Plată test 1 RON
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

