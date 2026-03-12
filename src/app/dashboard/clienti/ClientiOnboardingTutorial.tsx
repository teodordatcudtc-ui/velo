"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY_PREFIX = "velo_onboarding_clienti_v1_";
const PADDING = 8;

type Rect = { top: number; left: number; width: number; height: number } | null;

type Props = {
  userId?: string;
  hasAnyClients: boolean;
  modalOpen: boolean;
  drawerOpen: boolean;
  requestModalOpen: boolean;
  onOpenAddClient: () => void;
  onOpenFirstClient: () => void;
  onOpenFirstRequest: () => void;
  startSignal?: number;
  continueSignal?: number;
};

const STEPS = [
  {
    title: "Adaugă primul client",
    text: "Hai să facem primul client împreună. Tutorialul te ghidează live, pas cu pas.",
    target: null as string | null,
  },
  {
    title: "Pasul 1: deschide formularul",
    text: "Apasă pe butonul „Client nou” din dreapta sus ca să începi.",
    target: "[data-tutorial=\"clienti-add-button\"]",
  },
  {
    title: "Pasul 2: completează datele",
    text: "Completează cel puțin numele clientului și apasă „Adaugă client”.",
    target: "[data-tutorial=\"clienti-add-name\"]",
  },
  {
    title: "Pasul 3: deschide clientul",
    text: "Acum selectează primul client din listă (rândul clientului).",
    target: "[data-tutorial=\"clienti-first-client\"]",
  },
  {
    title: "Pasul 4: deschide cererea",
    text: "În panoul clientului, apasă butonul „Cerere”.",
    target: "[data-tutorial=\"clienti-drawer-request-btn\"]",
  },
  {
    title: "Pasul 5: programează cererea",
    text: "În formular alegi trimite acum sau la o dată selectată, apoi trimiți manual sau pe email.",
    target: "[data-tutorial=\"clienti-request-modal\"]",
  },
];

