"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type User = { id: string } | null;

export function LandingNavCta() {
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    }).catch(() => setUser(null));
  }, []);

  if (user) {
    return (
      <div className="nav-cta">
        <Link
          href="/dashboard"
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: 14, borderRadius: "var(--r-md)" }}
        >
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="nav-cta">
      <Link href="/login" className="btn btn-ghost">
        Intră în cont
      </Link>
      <Link
        href="/signup"
        className="btn btn-primary"
        style={{ padding: "10px 20px", fontSize: 14, borderRadius: "var(--r-md)" }}
      >
        Încearcă gratuit
      </Link>
    </div>
  );
}

