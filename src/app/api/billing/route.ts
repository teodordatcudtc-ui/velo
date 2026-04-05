import { createClient } from "@/lib/supabase/server";
import {
  normalizeVatCode,
  validateBillingPayload,
  type BillingPayload,
} from "@/lib/billing-validation";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("accountants")
    .select(
      "billing_legal_name, billing_vat_code, billing_address, billing_city, billing_county, billing_country, billing_email, billing_is_company"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("billing GET:", error);
    return NextResponse.json({ error: "Nu am putut încărca datele." }, { status: 500 });
  }

  const a = row as {
    billing_legal_name: string | null;
    billing_vat_code: string | null;
    billing_address: string | null;
    billing_city: string | null;
    billing_county: string | null;
    billing_country: string | null;
    billing_email: string | null;
    billing_is_company: boolean | null;
  };

  return NextResponse.json({
    email: user.email ?? "",
    legalName: a.billing_legal_name ?? "",
    vatCode: a.billing_vat_code ?? "",
    address: a.billing_address ?? "",
    city: a.billing_city ?? "",
    county: a.billing_county ?? "",
    country: a.billing_country ?? "România",
    billingEmail: a.billing_email ?? "",
    isCompany: a.billing_is_company !== false,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  let body: Partial<{
    legalName: string;
    vatCode: string;
    address: string;
    city: string;
    county: string;
    country: string;
    billingEmail: string;
    isCompany: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalid." }, { status: 400 });
  }

  const isCompany = body.isCompany !== false;
  const payload: BillingPayload = {
    legalName: String(body.legalName ?? ""),
    vatCode: normalizeVatCode(String(body.vatCode ?? ""), isCompany),
    address: String(body.address ?? ""),
    city: String(body.city ?? ""),
    county: String(body.county ?? ""),
    country: String(body.country ?? "România").trim() || "România",
    email: String(body.billingEmail ?? "").trim(),
    isCompany,
  };

  const err = validateBillingPayload(payload);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const billingEmail =
    payload.email.trim() ||
    (user.email ?? null);

  const { error: upErr } = await supabase
    .from("accountants")
    .update({
      billing_legal_name: payload.legalName.trim(),
      billing_vat_code: payload.vatCode,
      billing_address: payload.address.trim(),
      billing_city: payload.city.trim(),
      billing_county: payload.county.trim(),
      billing_country: payload.country.trim(),
      billing_email: billingEmail,
      billing_is_company: isCompany,
    })
    .eq("id", user.id);

  if (upErr) {
    console.error("billing PUT:", upErr);
    return NextResponse.json({ error: "Nu am putut salva datele." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
