import { customAlphabet } from "nanoid";

const SAFE_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const secureSuffix = customAlphabet(SAFE_ALPHABET, 12);

/** Diacritics → ASCII for Romanian (and common) so slug is URL-safe and readable */
const DIACRITICS: Record<string, string> = {
  ă: "a",
  â: "a",
  î: "i",
  ș: "s",
  ț: "t",
  Ă: "a",
  Â: "a",
  Î: "i",
  Ș: "s",
  Ț: "t",
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  ä: "a",
  ö: "o",
  ü: "u",
  ß: "ss",
};

const MAX_SLUG_LENGTH = 40;

/**
 * Turns client name into a URL-safe slug (lowercase, hyphens, no diacritics).
 * Used as the readable part of the upload link.
 */
export function slugFromName(name: string): string {
  let s = name.trim();
  if (!s) return "client";

  for (const [dia, ascii] of Object.entries(DIACRITICS)) {
    s = s.replace(new RegExp(dia, "g"), ascii);
  }
  s = s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!s) return "client";
  return s.slice(0, MAX_SLUG_LENGTH);
}

/**
 * Generates the unique upload token: slug(name) + "-" + random suffix.
 * - Readable (e.g. ion-popescu)
 * - Secure (12-char random part is unguessable)
 * - Unique (random part avoids collisions for same-name clients)
 */
export function generateUploadToken(name: string): string {
  const slug = slugFromName(name);
  const suffix = secureSuffix();
  return `${slug}-${suffix}`;
}
