"use client";

import { useEffect, useRef, useState } from "react";
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
type CropRect = { x: number; y: number; w: number; h: number };

const FILE_ACCEPT =
  "application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,text/plain,.txt";

function isImageFile(file: File): boolean {
  if ((file.type || "").toLowerCase().startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "heif", "tif", "tiff", "jfif"].includes(ext);
}

async function buildScanPreviewDataUrl(file: File): Promise<string | null> {
  if (!isImageFile(file)) return null;
  try {
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/upload/preview-scan", { method: "POST", body: formData });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("reader failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function rotateDataUrl90(dataUrl: string): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

async function applyTransformsToFile(
  file: File,
  rotation: 0 | 90 | 180 | 270,
  cropRect: CropRect | null
): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const sw = bitmap.width;
    const sh = bitmap.height;
    const isSwapped = rotation === 90 || rotation === 270;
    const cw = isSwapped ? sh : sw;
    const ch = isSwapped ? sw : sh;

    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = cw;
    rotCanvas.height = ch;
    const rCtx = rotCanvas.getContext("2d");
    if (!rCtx) return null;
    rCtx.translate(cw / 2, ch / 2);
    rCtx.rotate((rotation * Math.PI) / 180);
    rCtx.drawImage(bitmap, -sw / 2, -sh / 2);

    let finalCanvas = rotCanvas;
    if (cropRect) {
      const cx = Math.max(0, Math.round(cropRect.x * cw));
      const cy = Math.max(0, Math.round(cropRect.y * ch));
      const crw = Math.max(1, Math.min(Math.round(cropRect.w * cw), cw - cx));
      const crh = Math.max(1, Math.min(Math.round(cropRect.h * ch), ch - cy));
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = crw;
      cropCanvas.height = crh;
      const cCtx = cropCanvas.getContext("2d");
      if (!cCtx) return null;
      cCtx.drawImage(rotCanvas, cx, cy, crw, crh, 0, 0, crw, crh);
      finalCanvas = cropCanvas;
    }

    return await new Promise<File | null>((resolve) => {
      finalCanvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : null),
        "image/jpeg",
        0.95
      );
    });
  } catch {
    return null;
  }
}

