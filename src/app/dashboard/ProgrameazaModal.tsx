"use client";

import { useState, useEffect } from "react";

type DocType = { id: string; name: string };
type Client = {
  id: string;
  name: string;
  email?: string | null;
  unique_token?: string | null;
  document_types: DocType[] | null;
};

const WEEK_DAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const PREDEFINED_DOC_TYPES = [
  "Facturi emise",
  "Extrase bancare",
  "Bonuri fiscale",
  "Contracte",
  "Declarații",
];

type Props = {
  open: boolean;
  onClose: () => void;
  client: Client;
  existingScheduledAt?: string | null;
  tutorialTargetId?: string;
  onSend?: (data: {
    sendMode: "now" | "scheduled";
    sendDate: string;
    delivery: "manual" | "email";
    docTypes: string[];
    message: string;
    reminderAfter3Days: boolean;
  }) => void | boolean | Promise<void | boolean>;
};

export function ProgrameazaModal({
  open,
  onClose,
  client,
  existingScheduledAt = null,
  tutorialTargetId,
  onSend,
}: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const clientDocNames = (client.document_types ?? []).map((t) => t.name);
  const [customDocTypes, setCustomDocTypes] = useState<string[]>([]);
  const allDocOptions = [...new Set([...PREDEFINED_DOC_TYPES, ...clientDocNames, ...customDocTypes])];

  const [selectedDocTypes, setSelectedDocTypes] = useState<Set<string>>(
    () => new Set(clientDocNames.length > 0 ? clientDocNames : PREDEFINED_DOC_TYPES.slice(0, 2))
  );
  const [sendMode, setSendMode] = useState<"now" | "scheduled">("now");
  const [sendDate, setSendDate] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [message, setMessage] = useState("");
  const [reminderAfter3Days, setReminderAfter3Days] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setSendMode("now");
      setSendDate(d.toISOString().slice(0, 10));
      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      setSelectedDocTypes(
        new Set(clientDocNames.length > 0 ? clientDocNames : PREDEFINED_DOC_TYPES.slice(0, 2))
      );
      setCustomDocTypes([]);
      setShowCustomInput(false);
      setCustomInputValue("");
    }
  }, [open, client.id]);

  const toggleDoc = (name: string) => {
    setSelectedDocTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustomDocType = () => {
    const name = customInputValue.trim();
    if (!name) return;
    if (allDocOptions.some((o) => o.toLowerCase() === name.toLowerCase())) {
      setCustomInputValue("");
      return;
    }
    setCustomDocTypes((prev) => [...prev, name]);
    setSelectedDocTypes((prev) => new Set([...prev, name]));
    setCustomInputValue("");
    setShowCustomInput(false);
  };

  const handleSend = async (delivery: "manual" | "email") => {
    const effectiveDate = sendMode === "now" ? todayIso : sendDate;
    if (!effectiveDate) return;
    setSending(true);
    try {
      const result = await onSend?.({
        sendMode,
        sendDate: effectiveDate,
        delivery,
        docTypes: Array.from(selectedDocTypes),
        message,
        reminderAfter3Days,
      });
      if (result !== false) onClose();
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const monthYearLabel = `${MONTHS_RO[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells: Array<number | null> = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="programeaza-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26, 26, 46, 0.4)",
          backdropFilter: "blur(2px)",
        }}
        aria-hidden
        onClick={onClose}
      />
      <div
        data-tutorial={tutorialTargetId}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--paper-3)",
          padding: "24px 28px 28px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="programeaza-title" style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>
            Cerere nouă
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: 8,
              color: "var(--ink-muted)",
              fontSize: 18,
              lineHeight: 1,
            }}
            aria-label="Închide"
          >
            ×
          </button>
        </div>

        {existingScheduledAt && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: "var(--r-md)",
              border: "1px solid rgba(17, 143, 105, 0.28)",
              borderLeft: "4px solid var(--sage)",
              background: "var(--sage-xlight)",
              fontSize: 13,
              color: "var(--ink)",
            }}
          >
            <span style={{ fontWeight: 700 }}>Cerere deja programată:</span>{" "}
            <strong style={{ color: "var(--sage)" }}>
              {new Date(existingScheduledAt).toLocaleDateString("ro-RO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </strong>
            <span style={{ color: "var(--ink-soft)" }}>
              {" "}
              (dacă trimiți din nou, programarea se actualizează).
            </span>
          </div>
        )}

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sage)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>1</span>
          <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--paper-3)" }} />
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sage)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</span>
          <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--paper-3)" }} />
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--paper-2)", color: "var(--ink-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>3</span>
          <span style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 8 }}>Pasul 2 din 3 — Alege documentele</span>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* TIP DOCUMENTE */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: 10 }}>
              TIP DOCUMENTE SOLICITATE
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allDocOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDoc(name)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 500,
                    border: "1.5px solid",
                    cursor: "pointer",
                    background: selectedDocTypes.has(name) ? "var(--sage-xlight)" : "#fff",
                    color: selectedDocTypes.has(name) ? "var(--sage)" : "var(--ink-soft)",
                    borderColor: selectedDocTypes.has(name) ? "var(--sage)" : "var(--paper-3)",
                  }}
                >
                  {name}
                </button>
              ))}
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 100,
                    fontSize: 13,
                    fontWeight: 500,
                    border: "1.5px solid var(--paper-3)",
                    cursor: "pointer",
                    background: "#fff",
                    color: "var(--ink-muted)",
                  }}
                >
                  + Altele
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="text"
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomDocType();
                      }
                      if (e.key === "Escape") {
                        setShowCustomInput(false);
                        setCustomInputValue("");
                      }
                    }}
                    placeholder="Scrie categoria..."
                    style={{
                      width: 160,
                      padding: "8px 12px",
                      borderRadius: 100,
                      fontSize: 13,
                      border: "1.5px solid var(--sage)",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomDocType}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 500,
                      border: "1.5px solid var(--sage)",
                      cursor: "pointer",
                      background: "var(--sage-xlight)",
                      color: "var(--sage)",
                    }}
                  >
                    Adaugă
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomInputValue(""); }}
                    style={{ padding: "4px", color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                    aria-label="Anulează"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Când se trimite */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: 8 }}>
              CÂND TRIMIȚI CEREREA
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setSendMode("now")}
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "var(--r-md)",
                  border: "1.5px solid",
                  borderColor: sendMode === "now" ? "var(--sage)" : "var(--paper-3)",
                  background: sendMode === "now" ? "var(--sage-xlight)" : "#fff",
                  color: sendMode === "now" ? "var(--sage)" : "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                Trimite acum
              </button>
              <button
                type="button"
                onClick={() => setSendMode("scheduled")}
                style={{
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "var(--r-md)",
                  border: "1.5px solid",
                  borderColor: sendMode === "scheduled" ? "var(--sage)" : "var(--paper-3)",
                  background: sendMode === "scheduled" ? "var(--sage-xlight)" : "#fff",
                  color: sendMode === "scheduled" ? "var(--sage)" : "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                Trimite la data selectată
              </button>
            </div>

            {sendMode === "now" ? (
              <div
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  fontSize: 13,
                  border: "1.5px solid var(--paper-3)",
                  borderRadius: "var(--r-md)",
                  color: "var(--ink-muted)",
                  background: "var(--paper)",
                }}
              >
                Cererea se trimite imediat după confirmare.
              </div>
            ) : (
              <div
                style={{
                  border: "1.5px solid var(--paper-3)",
                  borderRadius: "var(--r-md)",
                  background: "#fff",
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                      )
                    }
                    style={{
                      border: "none",
                      background: "var(--paper)",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ‹
                  </button>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{monthYearLabel}</div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                      )
                    }
                    style={{
                      border: "none",
                      background: "var(--paper)",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ›
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                  {WEEK_DAYS.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--ink-muted)", fontWeight: 700, padding: "4px 0" }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {cells.map((day, i) => {
                    if (day == null) {
                      return <div key={`empty-${i}`} style={{ height: 34 }} />;
                    }
                    const cellDate = new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day
                    );
                    const iso = cellDate.toISOString().slice(0, 10);
                    const disabled = iso < todayIso;
                    const selected = sendDate === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSendDate(iso)}
                        style={{
                          height: 34,
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: selected ? "var(--sage)" : "var(--paper-3)",
                          background: selected ? "var(--sage-xlight)" : "#fff",
                          color: disabled ? "var(--ink-muted)" : selected ? "var(--sage)" : "var(--ink)",
                          fontSize: 12,
                          fontWeight: selected ? 700 : 500,
                          opacity: disabled ? 0.45 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sendMode === "scheduled" && !sendDate && (
              <div style={{ fontSize: 12, color: "var(--terra)", marginTop: 8 }}>
                Selectează o zi pentru trimitere.
              </div>
            )}
            {sendMode === "scheduled" && sendDate && (
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
                Data selectată: {new Date(sendDate).toLocaleDateString("ro-RO")}
              </div>
            )}
          </div>

          {/* Mesaj personalizat */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: 8 }}>
              Mesaj personalizat (opțional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bună ziua! Vă rugăm să trimiteți documentele..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                border: "1.5px solid var(--paper-3)",
                borderRadius: "var(--r-md)",
                color: "var(--ink)",
                background: "#fff",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Reminder automat */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "12px 14px", background: "var(--paper)", borderRadius: "var(--r-md)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Reminder automat după 3 zile</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                Dacă nu răspunde, trimitem un mesaj automat pe Email. <span style={{ color: "var(--sage)", fontWeight: 600 }}>Recomandat</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reminderAfter3Days}
              onClick={() => setReminderAfter3Days((v) => !v)}
              style={{
                width: 48,
                height: 26,
                borderRadius: 100,
                border: "none",
                background: reminderAfter3Days ? "var(--sage)" : "var(--paper-3)",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: reminderAfter3Days ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              type="button"
              disabled={sending || (sendMode === "scheduled" && !sendDate)}
              onClick={() => handleSend("manual")}
              style={{
                width: "100%",
                padding: "13px 14px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--paper-3)",
                background: "#fff",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              {sending ? "Se procesează…" : "Copiază linkul și trimit manual"}
            </button>
            <button
              type="button"
              disabled={sending || (sendMode === "scheduled" && !sendDate)}
              onClick={() => handleSend("email")}
              style={{
                width: "100%",
                padding: "13px 14px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: "var(--r-md)",
                border: "none",
                background: "var(--sage)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {sending ? "Se trimite…" : "Trimite pe email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
