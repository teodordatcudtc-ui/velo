import { createAdminClient } from "@/lib/supabase/admin";
import { buildPdfFromImageBuffer, guessIsImageMime, guessIsPdf } from "@/lib/image-to-pdf";
import { buildUploadFileName, fileExtension } from "@/lib/upload-naming";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";
import { hasActiveSubscription, hasPremiumAccess } from "@/lib/subscription";

type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];

const BUCKET = "uploads";

/** Dimensiune maximă fișier încărcat (25 MB) */
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token") as string | null;
  const documentTypeId = formData.get("documentTypeId") as string | null;
  const file = formData.get("file") as File | null;

  if (!token || !documentTypeId || !file?.size) {
    return NextResponse.json(
      { error: "Lipsesc token, tip document sau fișier." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fișierul este prea mare (maxim 25 MB)." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  /* ── 1. Validare token → client (cu nume) ─────────────────────────────── */
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, accountant_id")
    .eq("unique_token", token)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Link invalid." }, { status: 404 });
  }

  const clientId = (client as { id: string; name: string; accountant_id: string }).id;
  const clientName = (client as { id: string; name: string; accountant_id: string }).name;
  const accountantId = (client as { id: string; name: string; accountant_id: string }).accountant_id;

  const { data: accountant } = await supabase
    .from("accountants")
    .select("subscription_plan, premium_until")
    .eq("id", accountantId)
    .maybeSingle();

  if (!hasActiveSubscription(accountant) && !hasPremiumAccess(accountant)) {
    return NextResponse.json(
      { error: "Abonamentul contabilului este expirat. Încărcarea documentelor este indisponibilă." },
      { status: 403 }
    );
  }

  /* ── 2. Validare tip document (cu nume) ───────────────────────────────── */
  const { data: docType } = await supabase
    .from("document_types")
    .select("id, name")
    .eq("id", documentTypeId)
    .eq("client_id", clientId)
    .single();

  if (!docType) {
    return NextResponse.json(
      { error: "Tip document invalid pentru acest client." },
      { status: 400 }
    );
  }

  const docTypeName = (docType as { id: string; name: string }).name;

  /* ── 3. Dată curentă ──────────────────────────────────────────────────── */
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  /* ── 4. Numără documente existente (pentru sufix anti-duplicat) ────────── */
  const { count: existingCount } = await supabase
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("document_type_id", documentTypeId)
    .eq("month", month)
    .eq("year", year);

  /* ── 5. Conversie imagine → PDF dacă e cazul ─────────────────────────── */
  const mime    = (file.type || "").toLowerCase();
  const isPdf   = guessIsPdf(mime, file.name);
  const isImage = !isPdf && guessIsImageMime(mime, file.name);

  let uploadBody: Buffer | Uint8Array;
  let contentType: string;
  let ext: string;

  if (isImage) {
    try {
      const raw      = Buffer.from(await file.arrayBuffer());
      const pdfBytes = await buildPdfFromImageBuffer(raw);
      uploadBody  = pdfBytes;
      contentType = "application/pdf";
      ext         = ".pdf";
    } catch (e) {
      console.error("image-to-pdf:", e);
      return NextResponse.json(
        {
          error:
            "Nu am putut converti imaginea în PDF. Încearcă alt format (JPG, PNG) sau o fotografie mai mică.",
        },
        { status: 400 }
      );
    }
  } else {
    uploadBody  = Buffer.from(await file.arrayBuffer());
    contentType = file.type || "application/octet-stream";
    ext         = isPdf ? ".pdf" : fileExtension(file.name);
  }

  /* ── 6. Construiește numele semantic ──────────────────────────────────── */
  const displayName = buildUploadFileName({
    clientName,
    docTypeName,
    month,
    year,
    ext,
    existingCount: existingCount ?? 0,
  });

  /* ── 7. Calea în storage (unică prin timestamp prefix) ────────────────── */
  const safeDisplayName = displayName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${clientId}/${year}/${month}/${documentTypeId}/${Date.now()}-${safeDisplayName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, uploadBody, {
    contentType,
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || "Eroare la încărcare fișier." },
      { status: 500 }
    );
  }

  /* ── 8. Inserează în DB ───────────────────────────────────────────────── */
  const insertPayload: UploadInsert = {
    client_id:        clientId,
    document_type_id: documentTypeId,
    file_path:        filePath,
    file_name:        displayName,
    month,
    year,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertError } = await (supabase as any)
    .from("uploads")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json(
      { error: insertError.message || "Eroare la salvare înregistrare." },
      { status: 500 }
    );
  }

  const uploadId = inserted?.id ? String(inserted.id) : null;
  return NextResponse.json({ ok: true, uploadId, fileName: displayName });
}
