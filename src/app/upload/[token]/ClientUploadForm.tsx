"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type DocType = { id: string; name: string };
type UploadItem = { id: string; file_name: string };

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

  async function handleUpload(documentTypeId: string, files: File[]) {
    setError(null);
    setLastSuccess(null);
    setUploading(documentTypeId);
    let uploadedCount = 0;
    const uploadedNames: string[] = [];

    for (const file of files) {
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
            <label className="flex items-center gap-3 flex-wrap cursor-pointer">
              <input
                type="file"
                multiple
                accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,text/plain,.txt"
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length > 0) handleUpload(dt.id, files);
                  e.target.value = "";
                }}
              />
              <span
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
                PDF, documente Office sau imagini — pozele sunt convertite automat la PDF (A4), ușor de folosit în contabilitate. Pe telefon: «Fișiere» / «Browse» dacă nu vezi lista.
              </span>
            </label>
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
