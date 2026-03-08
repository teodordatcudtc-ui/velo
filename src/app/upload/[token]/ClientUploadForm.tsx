"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type DocType = { id: string; name: string };

export function ClientUploadForm({
  clientId: _clientId,
  documentTypes,
  token,
  initialUploads = [],
}: {
  clientId: string;
  documentTypes: DocType[];
  token: string;
  initialUploads?: { documentTypeId: string; file_name: string }[];
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const toast = useToast();
  const [uploadedNames, setUploadedNames] = useState<Record<string, string>>(
    () => {
      const seen = new Set<string>();
      return Object.fromEntries(
        initialUploads
          .filter((u) => {
            if (seen.has(u.documentTypeId)) return false;
            seen.add(u.documentTypeId);
            return true;
          })
          .map((u) => [u.documentTypeId, u.file_name])
      );
    }
  );

  async function handleUpload(documentTypeId: string, file: File) {
    setError(null);
    setLastSuccess(null);
    setUploading(documentTypeId);

    const formData = new FormData();
    formData.set("token", token);
    formData.set("documentTypeId", documentTypeId);
    formData.set("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    setUploading(null);

    if (!res.ok) {
      const msg = data.error ?? "Eroare la încărcare.";
      setError(msg);
      toast.error(msg);
      return;
    }
    toast.success(`„${file.name}" a fost încărcat.`);
    setLastSuccess(file.name);
    setUploadedNames((prev) => ({ ...prev, [documentTypeId]: file.name }));
  }

  return (
    <div className="divide-y divide-[var(--paper-3)]">
      {documentTypes.map((dt) => {
        const isUploading = uploading === dt.id;
        const uploadedName = uploadedNames[dt.id];
        return (
          <div
            key={dt.id}
            className="p-6 first:pt-6 last:pb-6"
          >
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="font-semibold text-[var(--ink)]">{dt.name}</span>
              {uploadedName && (
                <span className="text-sm text-[var(--sage)] font-medium">
                  ✓ {uploadedName}
                </span>
              )}
            </div>
            <label className="flex items-center gap-3 flex-wrap cursor-pointer">
              <input
                type="file"
                accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,text/plain,.txt"
                className="sr-only"
                disabled={!!uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(dt.id, file);
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
                PDF, imagine sau document. Pe telefon: alege «Fișiere» sau «Browse» dacă nu vezi PDF.
              </span>
            </label>
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
            „{lastSuccess}" a fost încărcat cu succes.
          </p>
        </div>
      )}
    </div>
  );
}
