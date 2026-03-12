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

      <div className="dash-card max-w-3xl">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-3">
          Pachete disponibile
        </h2>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h3 className="text-base font-semibold text-[var(--ink)]">
              Standard
            </h3>
            <p className="text-sm text-[var(--ink-soft)] mb-2">
              Ideal pentru început și pentru portofolii mici.
            </p>
            <ul className="list-disc list-inside text-sm text-[var(--ink-soft)] mb-3 space-y-1">
              <li>Până la 40 clienți</li>
              <li>Linkuri unice per client</li>
              <li>Dashboard documente și categorii</li>
            </ul>
            <Link
              href="/checkout?plan=standard&interval=monthly"
              className="btn btn-primary"
            >
              Alege Standard
            </Link>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--ink)]">
              Premium
            </h3>
            <p className="text-sm text-[var(--ink-soft)] mb-2">
              Pentru contabili care vor automatizări și creștere.
            </p>
            <ul className="list-disc list-inside text-sm text-[var(--ink-soft)] mb-3 space-y-1">
              <li>Clienți nelimitați</li>
              <li>Tot ce este în Standard</li>
              <li>Funcții noi (reminder SMS, export ZIP etc.) când devin disponibile</li>
            </ul>
            <Link
              href="/checkout?plan=premium&interval=monthly"
              className="btn btn-secondary"
            >
              Alege Premium
            </Link>
          </div>
        </div>

        <p className="text-xs text-[var(--ink-muted)] mt-4">
          Pentru mai multe detalii despre prețuri și facturare, poți verifica și
          secțiunea de prețuri de pe landing:{" "}
          <Link href="/#pricing" className="text-[var(--sage)] font-600">
            vezi prețuri complete
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

