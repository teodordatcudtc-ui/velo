"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type DocType = { id: string; name: string };
type UploadItem = { id: string; file_name: string };
type PendingUpload = {
  id: string;
  file: File;
  source: "scan" | "file";
  originalPreviewUrl: string | null;
  scanPreviewUrl: string | null;
  isImage: boolean;
};
type ScanReview = {
  documentTypeId: string;
  file: File;
  previewUrl: string;
  fileName: string;
};

const FILE_ACCEPT =
  "application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,text/plain,.txt";

function isImageFile(file: File): boolean {
  if ((file.type || "").toLowerCase().startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif", "tif", "tiff", "jfif"].includes(ext);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function buildScanPreviewDataUrl(file: File): Promise<string | null> {
  if (!isImageFile(file)) return null;
  try {
    const objectUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });

    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      return null;
    }

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0);
      sum += gray;
    }
    const pixelCount = Math.max(data.length / 4, 1);
    const mean = sum / pixelCount;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0);
      const finalGray = clamp((gray - mean) * 1.12 + 188, 0, 255);
      const out = Math.round(finalGray);
      data[i] = out;
      data[i + 1] = out;
      data[i + 2] = out;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    const result = canvas.toDataURL("image/jpeg", 0.9);
    URL.revokeObjectURL(objectUrl);
    return result;
  } catch {
    return null;
  }
}

