import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/** Dimensiuni A4 în puncte PDF (72 pt = 1 inch) */
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

const MAX_SCAN_SIZE = 2400;

/**
 * CamScanner-style enhancement via division normalization.
 *
 * Core idea: divide each pixel by a heavily-blurred version of the image.
 * The blur estimates local background lighting (including shadows), so dividing
 * by it cancels uneven illumination. Text stays dark, paper turns white —
 * without hard thresholds that create black blobs in shadow areas.
 */
export async function buildEnhancedDocumentImageBuffer(imageBuffer: Buffer): Promise<Buffer> {
  // Step 1: orient + resize + explicit single-channel PNG (guarantees 1 byte/pixel in raw)
  const grey = await sharp(imageBuffer)
    .rotate()
    .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .greyscale()
    .png()
    .toBuffer();

  // Step 2: get raw 1-channel pixel array + dimensions
  const { data: grayPx, info } = await sharp(grey)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels; // should be 1

  // Step 3: heavily blurred version = local background/lighting estimate
  // Clamp sigma to at most 1/6 of shortest dimension to avoid libvips kernel errors
  const blurSigma = Math.max(10, Math.min(60, Math.floor(Math.min(w, h) / 6)));
  const { data: bgPx } = await sharp(grey)
    .greyscale()
    .blur(blurSigma)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Step 4: division normalization — cancels uneven shadows without hard threshold
  // Multiplier 232 keeps glare areas slightly below pure white so text stays visible
  const pixelCount = w * h;
  const divided = Buffer.alloc(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const g = grayPx[i * ch] ?? 128;
    const bg = Math.max(bgPx[i * ch] ?? 128, 1);
    divided[i] = Math.min(255, Math.round((g / bg) * 232));
  }

  // Step 5: CLAHE tiles sized to ~1/24 of image for local glare recovery, then stretch + sharpen
  const claheTile = Math.max(8, Math.min(32, Math.floor(Math.min(w, h) / 24)));
  let enhancedBase: Buffer;
  try {
    enhancedBase = await sharp(divided, { raw: { width: w, height: h, channels: 1 } })
      .clahe({ width: claheTile, height: claheTile, maxSlope: 4 })
      .toBuffer();
  } catch {
    // fallback: skip CLAHE if it fails (older libvips or edge-case dimensions)
    enhancedBase = await sharp(divided, { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toBuffer();
  }

  return sharp(enhancedBase)
    .greyscale()
    .normalise()
    .gamma(0.88)
    .linear(1.32, -22)
    .sharpen({ sigma: 1.15, m1: 0.9, m2: 2.4 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

/**
 * Construiește un PDF valid (A4) cu imaginea scalată la încadrare, potrivit pentru arhivă contabilă.
 * Folosește sharp pentru rotație EXIF și conversie WebP/HEIC/GIF → JPEG înainte de încorporare.
 */
export async function buildPdfFromImageBuffer(imageBuffer: Buffer): Promise<Uint8Array> {
  const jpegBuffer = await buildEnhancedDocumentImageBuffer(imageBuffer);

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
