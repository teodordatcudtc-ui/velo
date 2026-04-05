import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

/** Secțiune pliabilă pentru pagini legale (acordeon nativ, fără JS suplimentar). */
export function LegalSection({ title, children, defaultOpen }: Props) {
  return (
    <details
      className="legal-details group rounded-xl border border-[var(--paper-3)] bg-white/70 shadow-sm open:shadow-md transition-shadow"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-base font-semibold text-[var(--ink)] hover:bg-[var(--sage-xlight)]/35 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span
          className="shrink-0 text-[var(--sage)] transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="space-y-3 border-t border-[var(--paper-3)] px-4 pb-4 pt-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
        {children}
      </div>
    </details>
  );
}
