import { syncAllAnafConnections } from "@/lib/anaf-sync";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (cronSecret && provided !== cronSecret) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  try {
    const result = await syncAllAnafConnections();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sync ANAF eșuat" },
      { status: 500 }
    );
  }
}
