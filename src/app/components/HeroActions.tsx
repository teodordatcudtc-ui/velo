"use client";

import Link from "next/link";

export function HeroActions() {
  return (
    <div className="hero-actions">
      <Link
        href="/signup"
        className="btn btn-primary hero-btn"
      >
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
      <Link
        href="#how"
        className="btn btn-secondary hero-btn"
      >
        Cum funcționează
      </Link>
    </div>
  );
}

