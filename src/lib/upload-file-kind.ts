import { guessIsImageMime, guessIsPdf } from "@/lib/image-to-pdf";

export type UploadFileKind = "pdf" | "image" | "other";

/** Detectează tipul real (inclusiv PDF fără MIME/extensie corectă). */
export function detectUploadFileKind(
  buffer: Buffer,
  mime: string,
  fileName: string
): UploadFileKind {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF") {
    return "pdf";
  }
  if (guessIsPdf(mime, fileName)) return "pdf";
  if (guessIsImageMime(mime, fileName)) return "image";
  return "other";
}
