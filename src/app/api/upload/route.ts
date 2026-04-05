import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPdfFromImageBuffer,
  guessIsImageMime,
  guessIsPdf,
  pdfDisplayName,
} from "@/lib/image-to-pdf";
import type { Database } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("unique_token", token)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Link invalid." }, { status: 404 });
  }

  const clientId = (client as { id: string }).id;

  const { data: docType } = await supabase
    .from("document_types")
    .select("id")
    .eq("id", documentTypeId)
    .eq("client_id", clientId)
    .single();

  if (!docType) {
    return NextResponse.json(
      { error: "Tip document invalid pentru acest client." },
      { status: 400 }
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const mime = (file.type || "").toLowerCase();
  const isPdf = guessIsPdf(mime, file.name);
  const isImage = !isPdf && guessIsImageMime(mime, file.name);

  let uploadBody: Buffer | Uint8Array;
  let contentType: string;
  let storedFileName: string;
  let safeName: string;

  if (isImage) {
    try {
      const raw = Buffer.from(await file.arrayBuffer());
      const pdfBytes = await buildPdfFromImageBuffer(raw);
      uploadBody = pdfBytes;
      contentType = "application/pdf";
      storedFileName = pdfDisplayName(file.name);
      safeName = `${Date.now()}-${storedFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
    uploadBody = Buffer.from(await file.arrayBuffer());
    contentType = file.type || "application/octet-stream";
    storedFileName = file.name;
    safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  }

  const filePath = `${clientId}/${year}/${month}/${documentTypeId}/${safeName}`;

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

  const insertPayload: UploadInsert = {
    client_id: clientId,
    document_type_id: documentTypeId,
    file_path: filePath,
    file_name: storedFileName,
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
  return NextResponse.json({ ok: true, uploadId, fileName: storedFileName });
}
