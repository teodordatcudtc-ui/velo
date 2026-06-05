import JSZip from "jszip";

const MONTH_FOLDER_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export function sanitizeZipFilePart(value: string): string {
  return (
    value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "fisier"
  );
}

export type ZipExportUpload = {
  id: string;
  client_id: string;
  file_name: string;
  month: number;
  year: number;
};

/** Subfolder lună în arhivă: `Iunie 2026`. */
export function zipMonthFolder(year: number, month: number): string {
  const name = MONTH_FOLDER_NAMES[month - 1] ?? `Luna-${month}`;
  return sanitizeZipFilePart(`${name} ${year}`);
}

export function zipPathForUpload(
  clientName: string,
  up: ZipExportUpload,
  duplicateIndex = 0
): string {
  const clientFolder = sanitizeZipFilePart(clientName);
  const monthFolder = zipMonthFolder(up.year, up.month);
  const baseName = sanitizeZipFilePart(up.file_name || "document");
  const fileName = duplicateIndex > 0 ? `${baseName}-${duplicateIndex}` : baseName;
  return `${clientFolder}/${monthFolder}/${fileName}`;
}

export async function buildClientDocumentsZip(
  uploads: ZipExportUpload[],
  clientNameById: Map<string, string>
): Promise<{ blob: Blob; exportedCount: number; failed: string[] }> {
  const zip = new JSZip();
  const usedPaths = new Set<string>();
  let exportedCount = 0;
  const failed: string[] = [];

  for (const up of uploads) {
    const clientName = clientNameById.get(up.client_id) ?? "Client";
    let filePath = zipPathForUpload(clientName, up);
    let inc = 1;
    while (usedPaths.has(filePath)) {
      filePath = zipPathForUpload(clientName, up, inc);
      inc++;
    }
    usedPaths.add(filePath);

    const res = await fetch(`/api/uploads/${up.id}?download=1`);
    if (!res.ok) {
      if (failed.length < 8) {
        failed.push(`${clientName}: ${up.file_name}`);
      }
      continue;
    }
    const blob = await res.blob();
    zip.file(filePath, blob);
    exportedCount++;
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { blob: zipBlob, exportedCount, failed };
}

export function downloadZipBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
