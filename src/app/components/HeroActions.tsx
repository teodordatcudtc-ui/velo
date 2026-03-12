"use client";

import { useState } from "react";
import Link from "next/link";

export function HeroActions() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hero-actions">
        <Link href="/signup" className="btn btn-primary btn-primary-lg">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Încearcă gratuit
        </Link>
        <button
          type="button"
          className="btn btn-secondary"
          style={{
            padding: "18px 36px",      // la fel ca .btn-primary-lg
            fontSize: 16,              // la fel ca .btn-primary-lg
            fontWeight: 600,           // la fel ca .btn-primary-lg
            borderRadius: "var(--r-lg)", // la fel ca .btn-primary-lg
          }}
          onClick={() => setOpen(true)}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
          </svg>
          Vezi demo
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[2000]"
          style={{
            background: "rgba(15,15,30,0.65)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              maxWidth: 1120,
              width: "100%",
              background: "var(--paper)",
              borderRadius: "var(--r-xl)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Închide demo"
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                border: "none",
                background: "rgba(0,0,0,0.45)",
                color: "#fff",
                width: 28,
                height: 28,
                borderRadius: 999,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              <video
                controls
                autoPlay
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  backgroundColor: "#000",
                }}
              >
                <source src="/demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

