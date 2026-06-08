import { NextResponse } from "next/server";
import {
  buildEnhancedDocumentImageBuffer,
  buildNaturalDocumentImageBuffer,
  guessIsImageMime,
} from "@/lib/image-to-pdf";
import { getMaxUploadBytes, maxUploadSizeLabel } from "@/lib/upload-limits";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const modeRaw = (formData.get("mode") as string | null)?.toLowerCase();
  const mode = modeRaw === "photo" ? "photo" : "scan";

  if (!file?.size) {
    return NextResponse.json({ error: "Lipsește fișierul." }, { status: 400 });
  }

  if (file.size > getMaxUploadBytes()) {
    return NextResponse.json(
      { error: `Fișierul este prea mare (maxim ${maxUploadSizeLabel()}).` },
      { status: 400 }
    );
  }

  const mime = (file.type || "").toLowerCase();
  const isImage = guessIsImageMime(mime, file.name);
  if (!isImage) {
    return NextResponse.json({ error: "Preview-ul de scanare este disponibil doar pentru imagini." }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const preview =
      mode === "photo"
        ? await buildNaturalDocumentImageBuffer(raw)
        : await buildEnhancedDocumentImageBuffer(raw);
    return new Response(new Uint8Array(preview), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[preview-scan] preview build failed:", err);
    return NextResponse.json({ error: "Nu am putut genera preview-ul scanării." }, { status: 500 });
  }
}
