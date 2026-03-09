import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SidebarNav } from "./SidebarNav";

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
    .select("name")
    .eq("id", user.id)
    .single();

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

  const name = accountant?.name ?? "Contabil";
  const email = user.email ?? "";
  const initial = (name.split(/\s+/).map((s: string) => s[0]).join("").slice(0, 2) || name[0] || "?").toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "var(--paper)", overflow: "hidden" }}>

      {/* TOP NAV – fix sus */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        width: "100%", height: 60, flexShrink: 0,
        background: "#fff", borderBottom: "1px solid var(--paper-3)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", gap: 16,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, background: "var(--ink)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13,2 13,9 20,9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <span style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Vel<em style={{ fontStyle: "italic", color: "var(--sage)" }}>o</em>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--sage-light)", color: "var(--sage)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {initial}
          </div>
        </div>
      </header>

      {/* BODY – doar main scrollă; sidebar fix în viewport */}
      <div style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* SIDEBAR – fix pe ecran, nu se mișcă la scroll */}
        <aside style={{
          position: "fixed",
          left: 0,
          top: 60,
          width: 240,
          height: "calc(100vh - 60px)",
          zIndex: 50,
          background: "#fff",
          borderRight: "1px solid var(--paper-3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <SidebarNav clientCount={clientCount ?? 0} />
          </div>

          <div style={{ padding: "20px", borderTop: "1px solid var(--paper-3)", flexShrink: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "var(--ink)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 700, marginBottom: 10,
            }}>
              {initial}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{name}</div>
            {email && <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{email}</div>}
            <form action={signOut} style={{ marginTop: 12 }}>
              <button type="submit" style={{
                width: "100%", padding: "8px 12px", fontSize: 13,
                color: "var(--ink-muted)", background: "transparent",
                border: "1px solid var(--paper-3)", borderRadius: "var(--r-md)", cursor: "pointer",
              }}>
                Ieșire din cont
              </button>
            </form>
          </div>
        </aside>

        {/* MAIN – scroll doar aici; margin-left ca să nu acopere sidebar-ul fix */}
        <main style={{
          flex: 1,
          minWidth: 0,
          marginLeft: 240,
          padding: "28px 36px 48px",
          background: "var(--paper)",
          overflowY: "auto",
          height: "calc(100vh - 60px)",
        }}>
          {children}
        </main>

      </div>
    </div>
  );
}
