"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateUploadToken } from "@/lib/upload-token";
import { customAlphabet } from "nanoid";

const fallbackAlphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const fallbackToken = customAlphabet(fallbackAlphabet, 20);

export async function addClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;

  if (!name?.trim()) return { error: "Numele este obligatoriu" };

  let unique_token = generateUploadToken(name.trim());

  const { error } = await supabase.from("clients").insert({
    accountant_id: user.id,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    unique_token,
  });

  if (error) {
    if (error.code === "23505") {
      unique_token = `client-${fallbackToken()}`;
      const { error: retryError } = await supabase.from("clients").insert({
        accountant_id: user.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        unique_token,
      });
      if (retryError) return { error: retryError.message };
    } else {
      return { error: error.message };
    }
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addDocumentType(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Numele documentului este obligatoriu" };

  const { error } = await supabase.from("document_types").insert({
    client_id: clientId,
    name: name.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeDocumentType(documentTypeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { error } = await supabase
    .from("document_types")
    .delete()
    .eq("id", documentTypeId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (fetchError || !client) {
    return { error: "Client negăsit sau nu ai dreptul să îl ștergi." };
  }

  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateClientReminder(
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautentificat" };

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (!client) return { error: "Client negăsit." };

  const enabled =
    formData.get("reminder_enabled") === "on" ||
    formData.get("reminder_enabled") === "true";
  const dayRaw = formData.get("reminder_day_of_month") as string | null;
  const day =
    dayRaw != null && dayRaw !== ""
      ? Math.min(31, Math.max(1, parseInt(dayRaw, 10) || 1))
      : null;

  const { error } = await supabase
    .from("clients")
    .update({
      reminder_enabled: enabled,
      reminder_day_of_month: enabled ? day ?? 1 : null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
