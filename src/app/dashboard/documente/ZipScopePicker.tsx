"use client";

import type { ZipExportScope } from "./zip-export-scope";

type ScopeOption = {
  value: ZipExportScope;
  label: string;
  description: string;
  count: number;
  disabled?: boolean;
};

export function ZipScopePicker({
  value,
  onChange,
  options,
  disabled,
}: {
  value: ZipExportScope;
  onChange: (scope: ZipExportScope) => void;
  options: ScopeOption[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Ce documente incluzi în ZIP">
      {options.map((opt) => {
        const selected = value === opt.value;
        const isDisabled = disabled || opt.disabled || opt.count === 0;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={isDisabled}
            onClick={() => onChange(opt.value)}
            className="w-full text-left transition disabled:opacity-45 disabled:cursor-not-allowed"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: selected
                ? "2px solid var(--sage)"
                : "1.5px solid var(--paper-3)",
              background: selected ? "var(--sage-xlight)" : "#fff",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: selected ? "var(--sage)" : "var(--ink)" }}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-[var(--ink-muted)] mt-0.5">
                  {opt.description}
                </div>
              </div>
              <span
                className="shrink-0 text-xs font-bold tabular-nums px-2 py-1 rounded-full"
                style={{
                  background: selected ? "var(--sage)" : "var(--paper-2)",
                  color: selected ? "#fff" : "var(--ink-muted)",
                }}
              >
                {opt.count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
