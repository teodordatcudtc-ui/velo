"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/dashboard/clienti/clienti.module.css";
import { DemoProgrameazaModal } from "./DemoProgrameazaModal";
import { DemoShell } from "./DemoShell";
import demoStyles from "./demo-video.module.css";

export const DEMO_CLIENT = {
  id: "demo-client-1",
  name: "Demo Construct SRL",
  email: "contact@democonstruct.ro",
  phone: "0722 123 456",
  unique_token: "demo-token",
  document_types: [
    { id: "dt-1", name: "Facturi emise" },
    { id: "dt-2", name: "Extrase bancare" },
    { id: "dt-3", name: "Bonuri fiscale" },
  ],
};

type Props = {
  showAddModal: boolean;
  clientNameInput: string;
  clientEmailInput: string;
  clients: typeof DEMO_CLIENT[];
  programeazaOpen: boolean;
  progSendMode: "now" | "scheduled";
  progSendDate: string;
  progCalendarMonth: { year: number; month: number };
  onProgSendModeChange: (mode: "now" | "scheduled") => void;
  onProgSendDateChange: (iso: string) => void;
  onProgCalendarMonthChange: (year: number, month: number) => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DemoClientiScene({
  showAddModal,
  clientNameInput,
  clientEmailInput,
  clients,
  programeazaOpen,
  progSendMode,
  progSendDate,
  progCalendarMonth,
  onProgSendModeChange,
  onProgSendDateChange,
  onProgCalendarMonthChange,
}: Props) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddModal && nameInputRef.current) {
      nameInputRef.current.value = clientNameInput;
    }
  }, [showAddModal, clientNameInput]);

  return (
    <DemoShell>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", position: "relative" }}>
        <div className={styles.topbar} style={{ flexWrap: "wrap", height: "auto", minHeight: 58, padding: "10px 14px", gap: 8 }}>
          <div className={styles.topbarTitle} style={{ fontSize: 17 }}>
            Clienții <em>mei</em>
          </div>
          <div className={styles.topbarSpacer} />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            data-demo="add-client-btn"
            style={{ flexShrink: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Client nou
          </button>
        </div>

        <div className={styles.pageContent} style={{ padding: "12px 14px" }}>
          <div className={styles.tableCard}>
            <table>
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>👋</span>
                        <div className={styles.emptyTitle}>Niciun client încă</div>
                        <div className={styles.emptySub}>Adaugă primul client pentru a trimite cereri de documente.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className={styles.clientCell} data-demo="client-row">
                          <div className={styles.clientAvatar} style={{ background: "var(--sage-light)", color: "var(--sage)" }}>
                            {initials(client.name)}
                          </div>
                          <div>
                            <div className={styles.clientName}>{client.name}</div>
                            <div className={styles.clientCui}>{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeNone}`}>
                          <span className={styles.badgeDot} />
                          Neinițiat
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ height: 32, fontSize: 12, padding: "0 12px", whiteSpace: "nowrap" }}
                          data-demo="cerere-btn"
                        >
                          Cerere
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && (
          <div className={`${styles.modalOverlay} ${styles.open} ${demoStyles.demoModalOverlay}`}>
            <div className={styles.modal} data-demo="add-client-modal" onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.modalTitle}>Client nou</div>
                  <div className={styles.modalSub}>Adaugă datele clientului.</div>
                </div>
              </div>
              <div>
                <div className={styles.modalBody}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Nume firmă / client *</label>
                    <input
                      ref={nameInputRef}
                      className={styles.input}
                      data-demo="client-name-input"
                      type="text"
                      readOnly
                      value={clientNameInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.input} type="text" readOnly value={clientEmailInput} />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={`${styles.btn} ${styles.btnSecondary}`}>
                    Anulează
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} data-demo="add-client-submit">
                    Adaugă client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {programeazaOpen && clients[0] && (
          <DemoProgrameazaModal
            open={programeazaOpen}
            clientName={clients[0].name}
            sendMode={progSendMode}
            sendDate={progSendDate}
            calendarMonth={progCalendarMonth}
            onSendModeChange={onProgSendModeChange}
            onSendDateChange={onProgSendDateChange}
            onCalendarMonthChange={onProgCalendarMonthChange}
          />
        )}
      </div>
    </DemoShell>
  );
}
