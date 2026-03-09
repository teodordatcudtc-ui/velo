"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard#clients-section", label: "Clienți", icon: "clients", countKey: "clientCount" as const },
  { href: "/dashboard/documente", label: "Documente", icon: "documents" },
  { href: "/dashboard/statistici", label: "Statistici", icon: "chart" },
];

const ICON_STYLE = { width: 20, height: 20, flexShrink: 0 as const };

const icons: Record<string, React.ReactNode> = {
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

const linkBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--ink-soft)",
  textDecoration: "none",
  width: "100%",
  boxSizing: "border-box",
};

const linkActive: React.CSSProperties = {
  ...linkBase,
  background: "var(--sage-xlight)",
  color: "var(--sage)",
  fontWeight: 600,
};

type Props = { clientCount?: number };

export function DashboardNavClient({ clientCount = 0 }: Props) {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {items.map(({ href, label, icon, countKey }) => {
        const isActive = href === "/dashboard#clients-section" ? pathname === "/dashboard" : pathname === href;
        return (
          <Link key={href} href={href} style={isActive ? linkActive : linkBase}>
            {icons[icon]}
            {label}
            {countKey === "clientCount" && clientCount > 0 && (
              <span style={{
                marginLeft: "auto",
                background: "var(--sage-light)",
                color: "var(--sage)",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 100,
              }}>{clientCount}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
