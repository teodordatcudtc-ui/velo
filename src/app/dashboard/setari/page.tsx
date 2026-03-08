import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { ReminderTestButton } from "./ReminderTestButton";

export default async function SetariPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="dash-page-title">Setări și profil</h1>
        <p className="dash-page-sub">
          Gestionează datele contului tău și preferințele.
        </p>
      </header>

      <div className="dash-card max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
          Profil
        </h2>
        <ProfileForm
          initialName={accountant?.name ?? ""}
          email={user.email ?? ""}
        />
      </div>

      <div className="dash-card max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
          Programare mesaj lunar (email)
        </h2>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          Programarea se face <strong>per client</strong> în Dashboard: la fiecare client poți alege ziua lunii în care primește emailul cu linkul de upload. Clienții pot avea zile diferite.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--sage)] hover:text-[var(--sage-dark)]"
        >
          Mergi la Dashboard și programează per client
          <span aria-hidden>→</span>
        </Link>
        <div className="mt-4 pt-4 border-t border-[var(--paper-3)]">
          <p className="text-sm text-[var(--ink-muted)] mb-2">
            Trimite acum un email de test către toți clienții care au programare activă și email setat:
          </p>
          <ReminderTestButton />
        </div>
      </div>

      <div className="dash-card max-w-xl">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">
          Schimbă parola
        </h2>
        <PasswordForm />
        <p className="text-sm text-[var(--ink-muted)] mt-3">
          Parola este gestionată prin Supabase Auth. Schimbarea ei va fi efectivă imediat.
        </p>
      </div>
    </div>
  );
}
