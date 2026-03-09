export default function DashboardLoading() {
  return (
    <div style={{ padding: "28px 36px 48px" }}>
      <div style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
        Se încarcă...
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>
        Pregătim dashboard-ul.
      </p>
    </div>
  );
}
