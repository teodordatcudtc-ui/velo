"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "28px 36px 48px",
        minHeight: "calc(100vh - 60px)",
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <h1 style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
        Ceva nu a mers bine
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 24 }}>
        {error.message || "A apărut o eroare pe dashboard."}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: "var(--r-md)",
          background: "var(--sage)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Reîncearcă
      </button>
    </div>
  );
}
