"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { validatePassword } from "@/lib/password";
import { customAlphabet } from "nanoid";

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCodePart = customAlphabet(codeAlphabet, 6);

function sanitizeCodeSegment(value: string | null, fallback = ""): string {
  const raw = (value ?? "").trim().toUpperCase();
  if (!raw) return fallback;
  const cleaned = raw.replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Numele este obligatoriu" };

  const { error } = await supabase
    .from("accountants")
    .update({ name })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password) return { error: "Parola este obligatorie." };
  const validation = validatePassword(password);
  if (!validation.ok) return { error: validation.error };
  if (password !== confirm) return { error: "Parolele nu coincid." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function redeemEarlyAccessCode(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Neautentificat" };

    const rawCode = (formData.get("code") as string | null) ?? "";
    const code = rawCode.trim().toUpperCase();
    if (!code) return { error: "Introdu un cod valid." };

    const { data, error } = await supabase.rpc("redeem_early_access_code", {
      p_code: code,
      p_accountant_id: user.id,
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clienti");
    revalidatePath("/dashboard/setari");

    return {
      ok: true,
      premiumUntil: typeof data === "string" ? data : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare neașteptată la validarea codului.";
    return { error: message };
  }
}

export async function createEarlyAccessCode(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const adminEmail = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  const isAllowedAdmin =
    !!user.email && !!adminEmail && user.email.toLowerCase() === adminEmail;
  if (!isAllowedAdmin) return { error: "Nu ai permisiunea să generezi coduri." };

  const validDaysRaw = Number(formData.get("valid_days") ?? 45);
  const maxUsesRaw = Number(formData.get("max_uses") ?? 1);
  const validDays = Number.isFinite(validDaysRaw)
    ? Math.max(1, Math.min(365, Math.trunc(validDaysRaw)))
    : 45;
  const maxUses = Number.isFinite(maxUsesRaw)
    ? Math.max(1, Math.min(1000, Math.trunc(maxUsesRaw)))
    : 1;

  const prefixInput = sanitizeCodeSegment(formData.get("code_prefix") as string | null, "EARLY");
  const clientSegmentInput = sanitizeCodeSegment(formData.get("client_segment") as string | null);
  const prefix = prefixInput.slice(0, 16) || "EARLY";
  const clientSegment = clientSegmentInput.slice(0, 16);

  const baseParts = [prefix, clientSegment].filter(Boolean);

  const admin = createAdminClient();
  let code = "";
  let lastError: { message?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = generateCodePart();
    code = [...baseParts, randomPart].join("-");

    const { error } = await (admin as any).from("early_access_codes").insert({
      code,
      valid_days: validDays,
      max_uses: maxUses,
      created_by: user.id,
    });

    if (!error) {
      return { ok: true, code };
    }

    lastError = error;
    const isDuplicateCode = error.message?.toLowerCase().includes("duplicate key");
    if (!isDuplicateCode) {
      return { error: error.message };
    }
  }

  return { error: lastError?.message ?? "Nu am putut genera codul. Încearcă din nou." };
}

export async function setSubscriptionPlanForTesting(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const planRaw = (formData.get("plan") as string | null) ?? "";
  const plan = planRaw === "premium" ? "premium" : "standard";

  const updatePayload =
    plan === "standard"
      ? { subscription_plan: "standard" as const, premium_until: null as string | null }
      : { subscription_plan: "premium" as const };

  const { error } = await supabase
    .from("accountants")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clienti");
  revalidatePath("/dashboard/setari");

  return { ok: true, plan };
}
