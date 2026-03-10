"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNav } from "./SidebarNav";
import styles from "./DashboardShell.module.css";

const FIRST_VISIT_KEY = "velo_dashboard_first_visit_";

type Props = {
  userId: string;
  name: string;
  email: string;
  initial: string;
  clientCount: number;
  signOut: () => Promise<void>;
  children: React.ReactNode;
};

export function DashboardLayoutClient({
  userId,
  name,
  email,
  initial,
  clientCount,
  signOut,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || !pathname?.startsWith("/dashboard")) return;
    if (pathname === "/dashboard/clienti") return;
    try {
      const key = `${FIRST_VISIT_KEY}${userId}`;
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
      router.replace("/dashboard/clienti");
    } catch {
      // ignore localStorage errors
    }
  }, [pathname, userId, router]);

  return (
    <div className={`${styles.root} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            aria-label="Deschide meniul"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13,2 13,9 20,9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>
            <span className={styles.logoText}>
              Vel<em>lo</em>
            </span>
          </Link>
        </div>

        <div className={styles.avatarHeader}>{initial}</div>
      </header>

      <div
        className={styles.backdrop}
        aria-hidden
        onClick={() => setSidebarOpen(false)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setSidebarOpen(false);
        }}
      />

      <div className={styles.bodyWrap}>
        <aside className={styles.sidebar}>
          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Închide meniul"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className={styles.sidebarInner}>
            <SidebarNav clientCount={clientCount} />
          </div>
          <div className={styles.sidebarFooter}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {initial}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{name}</div>
            {email && <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{email}</div>}
            <form action={signOut} style={{ marginTop: 12 }}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--ink-muted)",
                  background: "transparent",
                  border: "1px solid var(--paper-3)",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                }}
              >
                Ieșire din cont
              </button>
            </form>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
