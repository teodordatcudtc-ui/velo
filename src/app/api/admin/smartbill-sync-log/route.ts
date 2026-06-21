import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const adminEmail = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Doar contul admin." }, { status: 403 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs, error } = await (admin as any)
    .from("smartbill_sync_log")
    .select(
      "id, accountant_id, stripe_checkout_session_id, stripe_invoice_id, status, error_message, smartbill_series, smartbill_number, detail, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const accountantIds = [...new Set((logs ?? []).map((l: { accountant_id: string }) => l.accountant_id))];
  let namesById = new Map<string, string>();
  if (accountantIds.length > 0) {
    const { data: accountants } = await admin
      .from("accountants")
      .select("id, name")
      .in("id", accountantIds);
    namesById = new Map(
      (accountants ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
    );
  }

  const enriched = (logs ?? []).map(
    (row: {
      id: string;
      accountant_id: string;
      stripe_checkout_session_id: string | null;
      stripe_invoice_id: string | null;
      status: string;
      error_message: string | null;
      smartbill_series: string | null;
      smartbill_number: string | null;
      detail: string | null;
      created_at: string;
    }) => ({
      ...row,
      accountant_name: namesById.get(row.accountant_id) ?? row.accountant_id.slice(0, 8),
    })
  );

  return NextResponse.json({ logs: enriched });
}
