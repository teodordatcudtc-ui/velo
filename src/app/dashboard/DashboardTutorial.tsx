"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "velo_tutorial_seen_";
const PADDING = 8;

const STEPS = [
  {
    title: "Bine ai venit în Vello",
    text: "În câteva pași poți colecta documente de la clienți — fără cont pentru ei, fără bătăi de cap pentru tine.",
    target: null as string | null,
  },
  {
    title: "Adaugă un client",
    text: "Apasă aici pentru a adăuga primul client. Completează numele (și opțional emailul sau telefonul). Fiecare client primește un link unic.",
    target: "[data-tutorial=\"add-client\"]",
  },
  {
    title: "Cardurile clienților",
    text: "Aici vor apărea clienții. Pe fiecare card: adaugi tipuri de documente, copiezi linkul și îl trimiți clientului. Reminder-ul lunar (email) îl setezi tot pe card, cu bifa și ziua lunii.",
    target: "[data-tutorial=\"clients-section\"]",
  },
  {
    title: "Toate documentele",
    text: "În meniul «Documente» vezi toate fișierele încărcate, cu filtre și sortare. Setări e pentru profil și parolă.",
    target: "[data-tutorial=\"nav-documente\"]",
  },
  {
    title: "Gata!",
    text: "Acum poți adăuga clienți, trimite linkuri și colecta documente. Succes!",
    target: null,
  },
];

type Rect = { top: number; left: number; width: number; height: number } | null;

export function DashboardTutorial({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect>(null);

  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}default`;

  const measure = useCallback(() => {
    const selector = STEPS[step]?.target;
    if (!selector || typeof document === "undefined") {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    });
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {
      // localStorage indisponibil (ex. mod privat)
    }
    setOpen(true);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    measure();
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    const t = setTimeout(measure, 100);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      clearTimeout(t);
    };
  }, [open, step, measure]);

  function close() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    setOpen(false);
  }

  function next() {
    if (step >= STEPS.length - 1) close();
    else setStep((s) => s + 1);
  }

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const hasTarget = !!rect && !!current.target;

  /* Card flotant în colțul din dreapta-jos — non-blocking, nu acoperă conținutul */
  return (
    <>
      {/* Overlay semi-transparent DOAR când există un target evidențiat */}
      {hasTarget && rect && (
        <div className="fixed inset-0 z-[9990] pointer-events-none" aria-hidden>
          {/* top */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: Math.max(0, rect.top),
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* bottom */}
          <div
            style={{
              position: "absolute",
              top: rect.top + rect.height, left: 0, right: 0, bottom: 0,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* left */}
          <div
            style={{
              position: "absolute",
              top: rect.top, left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* right */}
          <div
            style={{
              position: "absolute",
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(4px)",
            }}
          />
          {/* Highlight ring */}
          <div
            style={{
              position: "absolute",
              top: rect.top, left: rect.left,
              width: rect.width, height: rect.height,
              borderRadius: "var(--r-md)",
              outline: "2px solid var(--sage)",
              outlineOffset: 3,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Card tutorial — fix în colțul dreapta-jos, pointer-events proprii */}
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9995,
          width: "100%",
          maxWidth: 360,
          background: "var(--paper)",
          border: "1px solid var(--paper-3)",
          borderRadius: "var(--r-xl)",
          boxShadow: "0 8px 48px rgba(26,26,46,0.18), 0 2px 8px rgba(26,26,46,0.1)",
          padding: 24,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sage)" }}>
            Ghid rapid
          </span>
          <button
            type="button"
            onClick={close}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 4, borderRadius: 6, lineHeight: 1 }}
            aria-label="Închide"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 id="tutorial-title" style={{ fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
          {current.title}
        </h2>
        <p id="tutorial-desc" style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 20 }}>
          {current.text}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  height: 6,
                  borderRadius: 100,
                  width: i === step ? 20 : 6,
                  background: i === step ? "var(--sage)" : i < step ? "rgba(75,122,110,0.4)" : "var(--paper-3)",
                  transition: "all 0.2s",
                }}
                aria-hidden
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={close} style={{ fontSize: 13, color: "var(--ink-muted)", background: "none", border: "none", cursor: "pointer" }}>
              Sari peste
            </button>
            <button
              type="button"
              onClick={isLast ? close : next}
              style={{
                fontSize: 13, fontWeight: 500,
                background: "var(--sage)", color: "#fff",
                border: "none", borderRadius: "var(--r-md)",
                padding: "8px 16px", cursor: "pointer",
              }}
            >
              {isLast ? "Am înțeles" : "Continuă"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
