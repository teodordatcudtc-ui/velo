import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;
const MAX_SCAN_SIZE = 2000;
type ImageToPdfMode = "scan" | "photo";

export async function buildNaturalDocumentImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .rotate()
      .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
      .removeAlpha()
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch {
    return await sharp(imageBuffer).rotate().jpeg({ quality: 85 }).toBuffer();
  }
}

/**
 * Enhances a document photo to look like a clean scan.
 *
 * Technique: "division normalisation" — divide each pixel by the local
 * background estimate (heavily blurred version of the same image).
 * Paper pixels that are at 70% of their local background map to ~70% → 255
 * regardless of whether they sit in a bright or shadowed region, so uneven
 * lighting and finger/sofa shadows are neutralised before the contrast stretch.
 */
export async function buildEnhancedDocumentImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Step 1 – orient, resize, convert to single-channel greyscale PNG
    const base = await sharp(imageBuffer)
      .rotate()
      .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
      .removeAlpha()
      .greyscale()
      .png()
      .toBuffer();

    // Step 2 – read raw pixels and their blurred background estimate
    const { data: src, info } = await sharp(base).raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels: ch } = info;

    // Blur sigma ≈ 1/12 of shortest dimension → covers large background regions
    // without being so large it times out (capped 15–80 px)
    const blurSigma = Math.max(15, Math.min(80, Math.floor(Math.min(w, h) / 12)));
    const { data: bg } = await sharp(base).blur(blurSigma).raw().toBuffer({ resolveWithObject: true });

    // Step 3 – divide: output = clamp(src / bg * 240, 0, 255)
    // Paper in bright area: src=210, bg=220 → 210/220*240 = 229
    // Paper in shadow:      src=100, bg=120 → 100/120*240 = 200
    // Text in bright area:  src=50,  bg=220 → 50/220*240  = 55
    // Text in shadow:       src=35,  bg=120 → 35/120*240  = 70
    // After normalise() these compress nicely to [0..255]
    const out = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) {
      const s = src[i * ch] ?? 128;
      const b = Math.max(bg[i * ch] ?? 128, 1);
      out[i] = Math.min(255, Math.round((s / b) * 240));
    }

    // Step 4 – final contrast pass: normalise → linear stretch → sharpen
    return await sharp(out, { raw: { width: w, height: h, channels: 1 } })
      .normalise()
      .linear(1.9, -50)
      .sharpen({ sigma: 1.5, m1: 2, m2: 5 })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    // Fallback: no division — plain normalise + aggressive linear
    try {
      return await sharp(imageBuffer)
        .rotate()
        .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
        .removeAlpha()
        .greyscale()
        .normalise()
        .linear(2.2, -65)
        .sharpen({ sigma: 1.5, m1: 2, m2: 5 })
        .jpeg({ quality: 88 })
        .toBuffer();
    } catch {
      return await sharp(imageBuffer).rotate().jpeg({ quality: 80 }).toBuffer();
    }
  }
}

/**
 * Converts an image buffer to a PDF A4 document.
 * Always embeds as PNG to avoid JPEG parser edge-cases in pdf-lib.
 */
export async function buildPdfFromImageBuffer(
  imageBuffer: Buffer,
  options?: { mode?: ImageToPdfMode }
): Promise<Uint8Array> {
  const mode: ImageToPdfMode = options?.mode === "photo" ? "photo" : "scan";

  // Produce image for PDF: enhanced scan or natural photo.
  let prepared: Buffer;
  if (mode === "photo") {
    prepared = await buildNaturalDocumentImageBuffer(imageBuffer);
  } else {
    prepared = await buildEnhancedDocumentImageBuffer(imageBuffer);
  }

  // Convert to PNG for embedding — pdf-lib embedPng is more robust than embedJpg
  let pngBuffer: Buffer;
  try {
    pngBuffer = await sharp(prepared).png().toBuffer();
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
