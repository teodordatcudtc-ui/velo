"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "velo_tutorial_seen_";
const PADDING = 8;

const STEPS = [
  {
    title: "Bine ai venit în Velo",
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

  return (
    <div
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-desc"
    >
      {/* Blur overlay: 4 panels so the target stays clickable */}
      {hasTarget && rect ? (
        <>
          {/* top */}
          <div
            className="absolute left-0 right-0 bg-[var(--ink)]/40 backdrop-blur-md"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
            aria-hidden
            onClick={close}
          />
          {/* bottom */}
          <div
            className="absolute left-0 right-0 bg-[var(--ink)]/40 backdrop-blur-md"
            style={{
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            aria-hidden
            onClick={close}
          />
          {/* left */}
          <div
            className="absolute bg-[var(--ink)]/40 backdrop-blur-md"
            style={{
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
            }}
            aria-hidden
            onClick={close}
          />
          {/* right */}
          <div
            className="absolute bg-[var(--ink)]/40 backdrop-blur-md"
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
            aria-hidden
            onClick={close}
          />
          {/* Highlight ring */}
          <div
            className="absolute rounded-[var(--r-md)] ring-2 ring-[var(--sage)] ring-offset-2 ring-offset-transparent pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-md"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Tooltip card - mereu în viewport, centrat, ca să poți apăsa butoanele */}
      <div
        className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-[var(--r-xl)] bg-[var(--paper)] border border-[var(--paper-3)] shadow-[var(--shadow-xl)] p-6 mx-4 max-h-[calc(100vh-48px)] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-700 uppercase tracking-wider text-[var(--sage)]">
            Ghid rapid
          </span>
          <button
            type="button"
            onClick={close}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] p-1 rounded transition"
            aria-label="Închide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 id="tutorial-title" className="font-[var(--f-display)] text-xl font-600 text-[var(--ink)] mb-2">
          {current.title}
        </h2>
        <p id="tutorial-desc" className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">
          {current.text}
        </p>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-5 bg-[var(--sage)]"
                    : i < step
                      ? "w-1.5 bg-[var(--sage)]/50"
                      : "w-1.5 bg-[var(--paper-3)]"
                }`}
                aria-hidden
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Sari peste
            </button>
            {isLast ? (
              <button type="button" onClick={close} className="btn btn-primary text-sm">
                Am înțeles
              </button>
            ) : (
              <button type="button" onClick={next} className="btn btn-primary text-sm">
                Continuă
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
