import { createClient } from "@/lib/supabase/server";
import { AddClientForm } from "./AddClientForm";
import { ClientCard } from "./ClientCard";
import { DashboardTutorial } from "./DashboardTutorial";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      id,
      name,
      email,
      phone,
      unique_token,
      created_at,
      reminder_enabled,
      reminder_day_of_month,
      document_types ( id, name )
    `
    )
    .eq("accountant_id", user.id)
    .order("created_at", { ascending: false });

  const clientIds = (clients ?? []).map((c) => c.id);
  const { data: uploads } =
    clientIds.length > 0
      ? await supabase
          .from("uploads")
          .select("id, client_id, document_type_id, file_name, month, year, created_at")
          .in("client_id", clientIds)
      : { data: [] };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return (
    <div className="space-y-8">
      <DashboardTutorial userId={user.id} />
      <header>
        <h1 className="dash-page-title">Dashboard</h1>
        <p className="dash-page-sub">
          Clienții tăi și documentele trimise pentru luna curentă.
        </p>
      </header>

      <AddClientForm />

      <section data-tutorial="clients-section">
        <h2 className="text-sm font-700 uppercase tracking-wider text-[var(--ink-muted)] mb-4">
          Clienți
        </h2>
        {!clients?.length ? (
          <div className="dash-card-empty">
            Nu ai încă clienți. Adaugă primul client mai sus.
          </div>
        ) : (
          <ul className="space-y-4">
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                uploads={(uploads ?? []).filter(
                  (u) => u.client_id === client.id
                )}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
