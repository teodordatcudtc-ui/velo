import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatisticiCharts } from "./StatisticiCharts";

export default async function StatisticiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .eq("accountant_id", user.id);

  const clientIds = (clients ?? []).map((c) => c.id);
  const totalClients = clientIds.length;

  let clientsWithUploadsThisMonth = 0;
  let uploadsByDocType: { name: string; count: number }[] = [];

  if (clientIds.length > 0) {
    const { data: uploads } = await supabase
      .from("uploads")
      .select("id, client_id, document_type_id, month, year")
      .in("client_id", clientIds);

    const uploadsList = uploads ?? [];

    const sentThisMonth = new Set(
      uploadsList
        .filter((u) => u.month === currentMonth && u.year === currentYear)
        .map((u) => u.client_id)
    );
    clientsWithUploadsThisMonth = sentThisMonth.size;

    const docTypeIds = [...new Set(uploadsList.map((u) => u.document_type_id))];
    if (docTypeIds.length > 0) {
      const { data: docTypes } = await supabase
        .from("document_types")
        .select("id, name")
        .in("id", docTypeIds);
      const nameById = new Map(
        (docTypes ?? []).map((d) => [d.id, d.name])
      );
      const countById = new Map<string, number>();
      for (const u of uploadsList) {
        countById.set(
          u.document_type_id,
          (countById.get(u.document_type_id) ?? 0) + 1
        );
      }
      uploadsByDocType = Array.from(countById.entries())
        .map(([id, count]) => ({ name: nameById.get(id) ?? "Necunoscut", count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  }

  const clientsWithoutUploadsThisMonth = Math.max(
    0,
    totalClients - clientsWithUploadsThisMonth
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="dash-page-title">Statistici</h1>
        <p className="dash-page-sub">
          Prezentare generală: clienți, documente trimise și tipuri de acte.
        </p>
      </header>

      <StatisticiCharts
        totalClients={totalClients}
        clientsWithUploadsThisMonth={clientsWithUploadsThisMonth}
        clientsWithoutUploadsThisMonth={clientsWithoutUploadsThisMonth}
        uploadsByDocType={uploadsByDocType}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
