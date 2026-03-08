"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 4200;
const MAX_TOASTS = 5;

function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function useToast() {
  return useToastContext();
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `toast-${idCounter}-${Date.now()}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const add = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId();
      const item: ToastItem = { id, type, message, createdAt: Date.now() };
      setToasts((prev) => {
        const next = [item, ...prev].slice(0, MAX_TOASTS);
        return next;
      });
      const t = setTimeout(() => remove(id), DISMISS_MS);
      timeoutsRef.current.set(id, t);
    },
    [remove]
  );

  const success = useCallback((message: string) => add("success", message), [add]);
  const error = useCallback((message: string) => add("error", message), [add]);
  const info = useCallback((message: string) => add("info", message), [add]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, success, error, info, remove }}
    >
      {children}
      <ToastList toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  );
}

function ToastList({
  toasts,
  remove,
}: {
  toasts: ToastItem[];
  remove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-[360px] w-full pointer-events-none"
      aria-live="polite"
      role="region"
      aria-label="Notificări"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const styles = {
    success: {
      bg: "bg-[var(--sage-xlight)]",
      border: "border-[var(--sage)]",
      icon: "✓",
      text: "text-[var(--sage-dark)]",
    },
    error: {
      bg: "bg-[var(--terra-light)]",
      border: "border-[var(--terracotta)]",
      icon: "!",
      text: "text-[var(--terracotta)]",
    },
    info: {
      bg: "bg-[var(--paper-2)]",
      border: "border-[var(--ink-muted)]",
      icon: "i",
      text: "text-[var(--ink)]",
    },
  };
  const s = styles[item.type];

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 rounded-[var(--r-md)] border px-4 py-3 shadow-[var(--shadow-md)] animate-toast-in
        ${s.bg} ${s.border}
      `}
      role="alert"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.text} ${item.type === "success" ? "bg-[var(--sage)] text-white" : item.type === "error" ? "bg-[var(--terracotta)] text-white" : "bg-[var(--ink-muted)] text-white"}`}
      >
        {item.type === "success" ? "✓" : item.type === "error" ? "!" : "i"}
      </span>
      <p className={`text-sm font-medium ${s.text} flex-1 min-w-0 pt-0.5`}>
        {item.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-[var(--ink-muted)] hover:bg-black/5 hover:text-[var(--ink)] transition"
        aria-label="Închide"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
