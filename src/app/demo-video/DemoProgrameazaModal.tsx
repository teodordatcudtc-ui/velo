"use client";

const WEEK_DAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"];
const MONTHS_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

const DOC_TYPES = ["Facturi emise", "Extrase bancare", "Bonuri fiscale"];

type Props = {
  open: boolean;
  clientName: string;
  sendMode: "now" | "scheduled";
  sendDate: string;
  calendarMonth: { year: number; month: number };
  onSendModeChange: (mode: "now" | "scheduled") => void;
  onSendDateChange: (iso: string) => void;
  onCalendarMonthChange: (year: number, month: number) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DemoProgrameazaModal({
  open,
  clientName,
  sendMode,
  sendDate,
  calendarMonth,
  onSendModeChange,
  onSendDateChange,
  onCalendarMonthChange,
}: Props) {
  if (!open) return null;

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthStart = new Date(calendarMonth.year, calendarMonth.month, 1);
  const monthEnd = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells: Array<number | null> = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  return (
    <div
      data-demo="prog-modal"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 12px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26, 26, 46, 0.45)",
        }}
        aria-hidden
      />
      <div
        style={{
          position: "relative",
          width: "calc(100% - 16px)",
          maxHeight: "88%",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-xl)",
          border: "1px solid var(--paper-3)",
          padding: "18px 16px 20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
          Cerere nouă
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 16 }}>
          Pentru <strong style={{ color: "var(--ink)" }}>{clientName}</strong>
        </p>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: 8 }}>
          DOCUMENTE SOLICITATE
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {DOC_TYPES.map((name) => (
            <span
              key={name}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 100,
                background: "var(--sage-xlight)",
                color: "var(--sage)",
                border: "1px solid var(--sage-light)",
              }}
            >
              {name}
            </span>
          ))}
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: 8 }}>
          CÂND TRIMIȚI CEREREA
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            data-demo="prog-send-now"
            onClick={() => onSendModeChange("now")}
            style={{
              padding: "10px 8px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: "var(--r-md)",
              border: "1.5px solid",
              borderColor: sendMode === "now" ? "var(--sage)" : "var(--paper-3)",
              background: sendMode === "now" ? "var(--sage-xlight)" : "#fff",
              color: sendMode === "now" ? "var(--sage)" : "var(--ink-soft)",
            }}
          >
            Trimite acum
          </button>
          <button
            type="button"
            data-demo="prog-scheduled"
            onClick={() => onSendModeChange("scheduled")}
            style={{
              padding: "10px 8px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: "var(--r-md)",
              border: "1.5px solid",
              borderColor: sendMode === "scheduled" ? "var(--sage)" : "var(--paper-3)",
              background: sendMode === "scheduled" ? "var(--sage-xlight)" : "#fff",
              color: sendMode === "scheduled" ? "var(--sage)" : "var(--ink-soft)",
            }}
          >
            La data selectată
          </button>
        </div>

        {sendMode === "scheduled" && (
          <div
            style={{
              border: "1.5px solid var(--paper-3)",
              borderRadius: "var(--r-md)",
              background: "#fff",
              padding: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button
                type="button"
                data-demo="prog-cal-prev"
                onClick={() => {
                  const d = new Date(calendarMonth.year, calendarMonth.month - 1, 1);
                  onCalendarMonthChange(d.getFullYear(), d.getMonth());
                }}
                style={{ border: "none", background: "var(--paper)", width: 28, height: 28, borderRadius: 6 }}
              >
                ‹
              </button>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                {MONTHS_RO[calendarMonth.month]} {calendarMonth.year}
              </div>
              <button
                type="button"
                data-demo="prog-cal-next"
                onClick={() => {
                  const d = new Date(calendarMonth.year, calendarMonth.month + 1, 1);
                  onCalendarMonthChange(d.getFullYear(), d.getMonth());
                }}
                style={{ border: "none", background: "var(--paper)", width: 28, height: 28, borderRadius: 6 }}
              >
                ›
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {WEEK_DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--ink-muted)", fontWeight: 700 }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {cells.map((day, i) => {
                if (day == null) return <div key={`e-${i}`} style={{ height: 32 }} />;
                const iso = `${calendarMonth.year}-${pad(calendarMonth.month + 1)}-${pad(day)}`;
                const disabled = iso < todayIso;
                const selected = sendDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-demo={day === 25 ? "prog-day-25" : undefined}
                    disabled={disabled}
                    onClick={() => onSendDateChange(iso)}
                    style={{
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: selected ? "var(--sage)" : "var(--paper-3)",
                      background: selected ? "var(--sage-xlight)" : "#fff",
                      color: disabled ? "var(--ink-muted)" : selected ? "var(--sage)" : "var(--ink)",
                      fontSize: 12,
                      fontWeight: selected ? 700 : 500,
                      opacity: disabled ? 0.45 : 1,
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {sendDate && (
              <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
                Data selectată:{" "}
                {new Date(
                  Number(sendDate.slice(0, 4)),
                  Number(sendDate.slice(5, 7)) - 1,
                  Number(sendDate.slice(8, 10))
                ).toLocaleDateString("ro-RO")}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          data-demo="prog-send-email"
          style={{
            width: "100%",
            padding: "13px 14px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--sage)",
            color: "#fff",
          }}
        >
          Trimite pe email
        </button>
      </div>
    </div>
  );
}
