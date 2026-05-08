import { NextResponse } from "next/server";
import { buildEnhancedDocumentImageBuffer, guessIsImageMime } from "@/lib/image-to-pdf";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file?.size) {
    return NextResponse.json({ error: "Lipsește fișierul." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fișierul este prea mare (maxim 25 MB)." }, { status: 400 });
  }

  const mime = (file.type || "").toLowerCase();
  const isImage = guessIsImageMime(mime, file.name);
  if (!isImage) {
    return NextResponse.json({ error: "Preview-ul de scanare este disponibil doar pentru imagini." }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());
    const enhanced = await buildEnhancedDocumentImageBuffer(raw);
    return new NextResponse(enhanced.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Nu am putut genera preview-ul scanării." }, { status: 500 });
  }
}
