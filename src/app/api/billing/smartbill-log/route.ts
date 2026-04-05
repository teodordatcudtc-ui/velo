import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Ultimele înregistrări jurnal SmartBill (diagnostic pentru utilizator). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("smartbill_sync_log")
    .select(
      "status, error_message, smartbill_series, smartbill_number, detail, created_at, stripe_checkout_session_id"
    )
    .eq("accountant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("smartbill-log:", error);
    return NextResponse.json({ error: "Nu am putut încărca jurnalul." }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
