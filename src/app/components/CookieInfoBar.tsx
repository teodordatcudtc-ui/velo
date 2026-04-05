"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vello_cookie_info_ack";

/**
 * Bandă informativă (cookie-uri necesare + link politică).
 * Nu blochează conținutul; stochează acceptarea în localStorage.
 * Ascunsă în aplicația autentificată (dashboard) pentru a nu acoperi UI-ul.
 */
export function CookieInfoBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isAppShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-parola");

  useEffect(() => {
    if (isAppShell) {
      setVisible(false);
      return;
    }
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [isAppShell]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="cookie-info-bar"
      role="dialog"
      aria-label="Informare despre cookie-uri"
      aria-live="polite"
    >
      <div className="cookie-info-inner">
        <p className="cookie-info-text">
          Folosim cookie-uri și stocare locală strict necesare pentru autentificare, securitate și funcționarea site-ului.
          Nu folosim cookie-uri publicitare. Detalii în{" "}
          <Link href="/cookie-uri" className="cookie-info-link">
            Politica de cookies
          </Link>{" "}
          și{" "}
          <Link href="/privacy" className="cookie-info-link">
            Politica de confidențialitate
          </Link>
          .
        </p>
        <div className="cookie-info-actions">
          <button type="button" className="cookie-info-btn" onClick={dismiss}>
            Am înțeles
          </button>
        </div>
      </div>
    </div>
  );
}
