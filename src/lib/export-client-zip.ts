import JSZip from "jszip";

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
};

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
    const folder = sanitizeZipFilePart(clientName);
    const baseName = sanitizeZipFilePart(up.file_name || "document");
    let filePath = `${folder}/${baseName}`;
    let inc = 1;
    while (usedPaths.has(filePath)) {
      filePath = `${folder}/${baseName}-${inc}`;
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
