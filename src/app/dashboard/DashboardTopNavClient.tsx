"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PILLS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/documente", label: "Documente" },
  { href: "/dashboard/abonamente", label: "Abonamente" },
] as const;

const pillBase: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 100,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink-muted)",
  textDecoration: "none",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "var(--sage-xlight)",
  color: "var(--sage)",
  fontWeight: 600,
};

export function DashboardTopNavClient() {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {PILLS.map(({ href, label }) => (
        <Link key={href} href={href} style={pathname === href ? pillActive : pillBase}>
          {label}
        </Link>
      ))}
    </div>
  );
}
