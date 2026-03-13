import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientiView } from "./ClientiView";
import { getClientLimit, hasPremiumAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function ClientiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accountant } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until")
    .eq("id", user.id)
    .single();

  const isPremium = hasPremiumAccess(accountant);
  const clientLimit = getClientLimit(accountant);

  const { data: activeClients } = await supabase
    .from("clients")
    .select(
      `id, name, email, phone, unique_token, created_at, reminder_enabled, reminder_day_of_month, document_types ( id, name )`
    )
    .eq("accountant_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const { data: archivedClients } = await supabase
    .from("clients")
    .select(
      `id, name, email, phone, unique_token, created_at, reminder_enabled, reminder_day_of_month, document_types ( id, name )`
    )
    .eq("accountant_id", user.id)
    .eq("archived", true)
    .order("created_at", { ascending: false });

  const clientIds = [
    ...(activeClients ?? []).map((c) => c.id),
    ...(archivedClients ?? []).map((c) => c.id),
  ];
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

  const activeIds = (activeClients ?? []).map((c) => c.id);
  const { data: requestsThisMonth } =
    activeIds.length > 0
      ? await supabase
          .from("document_requests")
          .select("client_id, sent_at")
          .in("client_id", activeIds)
          .eq("month", currentMonth)
          .eq("year", currentYear)
      : { data: [] };
  const clientIdsWithRequest = (requestsThisMonth ?? []).map((r) => r.client_id);

  const { data: upcomingRequests } =
    activeIds.length > 0
      ? await supabase
          .from("document_requests")
          .select("client_id, sent_at")
          .in("client_id", activeIds)
          .gte("sent_at", new Date().toISOString())
          .order("sent_at", { ascending: true })
      : { data: [] };

  const nextRequestByClient: Record<string, string> = {};
  for (const req of upcomingRequests ?? []) {
    if (!nextRequestByClient[req.client_id]) {
      nextRequestByClient[req.client_id] = req.sent_at;
    }
  }

  return (
    <ClientiView
      clients={activeClients ?? []}
      archivedClients={archivedClients ?? []}
      uploads={uploads ?? []}
      clientIdsWithRequest={clientIdsWithRequest}
      nextRequestByClient={nextRequestByClient}
      currentMonth={currentMonth}
      currentYear={currentYear}
      isPremium={isPremium}
      clientLimit={clientLimit}
      userId={user.id}
    />
  );
}