export function ClientUploadForm({
  clientId: _clientId,
  documentTypes,
  token,
  initialUploads = [],
}: {
  clientId: string;
  documentTypes: DocType[];
  token: string;
  initialUploads?: { id: string; documentTypeId: string; file_name: string }[];
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [pendingByType, setPendingByType] = useState<Record<string, PendingUpload[]>>({});
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewLabel, setActivePreviewLabel] = useState<string>("");
  const [scanReview, setScanReview] = useState<ScanReview | null>(null);
  const toast = useToast();
  const [uploadedByType, setUploadedByType] = useState<Record<string, UploadItem[]>>(
    () => {
      const grouped: Record<string, UploadItem[]> = {};
      for (const u of initialUploads) {
        if (!grouped[u.documentTypeId]) grouped[u.documentTypeId] = [];
        grouped[u.documentTypeId].push({ id: u.id, file_name: u.file_name });
      }
      return grouped;
    }
  );

  useEffect(() => {
    return () => {
      for (const list of Object.values(pendingByType)) {
        for (const item of list) {
          if (item.originalPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.originalPreviewUrl);
        }
      }
    };
  }, [pendingByType]);

  async function queueFilesForPreview(documentTypeId: string, files: File[], source: "scan" | "file") {
    if (files.length === 0) return;
    const pendingItems = await Promise.all(
      files.map(async (file) => {
        const image = isImageFile(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          file,
          source,
          isImage: image,
          originalPreviewUrl: image ? URL.createObjectURL(file) : null,
          scanPreviewUrl: image ? await buildScanPreviewDataUrl(file) : null,
        } satisfies PendingUpload;
      })
    );

    setPendingByType((prev) => ({
      ...prev,
      [documentTypeId]: [...(prev[documentTypeId] ?? []), ...pendingItems],
    }));
  }

  async function openScanReview(documentTypeId: string, file: File) {
    setError(null);
    const scanPreview = await buildScanPreviewDataUrl(file);
    if (!scanPreview) {
      const msg = "Nu am putut genera preview-ul scanării. Reîncearcă poza.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setScanReview({
      documentTypeId,
      file,
      previewUrl: scanPreview,
      fileName: file.name,
    });
  }

  async function uploadDirectFile(documentTypeId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.set("token", token);
    formData.set("documentTypeId", documentTypeId);
    formData.set("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error ?? "Eroare la încărcare.";
      setError(msg);
      toast.error(msg);
      return false;
    }

    const savedName =
      typeof data?.fileName === "string" && data.fileName.length > 0
        ? data.fileName
        : file.name;

    setUploadedByType((prev) => ({
      ...prev,
      [documentTypeId]: [
        ...(prev[documentTypeId] ?? []),
        {
          id: String((data?.uploadId as string | undefined) ?? `${Date.now()}-${file.name}`),
          file_name: savedName,
        },
      ],
    }));

    toast.success(`„${savedName}" a fost încărcat.`);
    setLastSuccess(`„${savedName}" a fost încărcat.`);
    return true;
  }

  async function confirmScanUpload() {
    if (!scanReview) return;
    setUploading(scanReview.documentTypeId);
    setError(null);
    setLastSuccess(null);
    const ok = await uploadDirectFile(scanReview.documentTypeId, scanReview.file);
    setUploading(null);
    if (ok) setScanReview(null);
  }

  function retryScan() {
    if (!scanReview) return;
    const docId = scanReview.documentTypeId;
    setScanReview(null);
    const input = document.getElementById(`scan-picker-${docId}`) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      setTimeout(() => input.click(), 10);
    }
  }

  async function uploadPending(documentTypeId: string) {
    const pendingItems = pendingByType[documentTypeId] ?? [];
    if (pendingItems.length === 0) return;

    setError(null);
    setLastSuccess(null);
    setUploading(documentTypeId);
    let uploadedCount = 0;
    const uploadedNames: string[] = [];
    const successIds = new Set<string>();

    for (const item of pendingItems) {
      const file = item.file;
      const formData = new FormData();
      formData.set("token", token);
      formData.set("documentTypeId", documentTypeId);
      formData.set("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? "Eroare la încărcare.";
        setError(msg);
        toast.error(msg);
        continue;
      }

      const savedName =
        typeof data?.fileName === "string" && data.fileName.length > 0
          ? data.fileName
          : file.name;

      uploadedCount++;
      uploadedNames.push(savedName);
      successIds.add(item.id);
      setUploadedByType((prev) => ({
        ...prev,
        [documentTypeId]: [
          ...(prev[documentTypeId] ?? []),
          {
            id: String((data?.uploadId as string | undefined) ?? `${Date.now()}-${file.name}`),
            file_name: savedName,
          },
        ],
      }));
    }

    if (successIds.size > 0) {
      setPendingByType((prev) => {
        const current = prev[documentTypeId] ?? [];
        const kept = current.filter((item) => !successIds.has(item.id));
        for (const item of current) {
          if (successIds.has(item.id) && item.originalPreviewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(item.originalPreviewUrl);
          }
        }
        return { ...prev, [documentTypeId]: kept };
      });
    }

    setUploading(null);
    if (uploadedCount > 0) {
      const msg =
        uploadedCount === 1
          ? `„${uploadedNames[0]}" a fost încărcat.`
          : `${uploadedCount} fișiere au fost încărcate.`;
      toast.success(msg);
      setLastSuccess(msg);
    }
  }

  function removePendingItem(documentTypeId: string, pendingId: string) {
    setPendingByType((prev) => {
      const current = prev[documentTypeId] ?? [];
      const target = current.find((item) => item.id === pendingId);
      if (target?.originalPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(target.originalPreviewUrl);
      return {
        ...prev,
        [documentTypeId]: current.filter((item) => item.id !== pendingId),
      };
    });
  }

  function clearPending(documentTypeId: string) {
    setPendingByType((prev) => {
      const current = prev[documentTypeId] ?? [];
      for (const item of current) {
        if (item.originalPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.originalPreviewUrl);
      }
      return { ...prev, [documentTypeId]: [] };
    });
  }

  async function handleDelete(uploadId: string, documentTypeId: string) {
    setError(null);
    setDeletingId(uploadId);
    const res = await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, uploadId }),
    });
    const data = await res.json().catch(() => ({}));
    setDeletingId(null);

    if (!res.ok) {
      const msg = data.error ?? "Nu am putut șterge fișierul.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setUploadedByType((prev) => ({
      ...prev,
      [documentTypeId]: (prev[documentTypeId] ?? []).filter((u) => u.id !== uploadId),
    }));
    toast.success("Fișier șters.");
  }

  return (
    <div className="divide-y divide-[var(--paper-3)]">
      {documentTypes.map((dt) => {
        const isUploading = uploading === dt.id;
        const uploadedList = uploadedByType[dt.id] ?? [];
        const pendingList = pendingByType[dt.id] ?? [];
        return (
          <div
            key={dt.id}
            className="p-6 first:pt-6 last:pb-6"
          >
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="font-semibold text-[var(--ink)]">{dt.name}</span>
              {uploadedList.length > 0 && (
                <span className="text-sm text-[var(--sage)] font-medium">
                  ✓ {uploadedList.length} fișier{uploadedList.length === 1 ? "" : "e"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                id={`file-picker-${dt.id}`}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length > 0) void queueFilesForPreview(dt.id, files, "file");
                  e.target.value = "";
                }}
              />
              <input
                id={`scan-picker-${dt.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files[0]) void openScanReview(dt.id, files[0]);
                  e.target.value = "";
                }}
              />
              <label
                htmlFor={`scan-picker-${dt.id}`}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-md)] text-sm font-medium
                  transition-colors
                  ${isUploading
                    ? "bg-[var(--paper-2)] text-[var(--ink-muted)] cursor-wait"
                    : "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
                  }
                `}
              >
                Scanează
              </label>
              <button
                type="button"
                onClick={() => (document.getElementById(`file-picker-${dt.id}`) as HTMLInputElement | null)?.click()}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-md)] text-sm font-medium
                  transition-colors
                  ${isUploading
                    ? "bg-[var(--paper-2)] text-[var(--ink-muted)] cursor-wait"
                    : "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
                  }
                `}
              >
                {isUploading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[var(--ink-muted)] border-t-transparent rounded-full animate-spin" />
                    Se încarcă...
                  </>
                ) : (
                  "Alege fișier"
                )}
              </button>
              <span className="text-sm text-[var(--ink-muted)]">
                PDF, Office sau imagini (convertite automat în PDF). Pe telefon: «Fișiere» / «Browse».
              </span>
            </div>
            {pendingList.length > 0 && (
              <div className="mt-4 border border-[var(--paper-3)] rounded-[var(--r-md)] p-3 bg-[var(--paper)]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    Preview înainte de upload ({pendingList.length})
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => void uploadPending(dt.id)}
                      className="inline-flex items-center px-3 py-1.5 rounded-[var(--r-sm)] text-sm font-medium bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)] disabled:opacity-60"
                    >
                      {isUploading ? "Se încarcă..." : "Upload"}
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => clearPending(dt.id)}
                      className="inline-flex items-center px-3 py-1.5 rounded-[var(--r-sm)] text-sm font-medium border border-[var(--paper-3)] text-[var(--ink-muted)] hover:bg-[var(--paper-2)] disabled:opacity-60"
                    >
                      Renunță
                    </button>
                  </div>
                </div>
                <ul className="space-y-4">
                  {pendingList.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 border border-[var(--paper-3)] rounded-[var(--r-sm)]"
                    >
                      <div className="space-y-3">
                        <div className="min-w-0 flex items-center justify-between gap-3">
                          <p className="text-sm text-[var(--ink)] font-medium truncate">{item.file.name}</p>
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => removePendingItem(dt.id, item.id)}
                            className="text-[var(--terracotta)] hover:underline text-sm disabled:opacity-50 shrink-0"
                          >
                            Șterge
                          </button>
                        </div>
                        {item.scanPreviewUrl ? (
                          <button
                            type="button"
                            className="block w-full"
                            onClick={() => {
                              setActivePreviewUrl(item.scanPreviewUrl);
                              setActivePreviewLabel(item.file.name);
                            }}
                          >
                            <img
                              src={item.scanPreviewUrl}
                              alt={`Preview scan ${item.file.name}`}
                              className="w-full max-h-[72vh] object-contain rounded-[var(--r-sm)] border border-[var(--paper-3)] bg-white"
                            />
                          </button>
                        ) : item.originalPreviewUrl ? (
                          <button
                            type="button"
                            className="block w-full"
                            onClick={() => {
                              setActivePreviewUrl(item.originalPreviewUrl);
                              setActivePreviewLabel(item.file.name);
                            }}
                          >
                            <img
                              src={item.originalPreviewUrl}
                              alt={`Preview ${item.file.name}`}
                              className="w-full max-h-[72vh] object-contain rounded-[var(--r-sm)] border border-[var(--paper-3)] bg-white"
                            />
                          </button>
                        ) : (
                          <div className="w-full h-48 rounded-[var(--r-sm)] border border-[var(--paper-3)] bg-[var(--paper-2)]" />
                        )}
                        <div>
                          <p className="text-xs text-[var(--ink-muted)] mt-1">
                            {item.source === "scan" ? "Scanare cameră" : "Fișier selectat"}
                            {item.isImage ? " · preview scan activ" : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadedList.length > 0 && (
              <ul className="mt-3 space-y-2">
                {uploadedList.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 text-sm bg-[var(--paper)] border border-[var(--paper-3)] rounded-[var(--r-md)] px-3 py-2"
                  >
                    <span className="text-[var(--ink)] truncate">{u.file_name}</span>
                    <button
                      type="button"
                      disabled={deletingId === u.id}
                      onClick={() => handleDelete(u.id, dt.id)}
                      className="text-[var(--terracotta)] hover:underline disabled:opacity-50 shrink-0"
                    >
                      {deletingId === u.id ? "Se șterge..." : "Șterge"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {error && (
        <div className="px-6 pb-6">
          <p className="text-sm text-[var(--terracotta)] font-medium">
            {error}
          </p>
        </div>
      )}
      {lastSuccess && !error && (
        <div className="px-6 pb-6">
          <p className="text-sm text-[var(--sage)] font-medium">
            {lastSuccess}
          </p>
        </div>
      )}
      {activePreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Preview scan"
          onClick={() => setActivePreviewUrl(null)}
        >
          <div className="w-full max-w-4xl max-h-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <p className="text-sm truncate pr-3">{activePreviewLabel}</p>
              <button
                type="button"
                onClick={() => setActivePreviewUrl(null)}
                className="text-sm px-3 py-1 rounded bg-white/15 hover:bg-white/25"
              >
                Închide
              </button>
            </div>
            <img
              src={activePreviewUrl}
              alt={`Preview ${activePreviewLabel}`}
              className="w-full h-auto max-h-[86vh] object-contain rounded-[var(--r-sm)] bg-white"
            />
          </div>
        </div>
      )}
      {scanReview && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmare scanare"
        >
          <div className="px-4 py-3 text-white text-sm truncate">{scanReview.fileName}</div>
          <div className="flex-1 px-2 pb-2">
            <img
              src={scanReview.previewUrl}
              alt={`Scanare ${scanReview.fileName}`}
              className="w-full h-full object-contain bg-white rounded-[var(--r-sm)]"
            />
          </div>
          <div className="px-4 pb-5 pt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={retryScan}
              disabled={!!uploading}
              className="w-14 h-14 rounded-full border-2 border-white/80 text-white text-2xl font-bold disabled:opacity-60"
              aria-label="Refă poza"
              title="Refă poza"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => void confirmScanUpload()}
              disabled={!!uploading}
              className="w-14 h-14 rounded-full bg-[var(--sage)] text-white text-2xl font-bold disabled:opacity-60"
              aria-label="Trimite scanarea"
              title="Trimite scanarea"
            >
              ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
