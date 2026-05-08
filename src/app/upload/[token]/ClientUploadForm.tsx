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
    const threshold = clamp(mean + 10, 150, 205);

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0);
      const contrast = clamp((gray - mean) * 1.35 + 172, 0, 255);
      const finalGray = contrast > threshold ? 252 : clamp(contrast * 0.42, 0, 145);
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
                multiple
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length > 0) void queueFilesForPreview(dt.id, files, "scan");
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
              <span
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
              </span>
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
                <ul className="space-y-3">
                  {pendingList.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 p-2 border border-[var(--paper-3)] rounded-[var(--r-sm)]"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {item.scanPreviewUrl ? (
                          <img
                            src={item.scanPreviewUrl}
                            alt={`Preview scan ${item.file.name}`}
                            className="w-24 h-32 object-cover rounded-[var(--r-sm)] border border-[var(--paper-3)] shrink-0 bg-white"
                          />
                        ) : item.originalPreviewUrl ? (
                          <img
                            src={item.originalPreviewUrl}
                            alt={`Preview ${item.file.name}`}
                            className="w-24 h-32 object-cover rounded-[var(--r-sm)] border border-[var(--paper-3)] shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-24 h-32 rounded-[var(--r-sm)] border border-[var(--paper-3)] bg-[var(--paper-2)] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--ink)] font-medium truncate">{item.file.name}</p>
                          <p className="text-xs text-[var(--ink-muted)] mt-1">
                            {item.source === "scan" ? "Scanare cameră" : "Fișier selectat"}
                            {item.isImage ? " · preview scan activ" : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => removePendingItem(dt.id, item.id)}
                        className="text-[var(--terracotta)] hover:underline text-sm disabled:opacity-50 shrink-0"
                      >
                        Șterge
                      </button>
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
    </div>
  );
}
