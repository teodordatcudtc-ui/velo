import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { code } = (await request.json().catch(() => ({}))) as { code?: string };
    const cleanCode = (code ?? "").trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json({ error: "Cod lipsă." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("redeem_early_access_code", {
      p_code: cleanCode,
      p_accountant_id: user.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const premiumUntil = typeof data === "string" ? data : null;
    return NextResponse.json({ ok: true, premiumUntil });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Eroare neașteptată.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

