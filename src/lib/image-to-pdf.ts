import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;
const MAX_SCAN_SIZE = 2000;

/**
 * Enhances a document photo to look like a clean scan.
 * Uses only native sharp operations (no raw pixel loops) for reliability.
 * Two-stage: normalise lighting, then boost text contrast.
 */
export async function buildEnhancedDocumentImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .rotate()                             // fix EXIF orientation
      .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
      .removeAlpha()
      .greyscale()
      .normalise()                          // stretch histogram: removes uneven lighting
      .gamma(0.78)                          // compress highlights → paper turns white, text stays dark
      .linear(1.45, -38)                    // boost contrast: push darks down, lights up
      .sharpen({ sigma: 1.3, m1: 1, m2: 3 }) // crisp text edges
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    // Absolute fallback — must never throw
    try {
      return await sharp(imageBuffer)
        .rotate()
        .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
        .removeAlpha()
        .greyscale()
        .normalise()
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      return await sharp(imageBuffer)
        .rotate()
        .jpeg({ quality: 80 })
        .toBuffer();
    }
  }
}

/**
 * Converts an image buffer to a PDF A4 document.
 * Always embeds as PNG to avoid JPEG parser edge-cases in pdf-lib.
 */
export async function buildPdfFromImageBuffer(imageBuffer: Buffer): Promise<Uint8Array> {
  // Produce enhanced JPEG first
  const enhanced = await buildEnhancedDocumentImageBuffer(imageBuffer);

  // Convert to PNG for embedding — pdf-lib embedPng is more robust than embedJpg
  let pngBuffer: Buffer;
  try {
    pngBuffer = await sharp(enhanced).png().toBuffer();
  } catch {
    // If even PNG conversion fails, embed from the original as last resort
    pngBuffer = await sharp(imageBuffer)
      .rotate()
      .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
      .removeAlpha()
      .png()
      .toBuffer();
  }

  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(pngBuffer);

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
  return ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tif", "tiff", "jfif"].includes(ext);
}

export function guessIsPdf(mime: string, fileName: string): boolean {
  if (mime === "application/pdf") return true;
  return fileName.toLowerCase().endsWith(".pdf");
}

export function pdfDisplayName(originalName: string): string {
  const trimmed = originalName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const safe = base.replace(/[/\\?%*:|"<>]/g, "_").trim().slice(0, 180) || "document";
  return `${safe}.pdf`;
}
