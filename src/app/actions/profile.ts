"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validatePassword } from "@/lib/password";

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
