"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./DashboardLayout.module.css";
import { ProgrameazaModal } from "./ProgrameazaModal";
import { useToast } from "@/app/components/ToastProvider";
import { saveDocumentRequest, sendDocumentRequestNow } from "@/app/actions/clients";

type DocType = { id: string; name: string };
type Client = {
  id: string;
  name: string;
  email?: string | null;
  unique_token: string;
  document_types: DocType[] | null;
};
type Upload = {
  client_id: string;
  document_type_id: string;
  month: number;
  year: number;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function avatarClass(index: number): string {
  const classes = [styles.avSage, styles.avTerra, styles.avAmber, styles.avInk];
  return classes[index % classes.length];
}

export function DashboardClientsTable({
  clients,
  uploads,
  nextRequestByClient = {},
  currentMonth,
  currentYear,
  baseUrl,
}: {
  clients: Client[];
  uploads: Upload[];
  nextRequestByClient?: Record<string, string>;
  currentMonth: number;
  currentYear: number;
  baseUrl: string;
}) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [programeazaClient, setProgrameazaClient] = useState<Client | null>(null);
  const toast = useToast();

  const uploadsThisMonth = uploads.filter(
    (u) => u.month === currentMonth && u.year === currentYear
  );
  const sentAnyRequestByClient = new Set(Object.keys(nextRequestByClient ?? {}));

  const uploadedByClientAndType = new Map<string, Set<string>>();
  for (const u of uploadsThisMonth) {
    const key = u.client_id;
    if (!uploadedByClientAndType.has(key))
      uploadedByClientAndType.set(key, new Set());
    uploadedByClientAndType.get(key)!.add(u.document_type_id);
  }

  const copyLink = (client: Client) => {
    const origin = typeof window !== "undefined" ? window.location.origin : baseUrl || "";
    const url = `${origin || baseUrl}/upload/${client.unique_token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (clients.length === 0) return null;

  return (
    <div className={styles.tableWrap} style={{ marginTop: 12 }}>
      <div className={styles.tableHeader}>
        <span className={styles.tableHeaderTitle}>Clienți și documente</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>CLIENT</th>
            <th>DOCUMENTE</th>
            <th>STATUS</th>
            <th>ACȚIUNI</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, idx) => {
            const types = client.document_types ?? [];
            const uploadedTypes = uploadedByClientAndType.get(client.id);
            const count = uploadedTypes?.size ?? 0;
            const total = types.length;
            const status =
              total === 0
                ? "—"
                : count === total
                  ? "Primit"
                  : count === 0
                    ? "Netrimis"
                    : "Parțial";
            const badgeClass =
              status === "Primit"
                ? styles.badgeSuccess
                : status === "Netrimis"
                  ? styles.badgeDanger
                  : status === "Parțial"
                    ? styles.badgeWarning
                    : "";
            return (
              <tr key={client.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      className={`${styles.avatarSm} ${avatarClass(idx)}`}
                    >
                      {initials(client.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{client.name}</div>
                      <div
                        className="td-secondary"
                        style={{
                          fontSize: 12,
                          color: "var(--ink-muted)",
                        }}
                      >
                        {sentAnyRequestByClient.has(client.id)
                          ? "Link unic trimis clientului"
                          : "Link unic disponibil (ne-trimis)"}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {total === 0
                    ? "—"
                    : `${count} din ${total} tipuri`}
                </td>
                <td>
                  {status !== "—" ? (
                    <span className={`${styles.badge} ${badgeClass}`}>
                      <span className={styles.badgeDot} />
                      {status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => copyLink(client)}
                      title="Copiază link upload"
                      className="btn-secondary"
                      style={{
                        padding: "6px 10px",
                        minWidth: 36,
                        height: 32,
                        fontSize: 12,
                        borderRadius: "var(--r-sm)",
                        border: "1.5px solid var(--paper-3)",
                        background: "var(--paper-2)",
                        cursor: "pointer",
                        color: "var(--ink-soft)",
                      }}
                    >
                      {copiedId === client.id ? "Copiat!" : "Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgrameazaClient(client)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 12px",
                        height: 32,
                        fontSize: 12,
                        borderRadius: "var(--r-sm)",
                        background: "var(--sage)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Programează
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {programeazaClient && (
        <ProgrameazaModal
          open={!!programeazaClient}
          onClose={() => setProgrameazaClient(null)}
          client={programeazaClient}
          existingScheduledAt={nextRequestByClient[programeazaClient.id] ?? null}
          onSend={async (data) => {
            if (data.delivery === "email" && !programeazaClient.email?.trim()) {
              toast.error("Clientul nu are email setat. Adaugă email înainte de trimitere.");
              return false;
            }

            const result =
              data.sendMode === "now"
                ? await sendDocumentRequestNow(programeazaClient.id, {
                    delivery: data.delivery,
                    docTypes: data.docTypes,
                    message: data.message,
                    reminderAfter3Days: data.reminderAfter3Days,
                  })
                : await saveDocumentRequest(programeazaClient.id, {
                    ...data,
                    methods: [data.delivery],
                  });
            if (result?.error) {
              toast.error(result.error);
              return false;
            }

            if (data.delivery === "manual") {
              const origin = typeof window !== "undefined" ? window.location.origin : baseUrl || "";
              const url = `${origin || baseUrl}/upload/${programeazaClient.unique_token}`;
              try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copiat. Îl poți trimite manual clientului.");
              } catch {
                toast.success("Cerere salvată. Copiază manual linkul clientului.");
              }
            } else {
              toast.success(
                `Cerere trimisă pe email pentru ${programeazaClient.name} — ${new Date(data.sendDate).toLocaleDateString("ro-RO")}`
              );
            }
            setProgrameazaClient(null);
            router.refresh();
            return true;
          }}
        />
      )}
    </div>
  );
}