const DEFAULT_CROP: CropRect = { x: 0.05, y: 0.05, w: 0.90, h: 0.90 };
const MIN_CROP = 0.08;

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
  const [scanProcessing, setScanProcessing] = useState(false);

  // rotate + crop state
  const [displayPreviewUrl, setDisplayPreviewUrl] = useState<string | null>(null);
  const [scanRotation, setScanRotation] = useState<0 | 90 | 180 | 270>(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect>(DEFAULT_CROP);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropDragRef = useRef<{
    handle: "move" | "tl" | "tr" | "bl" | "br";
    startX: number;
    startY: number;
    startRect: CropRect;
    renderW: number;
    renderH: number;
  } | null>(null);

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

  // ── Image render rect (accounts for object-contain letterboxing) ────────────
  function getImgRenderSize(): { w: number; h: number } {
    const container = imgContainerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { w: 1, h: 1 };
    const nw = img.naturalWidth || 1;
    const nh = img.naturalHeight || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const aspect = nw / nh;
    const cAspect = cw / ch;
    if (aspect > cAspect) {
      return { w: cw, h: cw / aspect };
    } else {
      return { w: ch * aspect, h: ch };
    }
  }

  // ── Crop pointer handlers ────────────────────────────────────────────────────
  function onCropPointerDown(
    e: React.PointerEvent,
    handle: "move" | "tl" | "tr" | "bl" | "br"
  ) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const { w, h } = getImgRenderSize();
    cropDragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect },
      renderW: w,
      renderH: h,
    };
  }

  function onCropPointerMove(e: React.PointerEvent) {
    const drag = cropDragRef.current;
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.renderW;
    const dy = (e.clientY - drag.startY) / drag.renderH;
    const sr = drag.startRect;

    switch (drag.handle) {
      case "move":
        setCropRect({
          x: Math.max(0, Math.min(sr.x + dx, 1 - sr.w)),
          y: Math.max(0, Math.min(sr.y + dy, 1 - sr.h)),
          w: sr.w,
          h: sr.h,
        });
        break;
      case "tl":
        setCropRect({
          x: Math.max(0, Math.min(sr.x + dx, sr.x + sr.w - MIN_CROP)),
          y: Math.max(0, Math.min(sr.y + dy, sr.y + sr.h - MIN_CROP)),
          w: Math.max(MIN_CROP, sr.w - dx),
          h: Math.max(MIN_CROP, sr.h - dy),
        });
        break;
      case "tr":
        setCropRect({
          x: sr.x,
          y: Math.max(0, Math.min(sr.y + dy, sr.y + sr.h - MIN_CROP)),
          w: Math.max(MIN_CROP, Math.min(sr.w + dx, 1 - sr.x)),
          h: Math.max(MIN_CROP, sr.h - dy),
        });
        break;
      case "bl":
        setCropRect({
          x: Math.max(0, Math.min(sr.x + dx, sr.x + sr.w - MIN_CROP)),
          y: sr.y,
          w: Math.max(MIN_CROP, sr.w - dx),
          h: Math.max(MIN_CROP, Math.min(sr.h + dy, 1 - sr.y)),
        });
        break;
      case "br":
        setCropRect({
          x: sr.x,
          y: sr.y,
          w: Math.max(MIN_CROP, Math.min(sr.w + dx, 1 - sr.x)),
          h: Math.max(MIN_CROP, Math.min(sr.h + dy, 1 - sr.y)),
        });
        break;
    }
  }

  function onCropPointerUp() {
    cropDragRef.current = null;
  }

  // ── Scan review helpers ──────────────────────────────────────────────────────
  async function openScanReview(documentTypeId: string, file: File) {
    setError(null);
    setScanProcessing(true);
    const scanPreview = await buildScanPreviewDataUrl(file);
    setScanProcessing(false);
    if (!scanPreview) {
      const msg = "Nu am putut genera preview-ul scanării. Reîncearcă poza.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setScanRotation(0);
    setCropMode(false);
    setCropRect(DEFAULT_CROP);
    setDisplayPreviewUrl(scanPreview);
    setScanReview({ documentTypeId, file, previewUrl: scanPreview, fileName: file.name });
  }

  async function handleRotate() {
    if (!displayPreviewUrl) return;
    const rotated = await rotateDataUrl90(displayPreviewUrl);
    if (!rotated) return;
    setDisplayPreviewUrl(rotated);
    setScanRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270);
    setCropRect(DEFAULT_CROP);
  }

  function closeScanReview() {
    setScanReview(null);
    setDisplayPreviewUrl(null);
    setScanRotation(0);
    setCropMode(false);
    setCropRect(DEFAULT_CROP);
  }

  function retryScan() {
    if (!scanReview) return;
    const docId = scanReview.documentTypeId;
    closeScanReview();
    const input = document.getElementById(`scan-picker-${docId}`) as HTMLInputElement | null;
    if (input) {
      input.value = "";
      setTimeout(() => input.click(), 10);
    }
  }

  async function uploadDirectFile(documentTypeId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.set("token", token);
    formData.set("documentTypeId", documentTypeId);
    formData.set("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error ?? "Eroare la încărcare.";
      setError(msg);
      toast.error(msg);
      return false;
    }

    const savedName =
      typeof data?.fileName === "string" && data.fileName.length > 0 ? data.fileName : file.name;

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

    let fileToUpload = scanReview.file;
    if (scanRotation !== 0 || cropMode) {
      const transformed = await applyTransformsToFile(
        scanReview.file,
        scanRotation,
        cropMode ? cropRect : null
      );
      if (transformed) fileToUpload = transformed;
    }

    const ok = await uploadDirectFile(scanReview.documentTypeId, fileToUpload);
    setUploading(null);
    if (ok) closeScanReview();
  }

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
      const formData = new FormData();
      formData.set("token", token);
      formData.set("documentTypeId", documentTypeId);
      formData.set("file", item.file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? "Eroare la încărcare.";
        setError(msg);
        toast.error(msg);
        continue;
      }

      const savedName =
        typeof data?.fileName === "string" && data.fileName.length > 0 ? data.fileName : item.file.name;

      uploadedCount++;
      uploadedNames.push(savedName);
      successIds.add(item.id);
      setUploadedByType((prev) => ({
        ...prev,
        [documentTypeId]: [
          ...(prev[documentTypeId] ?? []),
          {
            id: String((data?.uploadId as string | undefined) ?? `${Date.now()}-${item.file.name}`),
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
      return { ...prev, [documentTypeId]: current.filter((item) => item.id !== pendingId) };
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
          <div key={dt.id} className="p-6 first:pt-6 last:pb-6">
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
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-md)] text-sm font-medium transition-colors ${
                  isUploading
                    ? "bg-[var(--paper-2)] text-[var(--ink-muted)] cursor-wait"
                    : "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
                }`}
              >
                Scanează
              </label>
              <button
                type="button"
                onClick={() =>
                  (document.getElementById(`file-picker-${dt.id}`) as HTMLInputElement | null)?.click()
                }
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--r-md)] text-sm font-medium transition-colors ${
                  isUploading
                    ? "bg-[var(--paper-2)] text-[var(--ink-muted)] cursor-wait"
                    : "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
                }`}
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
                    <li key={item.id} className="p-3 border border-[var(--paper-3)] rounded-[var(--r-sm)]">
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
                        <p className="text-xs text-[var(--ink-muted)]">
                          {item.source === "scan" ? "Scanare cameră" : "Fișier selectat"}
                          {item.isImage ? " · preview scan activ" : ""}
                        </p>
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
          <p className="text-sm text-[var(--terracotta)] font-medium">{error}</p>
        </div>
      )}
      {lastSuccess && !error && (
        <div className="px-6 pb-6">
          <p className="text-sm text-[var(--sage)] font-medium">{lastSuccess}</p>
        </div>
      )}

      {/* ── Full-screen lightbox ─────────────────────────────────────────────── */}
      {activePreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePreviewUrl(null)}
        >
          <div
            className="w-full max-w-4xl max-h-full flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ── Processing spinner ───────────────────────────────────────────────── */}
      {scanProcessing && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center gap-5"
          role="status"
          aria-label="Se procesează scanarea"
        >
          <span className="inline-block w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white text-base font-medium tracking-wide">Se procesează scanarea...</p>
        </div>
      )}

      {/* ── Scan review screen ───────────────────────────────────────────────── */}
      {scanReview && (
        <div
          className="fixed inset-0 z-[60] bg-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmare scanare"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <p className="text-white/70 text-xs truncate pr-2">{scanReview.fileName}</p>
            {cropMode && (
              <button
                type="button"
                onClick={() => { setCropMode(false); setCropRect(DEFAULT_CROP); }}
                className="text-xs text-white/60 underline shrink-0"
              >
                Anulează crop
              </button>
            )}
          </div>

          {/* Image + crop overlay */}
          <div className="flex-1 relative overflow-hidden" ref={imgContainerRef}>
            <img
              ref={imgRef}
              src={displayPreviewUrl ?? scanReview.previewUrl}
              alt={`Scanare ${scanReview.fileName}`}
              className="w-full h-full object-contain bg-white"
            />

            {cropMode && (
              <div
                className="absolute inset-0"
                style={{ touchAction: "none" }}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              >
                {/* Dark overlay — 4 sides */}
                <div className="absolute bg-black/55 left-0 right-0 top-0" style={{ height: `${cropRect.y * 100}%` }} />
                <div className="absolute bg-black/55 left-0 right-0 bottom-0" style={{ top: `${(cropRect.y + cropRect.h) * 100}%` }} />
                <div
                  className="absolute bg-black/55 left-0"
                  style={{ top: `${cropRect.y * 100}%`, height: `${cropRect.h * 100}%`, width: `${cropRect.x * 100}%` }}
                />
                <div
                  className="absolute bg-black/55 right-0"
                  style={{ top: `${cropRect.y * 100}%`, height: `${cropRect.h * 100}%`, left: `${(cropRect.x + cropRect.w) * 100}%` }}
                />

                {/* Crop rect — draggable center */}
                <div
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    left: `${cropRect.x * 100}%`,
                    top: `${cropRect.y * 100}%`,
                    width: `${cropRect.w * 100}%`,
                    height: `${cropRect.h * 100}%`,
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => onCropPointerDown(e, "move")}
                >
                  {/* Corner handles */}
                  {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                    <div
                      key={corner}
                      className="absolute w-8 h-8 bg-white rounded-sm"
                      style={{
                        top: corner.startsWith("t") ? -16 : undefined,
                        bottom: corner.startsWith("b") ? -16 : undefined,
                        left: corner.endsWith("l") ? -16 : undefined,
                        right: corner.endsWith("r") ? -16 : undefined,
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => onCropPointerDown(e, corner)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="px-6 pb-7 pt-3 shrink-0 flex items-center justify-between gap-4">
            {/* × retry */}
            <button
              type="button"
              onClick={retryScan}
              disabled={!!uploading}
              className="w-14 h-14 rounded-full border-2 border-white/70 text-white text-2xl font-bold flex items-center justify-center disabled:opacity-50"
              aria-label="Refă poza"
            >
              ×
            </button>

            {/* Center: rotate + crop */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleRotate()}
                disabled={!!uploading}
                className="h-11 px-4 rounded-full border border-white/50 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                aria-label="Rotește 90°"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                Rotește
              </button>
              <button
                type="button"
                onClick={() => setCropMode((v) => !v)}
                disabled={!!uploading}
                className={`h-11 px-4 rounded-full border text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 ${
                  cropMode
                    ? "bg-white text-black border-white"
                    : "border-white/50 text-white"
                }`}
                aria-label="Crop"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                  <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                </svg>
                Crop
              </button>
            </div>

            {/* ✓ confirm */}
            <button
              type="button"
              onClick={() => void confirmScanUpload()}
              disabled={!!uploading}
              className="w-14 h-14 rounded-full bg-[var(--sage)] text-white text-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60 min-w-[56px]"
              aria-label="Trimite scanarea"
            >
              {uploading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/90 border-t-transparent rounded-full animate-spin" />
              ) : (
                "✓"
              )}
            </button>
          </div>

          {/* Upload overlay */}
          {uploading && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-black/50 rounded-[var(--r-sm)] px-5 py-3 text-white text-sm inline-flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/90 border-t-transparent rounded-full animate-spin" />
                Încărcare în curs...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
