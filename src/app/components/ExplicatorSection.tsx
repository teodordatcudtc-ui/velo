"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Secțiune explicator video + CTA demo interactiv (growth 2026:
 * explainer videos simplify value prop; interactive demos convert 2x).
 */
export function ExplicatorSection() {
  const [open, setOpen] = useState(false);

  return (
    <section id="explicator" className="explicator-section">
      <div className="container">
        <div className="explicator-inner">
          <span className="overline">Explicator</span>
          <h2 className="h2" style={{ marginTop: 12, marginBottom: 12 }}>
            Vezi cum funcționează <em>în 2 minute</em>
          </h2>
          <p className="lead" style={{ maxWidth: 480, margin: "0 auto 32px" }}>
            Un scurt video care explică valoarea Vello și pașii de la cerere la documente.
          </p>

          <div className="explicator-trigger-wrap">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="explicator-trigger"
              aria-label="Vezi video explicativ"
            >
              <span className="explicator-play">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="explicator-label">Vezi explicatorul</span>
            </button>
          </div>

          <p className="explicator-cta-note">
            Preferi să explorezi singur?{" "}
            <Link href="/signup" className="explicator-link">
              Încearcă gratuit
            </Link>{" "}
            și testează fluxul în aplicație.
          </p>
        </div>
      </div>

      {open && (
        <div
          className="explicator-overlay"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video explicativ"
        >
          <div
            className="explicator-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Închide video"
              className="explicator-close"
            >
              ×
            </button>
            <div className="explicator-video-wrap">
              <video
                controls
                autoPlay
                className="explicator-video"
                src="/demo.mp4"
              >
                <track kind="captions" />
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