export function ClientiOnboardingTutorial({
  userId,
  hasAnyClients,
  modalOpen,
  drawerOpen,
  requestModalOpen,
  onOpenAddClient,
  onOpenFirstClient,
  onOpenFirstRequest,
  startSignal = 0,
  continueSignal = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const forceCentered = step === 5;

  const storageKey = userId
    ? `${STORAGE_KEY_PREFIX}${userId}`
    : `${STORAGE_KEY_PREFIX}default`;
  const continueKey = userId
    ? `velo_onboarding_clienti_continue_${userId}`
    : "velo_onboarding_clienti_continue_default";

  const closeAndPersist = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    setOpen(false);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {}

    try {
      if (localStorage.getItem(continueKey) === "1") {
        localStorage.removeItem(continueKey);
        setStep(3);
        setOpen(true);
        return;
      }
    } catch {}

    if (hasAnyClients) {
      return;
    }
    setOpen(true);
  }, [continueKey, hasAnyClients, storageKey]);

  useEffect(() => {
    if (!startSignal) return;
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {}
    setStep(0);
    setOpen(true);
  }, [startSignal, storageKey]);

  useEffect(() => {
    if (!continueSignal) return;
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {}
    setStep((prev) => (prev < 3 ? 3 : prev));
    setOpen(true);
  }, [continueSignal, storageKey]);

  useEffect(() => {
    if (!open) return;
    if (step === 1 && modalOpen) setStep(2);
  }, [open, step, modalOpen]);

  useEffect(() => {
    if (!open) return;
    if (step === 3 && drawerOpen) setStep(4);
  }, [open, step, drawerOpen]);

  useEffect(() => {
    if (!open) return;
    if (step === 4 && requestModalOpen) setStep(5);
  }, [open, step, requestModalOpen]);

  // Dacă formularul de cerere s-a închis și suntem în ultimul pas, închidem și tutorialul.
  useEffect(() => {
    if (!open) return;
    if (step === 5 && !requestModalOpen) {
      closeAndPersist();
    }
  }, [closeAndPersist, open, requestModalOpen, step]);

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
    if (!open) return;
    measure();
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const onResize = () => measure();
    const onViewportResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("resize", onViewportResize);
    window.addEventListener("scroll", onScroll, true);
    const t = setTimeout(measure, 120);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onViewportResize);
      window.removeEventListener("scroll", onScroll, true);
      clearTimeout(t);
    };
  }, [open, step, measure]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const hasTarget = !forceCentered && !!rect && !!current.target;
  const cardWidth = 370;

  const cardStyle = useMemo(() => {
    const base = {
      position: "fixed" as const,
      width: "100%",
      maxWidth: cardWidth,
      zIndex: 10050,
      background: "#fff",
      border: "1px solid var(--paper-3)",
      borderRadius: "var(--r-xl)",
      boxShadow: "0 10px 48px rgba(26,26,46,0.18)",
      padding: 20,
    };

    // Default centered placement for intro and no-target states.
    const centered = {
      ...base,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };

    if (forceCentered) return centered;
    if (!rect || viewport.w === 0 || viewport.h === 0) return centered;

    const margin = 24;
    const gap = 14;
    const isNarrow = viewport.w < 700;

    if (isNarrow) {
      const maxCardH = 280;
      const belowTop = rect.top + rect.height + gap;
      const canPlaceBelow = belowTop + maxCardH < viewport.h - margin;
      return {
        ...base,
        left: margin,
        right: margin,
        maxWidth: "none",
        transform: "none",
        top: canPlaceBelow ? belowTop : margin,
      };
    }
    const rightSpace = viewport.w - (rect.left + rect.width) - margin;
    const leftSpace = rect.left - margin;
    const desiredTop = Math.max(
      margin,
      Math.min(rect.top, viewport.h - 280)
    );

    if (rightSpace >= cardWidth) {
      return {
        ...base,
        top: desiredTop,
        left: rect.left + rect.width + gap,
      };
    }

    if (leftSpace >= cardWidth) {
      return {
        ...base,
        top: desiredTop,
        left: Math.max(margin, rect.left - cardWidth - gap),
      };
    }

    return centered;
  }, [forceCentered, rect, viewport.h, viewport.w]);

  const primaryLabel = useMemo(() => {
    if (step === 1 && !modalOpen) return "Deschide formularul";
    if (step === 2) return "OK";
    if (step === 3 && !drawerOpen) return "Deschide client";
    if (step === 4 && !requestModalOpen) return "Deschide Cerere";
    if (isLast) return "Am înțeles";
    return "Continuă";
  }, [isLast, modalOpen, drawerOpen, requestModalOpen, step]);

  function handlePrimary() {
    if (step === 1 && !modalOpen) {
      onOpenAddClient();
      return;
    }
    if (step === 2) {
      // Ascunde pasul ca utilizatorul să poată completa formularul.
      // Următorul pas va reapărea automat după ce se adaugă clientul (continueSignal).
      setOpen(false);
      return;
    }
    if (step === 3 && !drawerOpen) {
      onOpenFirstClient();
      return;
    }
    if (step === 4 && !requestModalOpen) {
      onOpenFirstRequest();
      return;
    }
    if (isLast) {
      closeAndPersist();
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  if (!open) return null;

  return (
    <>
      {(step === 0 || forceCentered) && (
        <div
          className="fixed inset-0 z-[10040] pointer-events-none"
          style={{
            background: "rgba(26,26,46,0.35)",
            backdropFilter: "blur(5px)",
          }}
          aria-hidden
        />
      )}

      {hasTarget && rect && (
        <div className="fixed inset-0 z-[10040] pointer-events-none" aria-hidden>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, rect.top),
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
              background: "rgba(26,26,46,0.35)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              borderRadius: "var(--r-md)",
              outline: "2px solid var(--sage)",
              outlineOffset: 3,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      <div
        role="dialog"
        aria-modal="false"
        style={cardStyle}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sage)" }}>
            Onboarding
          </span>
          <button
            type="button"
            onClick={closeAndPersist}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--ink-muted)", fontSize: 18, lineHeight: 1 }}
            aria-label="Închide"
          >
            ×
          </button>
        </div>
        <h3 style={{ fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 14 }}>
          {current.text}
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                display: "block",
                height: 6,
                borderRadius: 100,
                width: i === step ? 22 : 7,
                background: i === step ? "var(--sage)" : i < step ? "rgba(75,122,110,0.35)" : "var(--paper-3)",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={closeAndPersist}
            style={{ border: "none", background: "none", color: "var(--ink-muted)", fontSize: 13, cursor: "pointer" }}
          >
            Sari peste
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            style={{
              border: "none",
              background: "var(--sage)",
              color: "#fff",
              borderRadius: "var(--r-md)",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  );
}

