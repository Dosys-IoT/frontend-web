"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 4000;

const TONE_META: Record<
  ToastTone,
  { icon: typeof Info; accent: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-l-[var(--color-sanctuary-500)]",
    iconColor: "text-[var(--color-sanctuary-600)]",
  },
  error: {
    icon: XCircle,
    accent: "border-l-[var(--color-danger-500)]",
    iconColor: "text-[var(--color-danger-600)]",
  },
  info: {
    icon: Info,
    accent: "border-l-[var(--color-ink-200)]",
    iconColor: "text-[var(--color-ink-500)]",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = ++idRef.current;
    setToasts((curr) => [...curr, { id, tone, message }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const api: ToastApi = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2.5">
            {toasts.map((t) => {
              const meta = TONE_META[t.tone];
              const Icon = meta.icon;
              return (
                <div
                  key={t.id}
                  role="status"
                  className={cn(
                    "toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-l-4 border-[var(--color-ink-50)]/60 bg-white px-4 py-3 shadow-[var(--shadow-card)]",
                    meta.accent
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", meta.iconColor)} />
                  <p className="flex-1 text-[13px] leading-snug text-[var(--color-ink-900)]">
                    {t.message}
                  </p>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="shrink-0 text-[var(--color-ink-400)] transition-colors hover:text-[var(--color-ink-900)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
