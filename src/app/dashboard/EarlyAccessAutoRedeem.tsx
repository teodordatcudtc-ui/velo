"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/app/components/ToastProvider";

export function EarlyAccessAutoRedeem() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          // Dacă nu mai ești logat, mergem la login
          router.replace("/login");
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc("redeem_early_access_code", {
          p_code: code,
          p_accountant_id: user.id,
        });

        if (error) {
          toast.error(error.message ?? "Codul de early access nu a putut fi aplicat.");
        } else {
          const premiumUntil =
            typeof data === "string" && data
              ? new Date(data).toLocaleDateString("ro-RO", {
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
  }, [router, searchParams, supabase, toast]);

  return null;
}

