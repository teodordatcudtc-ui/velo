import type { ClientSpvStatus } from "@/lib/client-anaf-status";

export function SpvStatusBadge({ status }: { status: ClientSpvStatus | undefined }) {
  if (!status) return null;

  if (status.connected) {
    return (
      <span
        title={
          status.lastSyncedAt
            ? `SPV conectat · ultima sync ${new Date(status.lastSyncedAt).toLocaleString("ro-RO")}`
            : "SPV e-Factura conectat de client"
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 999,
          background: "var(--sage-xlight)",
          color: "var(--sage)",
          border: "1px solid var(--sage-light)",
          marginTop: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--sage)",
            flexShrink: 0,
          }}
          aria-hidden
        />
        SPV conectat
      </span>
    );
  }

  return (
    <span
      title="Clientul nu a conectat încă SPV de pe linkul unic"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 999,
        background: "var(--paper-2)",
        color: "var(--ink-muted)",
        border: "1px solid var(--paper-3)",
        marginTop: 4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--ink-muted)",
          flexShrink: 0,
        }}
        aria-hidden
      />
      SPV neconectat
    </span>
  );
}
