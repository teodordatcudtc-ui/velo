import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  let body: { uploadIds?: string[]; processed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const uploadIds = body.uploadIds?.filter(Boolean) ?? [];
  const processed = body.processed === true;

  if (uploadIds.length === 0) {
    return NextResponse.json({ error: "Niciun document selectat." }, { status: 400 });
  }

  const { data: uploads, error: listErr } = await supabase
    .from("uploads")
    .select("id, client_id")
    .in("id", uploadIds);

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  if (!uploads?.length) {
    return NextResponse.json({ error: "Documentele nu au fost găsite." }, { status: 404 });
  }

  const clientIds = [...new Set(uploads.map((u) => u.client_id))];
  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id")
    .in("id", clientIds)
    .eq("accountant_id", user.id);

  if (clientErr) {
    return NextResponse.json({ error: clientErr.message }, { status: 500 });
  }

  const ownedClientIds = new Set((clients ?? []).map((c) => c.id));
  const ownedIds = uploads.filter((u) => ownedClientIds.has(u.client_id)).map((u) => u.id);

  if (ownedIds.length === 0) {
    return NextResponse.json({ error: "Nu ai dreptul să modifici aceste documente." }, { status: 403 });
  }

  const processedAt = processed ? new Date().toISOString() : null;

  const { error: updateErr } = await supabase
    .from("uploads")
    .update({ processed_at: processedAt })
    .in("id", ownedIds);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    updated: ownedIds.length,
    processed_at: processedAt,
  });
}
