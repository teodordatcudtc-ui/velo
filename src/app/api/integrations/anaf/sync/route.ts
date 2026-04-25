import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncAnafForAccountant } from "@/lib/anaf-sync";
import { NextResponse } from "next/server";

function isAnafAdmin(email: string | null | undefined): boolean {
  const admin = process.env.EARLY_ACCESS_ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && !!email && email.toLowerCase() === admin;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  if (!isAnafAdmin(user.email)) {
    return NextResponse.json({ error: "Integrarea ANAF este disponibilă doar pentru admin." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: conn, error } = await admin
    .from("anaf_connections")
    .select("accountant_id, enabled, company_cif, api_base_url, oauth_token_url, oauth_client_id, oauth_client_secret, oauth_refresh_token, access_token, access_token_expires_at, consecutive_failures, circuit_open_until")
    .eq("accountant_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!conn) return NextResponse.json({ error: "Conexiunea ANAF nu este configurată." }, { status: 400 });

  const result = await syncAnafForAccountant(admin, conn);
  return NextResponse.json({
    ok: true,
    imported: result.imported,
    skipped: result.skipped,
    errors: result.errors,
  });
}
