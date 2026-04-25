import { normalizeTaxCode } from "@/lib/anaf";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isAnafAdmin(email: string | null | undefined): boolean {
  const admin = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && !!email && email.toLowerCase() === admin;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isAnafAdmin(user.email)) {
    return NextResponse.json({ error: "Integrarea ANAF este disponibilă doar pentru admin." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const clientId = String(body.clientId ?? "").trim();
  const taxCode = normalizeTaxCode(String(body.taxCode ?? ""));
  if (!clientId || !taxCode) {
    return NextResponse.json({ error: "Selectează clientul și introdu CUI/CIF valid." }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: "Client invalid." }, { status: 400 });

  const { error } = await supabase.from("anaf_client_tax_mappings").upsert({
    accountant_id: user.id,
    client_id: clientId,
    tax_code: taxCode,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isAnafAdmin(user.email)) {
    return NextResponse.json({ error: "Integrarea ANAF este disponibilă doar pentru admin." }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Lipsește id." }, { status: 400 });

  const { error } = await supabase
    .from("anaf_client_tax_mappings")
    .delete()
    .eq("id", id)
    .eq("accountant_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
