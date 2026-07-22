import type { UploadRow } from "./page";

export type ZipExportScope = "unprocessed" | "processed" | "selected" | "filtered";

export function filterUploadsByZipScope(
  uploads: UploadRow[],
  scope: ZipExportScope,
  selectedIds: Set<string>,
  isProcessed: (u: UploadRow) => boolean
): UploadRow[] {
  switch (scope) {
    case "unprocessed":
      return uploads.filter((u) => !isProcessed(u));
    case "processed":
      return uploads.filter((u) => isProcessed(u));
    case "selected":
      return uploads.filter((u) => selectedIds.has(u.id));
    default:
      return uploads;
  }
}

export function zipScopeSuffix(scope: ZipExportScope): string {
  switch (scope) {
    case "unprocessed":
      return "nelucrate";
    case "processed":
      return "lucrate";
    case "selected":
      return "selectate";
    default:
      return "";
  }
}
