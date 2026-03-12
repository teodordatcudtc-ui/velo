"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

export function EarlyAccessAutoRedeem() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    const raw = searchParams.get("early_code");
    const code = (raw ?? "").trim().toUpperCase();
    if (!code) return;
    hasRunRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/early-access/redeem-from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          const msg = data.error ?? "Codul de early access nu a putut fi aplicat.";
          toast.error(msg);
        } else {
          const premiumRaw = data.premiumUntil as string | null | undefined;
          const premiumUntil =
            premiumRaw && typeof premiumRaw === "string"
              ? new Date(premiumRaw).toLocaleDateString("ro-RO", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : null;
          toast.success(
            premiumUntil
              ? `Cod early access activat. Acces Premium până la ${premiumUntil}.`
              : "Cod early access activat."
          );
        }
      } catch {
        toast.error("Eroare la aplicarea codului de early access.");
      } finally {
        // Curățăm parametrul din URL
        router.replace("/dashboard");
        router.refresh();
      }
    })();
  }, [router, searchParams, toast]);

  return null;
}

