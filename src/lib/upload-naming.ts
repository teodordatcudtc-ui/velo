const MONTHS_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
] as const;

/**
 * Convertește diacriticele românești + alte semne accentuate în ASCII.
 * Folosit pentru a genera nume de fișiere cross-platform safe.
 */
function removeDiacritics(str: string): string {
  return str
    .replace(/[ăĂ]/g, "a")
    .replace(/[âÂ]/g, "a")
    .replace(/[îÎ]/g, "i")
    .replace(/[șȘşŞ]/g, "s")
    .replace(/[țȚţŢ]/g, "t")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Transformă un șir liber într-un segment safe pentru nume de fișier:
 * elimină caractere speciale, colapsează spații la underscore, trunchiază.
 */
function toFileSlug(str: string, maxLen = 28): string {
  return removeDiacritics(str)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, maxLen)
    .replace(/[_-]+$/, "") || "Document";
}

/**
 * Construiește un nume de fișier semantic pentru un document încărcat de client.
 *
 * Format: `{Client}_{TipDocument}_{Luna}_{An}[_{N}].{ext}`
 *
 * Exemplu (prima încărcare): `Ionescu_Facturi_Aprilie_2026.pdf`
 * Exemplu (a doua încărcare): `Ionescu_Facturi_Aprilie_2026_2.pdf`
 *
 * @param existingCount  numărul de documente deja existente cu același
 *                       client / tip / lună / an — folosit pentru suffix.
 */
export function buildUploadFileName(params: {
  clientName: string;
  docTypeName: string;
  month: number;
  year: number;
  /** Extensie cu punct, ex. ".pdf", ".xlsx" */
  ext: string;
  /** Câte fișiere cu aceleași metadate există deja în DB (0 = prima încărcare) */
  existingCount: number;
}): string {
  const { clientName, docTypeName, month, year, ext, existingCount } = params;

  const clientPart = toFileSlug(clientName, 28);
  const docPart    = toFileSlug(docTypeName, 28);
  const monthPart  = MONTHS_RO[(month - 1) % 12];
  const suffix     = existingCount > 0 ? `_${existingCount + 1}` : "";

  return `${clientPart}_${docPart}_${monthPart}_${year}${suffix}${ext}`;
}

/** Extrage extensia unui fișier, cu punct: "foto.jpg" → ".jpg" */
export function fileExtension(fileName: string): string {
  const last = fileName.trim().split(".").pop()?.toLowerCase() ?? "";
  return last ? `.${last}` : "";
}
