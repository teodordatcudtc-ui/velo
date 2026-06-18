import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendOnboardingEmailIfNeeded } from "@/lib/onboarding-email";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("name, onboarding_email_sent_at")
    .eq("id", user.id)
    .single();

  const accountantName = accountant?.name ?? "Contabil";
  if (user.email && !accountant?.onboarding_email_sent_at) {
    const accountantId = user.id;
    const email = user.email;
    after(async () => {
      await sendOnboardingEmailIfNeeded({
        accountantId,
        email,
        name: accountantName,
      });
    });
  }

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("accountant_id", user.id);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  const name = accountantName;
  const email = user.email ?? "";
  const initial = (name.split(/\s+/).map((s: string) => s[0]).join("").slice(0, 2) || name[0] || "?").toUpperCase();

  return (
    <DashboardLayoutClient
      userId={user.id}
      name={name}
      email={email}
      initial={initial}
      clientCount={clientCount ?? 0}
      signOut={signOut}
    >
      {children}
    </DashboardLayoutClient>
  );
}
