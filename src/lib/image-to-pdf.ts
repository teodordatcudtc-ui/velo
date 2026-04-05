import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/** Dimensiuni A4 în puncte PDF (72 pt = 1 inch) */
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

/**
 * Construiește un PDF valid (A4) cu imaginea scalată la încadrare, potrivit pentru arhivă contabilă.
 * Folosește sharp pentru rotație EXIF și conversie WebP/HEIC/GIF → JPEG înainte de încorporare.
 */
export async function buildPdfFromImageBuffer(imageBuffer: Buffer): Promise<Uint8Array> {
  const jpegBuffer = await sharp(imageBuffer)
    .rotate()
    .resize(3200, 3200, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  const pdf = await PDFDocument.create();
  const image = await pdf.embedJpg(jpegBuffer);

  const iw = image.width;
  const ih = image.height;
  const maxW = A4_W - 2 * MARGIN;
  const maxH = A4_H - 2 * MARGIN;
  const scale = Math.min(maxW / iw, maxH / ih);
  const w = iw * scale;
  const h = ih * scale;
  const x = (A4_W - w) / 2;
  const y = (A4_H - h) / 2;

  const page = pdf.addPage([A4_W, A4_H]);
  page.drawImage(image, { x, y, width: w, height: h });

  return pdf.save();
}

export function guessIsImageMime(mime: string, fileName: string): boolean {
  const m = mime.toLowerCase().trim();
  if (m.startsWith("image/")) return true;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tif", "tiff", "jfif"].includes(
    ext
  );
}

export function guessIsPdf(mime: string, fileName: string): boolean {
  if (mime === "application/pdf") return true;
  return fileName.toLowerCase().endsWith(".pdf");
}

/** Nume afișat/stocat: înlocuiește extensia cu .pdf */
export function pdfDisplayName(originalName: string): string {
  const trimmed = originalName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const safe = base.replace(/[/\\?%*:|"<>]/g, "_").trim().slice(0, 180) || "document";
  return `${safe}.pdf`;
}
