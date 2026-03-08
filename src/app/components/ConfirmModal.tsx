"use client";

import { useEffect } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmă",
  cancelLabel = "Anulare",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handle);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-[var(--r-lg)] bg-[var(--paper)] border border-[var(--paper-3)] shadow-[var(--shadow-xl)] p-6">
        <h2
          id="confirm-title"
          className="font-semibold text-[var(--ink)] text-lg mb-2"
        >
          {title}
        </h2>
        <p id="confirm-desc" className="text-[var(--ink-soft)] text-sm mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] border border-[var(--paper-3)] rounded-[var(--r-md)] hover:bg-[var(--paper-2)] transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 text-sm font-medium rounded-[var(--r-md)] transition disabled:opacity-50 ${
              isDanger
                ? "bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta)]/90"
                : "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
            }`}
          >
            {loading ? "Se procesează…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
