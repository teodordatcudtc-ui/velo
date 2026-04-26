import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPdfFromImageBuffer,
  guessIsImageMime,
  guessIsPdf,
} from "@/lib/image-to-pdf";

const BUCKET = "uploads";
const A4: readonly [number, number] = [595.28, 841.89];

type Period = "7" | "30" | "60" | "all";

function sanitizeFileName(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\w.\- ]+/g, "_")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "client"
  );
}

function periodToDays(period: Period): number | null {
  if (period === "all") return null;
  return Number(period);
}

function parsePeriod(value: string | null): Period {
  if (value === "7" || value === "30" || value === "60" || value === "all") {
    return value;
  }
  return "all";
}

function guessMimeFromName(fileName: string): string {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif", "tif", "tiff"].includes(ext)) {
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  }
  return "application/octet-stream";
}

async function appendPdfBytes(target: PDFDocument, sourceBytes: Uint8Array) {
  const source = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const indices = source.getPageIndices();
  if (indices.length === 0) return;
  const pages = await target.copyPages(source, indices);
  pages.forEach((p) => target.addPage(p));
}

async function addInfoPage(pdf: PDFDocument, title: string, lines: string[]) {
  const page = pdf.addPage(A4);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  page.drawText(title, {
    x: 40,
    y: height - 70,
    size: 16,
    font: bold,
    color: rgb(0.13, 0.18, 0.26),
  });

  let y = height - 110;
  for (const line of lines) {
    page.drawText(line, {
      x: 40,
      y,
      size: 11,
      font,
      color: rgb(0.18, 0.22, 0.29),
      maxWidth: width - 80,
      lineHeight: 15,
    });
    y -= 20;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  if (!clientId) {
    return NextResponse.json({ error: "Client invalid." }, { status: 400 });
  }

  const period = parsePeriod(new URL(request.url).searchParams.get("period"));
  const days = periodToDays(period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("accountant_id", user.id)
    .single();

  if (clientError || !clientRow) {
    return NextResponse.json({ error: "Client inexistent sau inaccesibil." }, { status: 404 });
  }

  let query = supabase
    .from("uploads")
    .select("id, file_name, file_path, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (days !== null) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - days);
    query = query.gte("created_at", from.toISOString());
  }

  const { data: uploads, error: uploadsError } = await query;
  if (uploadsError) {
    return NextResponse.json({ error: uploadsError.message }, { status: 500 });
  }

  if (!uploads || uploads.length === 0) {
    return NextResponse.json({ error: "Nu există documente în perioada aleasă." }, { status: 404 });
  }

  const admin = createAdminClient();
  const merged = await PDFDocument.create();
  const warnings: string[] = [];

  for (const upload of uploads) {
    const { data: fileData, error: fileError } = await admin.storage
      .from(BUCKET)
      .download(upload.file_path);

    if (fileError || !fileData) {
      warnings.push(`Nu s-a putut descărca: ${upload.file_name}`);
      continue;
    }

    const arr = new Uint8Array(await fileData.arrayBuffer());
    const mime = (fileData.type || guessMimeFromName(upload.file_name)).toLowerCase();

    try {
      if (guessIsPdf(mime, upload.file_name)) {
        await appendPdfBytes(merged, arr);
      } else if (guessIsImageMime(mime, upload.file_name)) {
        const imgPdf = await buildPdfFromImageBuffer(Buffer.from(arr));
        await appendPdfBytes(merged, imgPdf);
      } else {
        await addInfoPage(merged, "Document neconvertibil în PDF", [
          `Fișier: ${upload.file_name}`,
          "Acest tip de fișier nu poate fi convertit automat.",
          "Poți descărca fișierul original din lista de documente.",
        ]);
      }
    } catch {
      warnings.push(`Nu s-a putut procesa: ${upload.file_name}`);
    }
  }

  if (merged.getPageCount() === 0) {
    return NextResponse.json(
      {
        error:
          warnings.length > 0
            ? "Nu s-a putut genera PDF-ul combinat pentru documentele selectate."
            : "Nu există pagini pentru export.",
      },
      { status: 422 }
    );
  }

  if (warnings.length > 0) {
    await addInfoPage(merged, "Observații export", warnings.slice(0, 30));
  }

  const bytes = await merged.save();
  const clientName = sanitizeFileName(clientRow.name || "client");
  const suffix = period === "all" ? "toate" : `${period}zile`;
  const fileName = `documente-${clientName}-${suffix}.pdf`;

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
