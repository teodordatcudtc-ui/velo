"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON_STYLE: React.CSSProperties = { width: 20, height: 20, flexShrink: 0 };

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={ICON_STYLE}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  padding: "8px 12px 6px",
};

const LINK_BASE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  color: "var(--ink-soft)",
  textDecoration: "none",
};

const LINK_ACTIVE: React.CSSProperties = {
  ...LINK_BASE,
  background: "var(--sage-xlight)",
  color: "var(--sage)",
  fontWeight: 600,
};

type Props = { clientCount?: number };

export function SidebarNav({ clientCount = 0 }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* PRINCIPAL */}
      <div style={SECTION_LABEL}>PRINCIPAL</div>

      <Link href="/dashboard" style={isActive("/dashboard") ? LINK_ACTIVE : LINK_BASE}>
        {ICONS.dashboard}
        Dashboard
      </Link>

      <Link href="/dashboard/clienti" style={isActive("/dashboard/clienti") ? LINK_ACTIVE : LINK_BASE}>
        {ICONS.clients}
        Clienți
        {clientCount > 0 && (
          <span style={{
            marginLeft: "auto",
            background: "var(--sage-light)",
            color: "var(--sage)",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 100,
          }}>
            {clientCount}
          </span>
        )}
      </Link>

      <Link href="/dashboard/documente" style={isActive("/dashboard/documente") ? LINK_ACTIVE : LINK_BASE}>
        {ICONS.documents}
        Documente
      </Link>

      {/* SETĂRI */}
      <div style={{ ...SECTION_LABEL, paddingTop: 16, marginTop: 4 }}>SETĂRI</div>

      <Link href="/dashboard/setari" style={isActive("/dashboard/setari") ? LINK_ACTIVE : LINK_BASE}>
        {ICONS.settings}
        Setări
      </Link>
    </div>
  );
}
