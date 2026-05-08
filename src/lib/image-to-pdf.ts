import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/** Dimensiuni A4 în puncte PDF (72 pt = 1 inch) */
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

const MAX_SCAN_SIZE = 3200;
const MIN_CROP_EDGE = 500;
const MIN_CROP_AREA_RATIO = 0.18;

type CropRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

async function detectDocumentRegion(
  imageBuffer: Buffer,
  sourceWidth: number,
  sourceHeight: number
): Promise<CropRegion | null> {
  try {
    const { info } = await sharp(imageBuffer)
      .greyscale()
      .normalise()
      .blur(1.1)
      .threshold(210)
      .negate()
      .trim({ threshold: 16 })
      .toBuffer({ resolveWithObject: true });

    const left = Number(info.trimOffsetLeft ?? 0);
    const top = Number(info.trimOffsetTop ?? 0);
    const width = Number(info.width ?? 0);
    const height = Number(info.height ?? 0);
    if (width < MIN_CROP_EDGE || height < MIN_CROP_EDGE) return null;

    const areaRatio = (width * height) / Math.max(sourceWidth * sourceHeight, 1);
    if (areaRatio < MIN_CROP_AREA_RATIO) return null;

    return { left, top, width, height };
  } catch {
    return null;
  }
}

async function normalizeReceiptPhoto(imageBuffer: Buffer): Promise<Buffer> {
  const normalized = await sharp(imageBuffer)
    .rotate()
    .resize(MAX_SCAN_SIZE, MAX_SCAN_SIZE, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const metadata = await sharp(normalized).metadata();
  const baseWidth = metadata.width ?? 0;
  const baseHeight = metadata.height ?? 0;
  const baseArea = Math.max(baseWidth * baseHeight, 1);

  const region = await detectDocumentRegion(normalized, baseWidth, baseHeight);

  const croppedOrFull =
    region && region.width * region.height >= baseArea * MIN_CROP_AREA_RATIO
      ? await sharp(normalized)
          .extract({
            left: Math.max(0, Math.min(region.left, Math.max(baseWidth - 1, 0))),
            top: Math.max(0, Math.min(region.top, Math.max(baseHeight - 1, 0))),
            width: Math.max(1, Math.min(region.width, baseWidth)),
            height: Math.max(1, Math.min(region.height, baseHeight)),
          })
          .toBuffer()
      : normalized;

  // Shadow-safe base enhancement (similar to scanner apps before B/W decision).
  const scannerBase = await sharp(croppedOrFull)
    .greyscale()
    .normalise()
    .gamma(1.12)
    .linear(1.16, -10)
    .modulate({ brightness: 1.04, saturation: 0.8 })
    .sharpen({ sigma: 1.25, m1: 1, m2: 2.2 })
    .median(1)
    .toBuffer();

  // Keep grayscale enhancement (no hard threshold) to avoid black artifacts in shadows.
  return sharp(scannerBase).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

/**
 * Construiește un PDF valid (A4) cu imaginea scalată la încadrare, potrivit pentru arhivă contabilă.
 * Folosește sharp pentru rotație EXIF și conversie WebP/HEIC/GIF → JPEG înainte de încorporare.
 */
export async function buildPdfFromImageBuffer(imageBuffer: Buffer): Promise<Uint8Array> {
  const jpegBuffer = await normalizeReceiptPhoto(imageBuffer);

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
