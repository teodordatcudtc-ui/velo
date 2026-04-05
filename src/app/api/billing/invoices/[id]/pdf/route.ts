import { createClient } from "@/lib/supabase/server";
import { fetchInvoicePdfBuffer, isSmartBillConfigured } from "@/lib/smartbill";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Lipsește id." }, { status: 400 });
  }

  if (!isSmartBillConfigured()) {
    return NextResponse.json({ error: "Facturarea nu este configurată." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { data: inv, error } = await supabase
    .from("smartbill_invoices")
    .select("id, accountant_id, smartbill_series, smartbill_number")
    .eq("id", id)
    .maybeSingle();

  if (error || !inv) {
    return NextResponse.json({ error: "Factura nu a fost găsită." }, { status: 404 });
  }

  if (inv.accountant_id !== user.id) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 403 });
  }

  const result = await fetchInvoicePdfBuffer(inv.smartbill_series, inv.smartbill_number);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Nu am putut încărca PDF-ul din SmartBill.", detail: result.error },
      { status: 502 }
    );
  }

  const safeSeries = inv.smartbill_series.replace(/[^\w.-]+/g, "_");
  const safeNum = inv.smartbill_number.replace(/[^\w.-]+/g, "_");

  return new NextResponse(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Vello-factura-${safeSeries}-${safeNum}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
