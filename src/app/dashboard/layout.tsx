import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./DashboardLayout.module.css";
import { DashboardNavClient } from "./DashboardNavClient";

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

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  const name = accountant?.name ?? "Contabil";
  const email = user.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  const wrapStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    minHeight: "100vh",
    background: "var(--paper)",
  };
  const sidebarStyle: React.CSSProperties = {
    order: 1,
    width: 280,
    minWidth: 280,
    flexShrink: 0,
    flexGrow: 0,
    background: "#fff",
    borderRight: "1px solid var(--paper-3)",
    display: "flex",
    flexDirection: "column",
  };
  const mainStyle: React.CSSProperties = {
    order: 2,
    flex: "1 1 auto",
    minWidth: 0,
    overflowY: "auto",
    padding: "32px 40px 48px",
    background: "var(--paper)",
  };

  return (
    <div className={styles.wrap} style={wrapStyle} data-dashboard-root>
      {/* Sidebar 100% în layout – fără componentă client care să mute conținutul */}
      <aside
        className={styles.sidebar}
        style={sidebarStyle}
        data-dashboard-sidebar
      >
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13,2 13,9 20,9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <span className={styles.logoText}>Vel<em>o</em></span>
        </Link>

        <nav className={styles.nav} data-dashboard-nav aria-label="Meniu principal">
          <div className={styles.navLabel}>MENIU</div>
          <DashboardNavClient />
        </nav>

        <div className={styles.sidebarSpacer} />

        <div className={styles.userBlock}>
          <div className={styles.userAvatar}>{initial}</div>
          <div className={styles.userName}>{name}</div>
          {email ? <div className={styles.userEmail}>{email}</div> : null}
        </div>
        <div className={styles.sidebarFooter}>
          <form action={signOut}>
            <button type="submit" className={styles.logoutBtn}>
              Ieșire din cont
            </button>
          </form>
        </div>
      </aside>

      <main className={styles.main} style={mainStyle}>
        {children}
      </main>
    </div>
  );
}
