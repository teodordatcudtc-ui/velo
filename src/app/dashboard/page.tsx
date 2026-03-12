import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardClientsTable } from "./DashboardClientsTable";
import styles from "./DashboardLayout.module.css";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Bună dimineața, ${name}`;
  if (h < 18) return `Bună ziua, ${name}`;
  return `Bună seara, ${name}`;
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const searchParams = await props.searchParams;
  const checkoutSuccess = searchParams.checkout === "success";

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
  const userName = (accountant as { name?: string } | null)?.name ?? "Contabil";

  const { data: clients } = await supabase
    .from("clients")
    .select(`id, name, email, phone, unique_token, created_at, reminder_enabled, reminder_day_of_month, document_types ( id, name )`)
    .eq("accountant_id", user.id)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const clientIds = (clients ?? []).map((c) => c.id);
  const { data: uploads } =
    clientIds.length > 0
      ? await supabase
          .from("uploads")
          .select("id, client_id, document_type_id, file_name, month, year, created_at")
          .in("client_id", clientIds)
      : { data: [] };

  const nowIso = new Date().toISOString();

  // Cereri viitoare – pentru data programată afișată în modal
  const { data: upcomingRequests } =
    clientIds.length > 0
      ? await supabase
          .from("document_requests")
          .select("client_id, sent_at")
          .in("client_id", clientIds)
          .gte("sent_at", nowIso)
          .order("sent_at", { ascending: true })
      : { data: [] };

  // Orice cerere trimisă vreodată (inclusiv manual) – pentru statusul "trimis/ne-trimis"
  const { data: anySentRequests } =
    clientIds.length > 0
      ? await supabase
          .from("document_requests")
          .select("client_id")
          .in("client_id", clientIds)
      : { data: [] };

  const nextRequestByClient: Record<string, string> = {};
  for (const req of upcomingRequests ?? []) {
    if (!nextRequestByClient[req.client_id]) {
      nextRequestByClient[req.client_id] = req.sent_at;
    }
  }

  // Set cu toți clienții cărora li s-a trimis/copiat linkul vreodată
  const everSentClientIds = new Set((anySentRequests ?? []).map((r) => r.client_id));

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const uploadsThisMonth = (uploads ?? []).filter(
    (u) => u.month === currentMonth && u.year === currentYear
  );
  const totalRequested = (clients ?? []).reduce(
    (sum, c) => sum + ((c as { document_types?: { id: string }[] }).document_types?.length ?? 0),
    0
  );
  const clientsWithDocsNoUpload = (clients ?? []).filter((c) => {
    const types = (c as { document_types?: { id: string }[] }).document_types ?? [];
    if (types.length === 0) return false;
    return !uploadsThisMonth.some((u) => u.client_id === c.id);
  });
  const dateStr = `${now.toLocaleDateString("ro-RO", { weekday: "long" })}, ${now.getDate()} ${MONTH_NAMES[currentMonth - 1]} ${now.getFullYear()}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {checkoutSuccess && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--r-md)",
            background: "var(--sage-xlight)",
            color: "var(--sage)",
            fontSize: 14,
            fontWeight: 500,
            border: "1px solid var(--sage-light)",
          }}
        >
          Plată reușită. Planul tău a fost activat.
        </div>
      )}

      {/* PAGE HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 8 }}>
            {greeting(userName)}
            <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "999px", background: "var(--sage-light)", color: "var(--sage)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 0-7 7v3.5A3.5 3.5 0 0 0 8.5 16H9l-1 3 4-3h1a7 7 0 0 0 7-7 7 7 0 0 0-7-7z" />
              </svg>
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 6 }}>
            Ai {(clients ?? []).length} clienți și {uploadsThisMonth.length} documente trimise luna aceasta — {dateStr}
          </p>
        </div>
      </div>

      {/* STAT CARDS — PC: 3 coloane mari; mobil: 2×2 compact (CSS) */}
      <div className={styles.dashboardStatsGrid}>
        {[
          { label: "CLIENȚI ACTIVI", value: (clients ?? []).length, sub: "↑ total în cont", color: "var(--ink)" },
          { label: "DOCUMENTE PRIMITE", value: uploadsThisMonth.length, sub: totalRequested > 0 ? `din ${totalRequested} cerute` : "luna aceasta", color: "var(--sage)" },
          { label: "FĂRĂ DOCUMENTE ÎNCĂ", value: clientsWithDocsNoUpload.length, sub: "clienți cu cereri, netrimis", color: "var(--amber)" },
        ].map((card) => (
          <div key={card.label} className={styles.dashboardStatCard}>
            <div className={styles.dashboardStatLabel}>{card.label}</div>
            <div className={styles.dashboardStatValue} style={{ color: card.color }}>{card.value}</div>
            <div className={styles.dashboardStatSub}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ALERT */}
      {clientsWithDocsNoUpload.length > 0 && (
        <div style={{
          padding: "14px 16px", borderRadius: "var(--r-md)",
          display: "flex", alignItems: "flex-start", gap: 12,
          fontSize: 13, lineHeight: 1.5,
          borderLeft: "3px solid var(--amber)",
          background: "var(--amber-light)", color: "#7a5010",
        }}>
          <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <div>
            <strong>
              {(clientsWithDocsNoUpload as { name: string }[]).map((c) => c.name).join(", ")}
            </strong>{" "}
            nu {clientsWithDocsNoUpload.length === 1 ? "a trimis" : "au trimis"} documente pentru {MONTH_NAMES[currentMonth - 1]}.{" "}
            <Link href="/dashboard/clienti" style={{ color: "var(--sage)", fontWeight: 600, textDecoration: "none" }}>
              Vezi clienți →
            </Link>
          </div>
        </div>
      )}

      {/* CLIENTS TABLE */}
      <DashboardClientsTable
        clients={clients ?? []}
        uploads={uploads ?? []}
        nextRequestByClient={nextRequestByClient}
        everSentClientIds={everSentClientIds}
        currentMonth={currentMonth}
        currentYear={currentYear}
        baseUrl={baseUrl}
      />

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          href="/dashboard/clienti"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: "var(--r-md)",
            background: "var(--sage)",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Vezi toți clienții →
        </Link>
      </div>

    </div>
  );
}
