"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./DashboardLayout.module.css";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/statistici", label: "Statistici", icon: "chart" },
  { href: "/dashboard/setari", label: "Setări", icon: "settings" },
];

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

type Props = {
  name: string;
  email: string;
  signOut: () => Promise<void>;
  sidebarStyle: React.CSSProperties;
};

export function DashboardSidebar({ name, email, signOut, sidebarStyle }: Props) {
  const pathname = usePathname();
  const initial = name.charAt(0).toUpperCase();

  return (
    <aside
      className={styles.sidebar}
      style={sidebarStyle}
      data-dashboard-sidebar
    >
      <Link href="/dashboard" className={styles.logo}>
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

      {/* Mai sus: cele 3 butoane (Dashboard, Statistici, Setări) */}
      <nav className={styles.nav} data-dashboard-nav>
        <div className={styles.navLabel}>MENIU</div>
        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
          >
            {icons[icon]}
            {label}
          </Link>
        ))}
      </nav>

      {/* Mai jos: blocul de cont + ieșire */}
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
  );
}
