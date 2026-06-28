import type { Metadata } from "next";
import "@/app/dashboard/DashboardShell.module.css";
import "@/app/dashboard/clienti/clienti.module.css";
import "./demo-video.module.css";

export const metadata: Metadata = {
  title: "Demo Video — Vello",
  robots: { index: false, follow: false },
};

export default function DemoVideoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#12121f",
        fontFamily: "var(--font-body, 'DM Sans', system-ui, sans-serif)",
      }}
    >
      {children}
    </div>
  );
}