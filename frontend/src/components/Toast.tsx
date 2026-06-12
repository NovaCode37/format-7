"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "@/lib/icons";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string; duration: number };

type Ctx = {
  show: (message: string, kind?: ToastKind, durationMs?: number) => void;
  success: (msg: string, ms?: number) => void;
  error: (msg: string, ms?: number) => void;
  info: (msg: string, ms?: number) => void;
};

const ToastContext = createContext<Ctx | null>(null);

const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
};

const TONES: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error:   "border-red-200 bg-red-50 text-red-900",
  info:    "border-ink-200 bg-white text-ink-900",
};

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, kind: ToastKind = "info", durationMs = 3500) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, kind, message, duration: durationMs }]);
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const ctx: Ctx = {
    show,
    success: (m, ms) => show(m, "success", ms),
    error:   (m, ms) => show(m, "error", ms),
    info:    (m, ms) => show(m, "info", ms),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto rounded-md border ${TONES[t.kind]} shadow-elev px-4 py-3 flex items-start gap-3`}
            >
              <Icon size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
              <p className="flex-1 text-[13px] leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                aria-label="Закрыть"
                className="shrink-0 -mr-1 -mt-0.5 p-1 rounded hover:bg-black/5 cursor-pointer"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: (m) => { if (typeof window !== "undefined") console.warn("[toast]", m); },
      success: (m) => { if (typeof window !== "undefined") console.warn("[toast]", m); },
      error:   (m) => { if (typeof window !== "undefined") console.warn("[toast]", m); },
      info:    (m) => { if (typeof window !== "undefined") console.warn("[toast]", m); },
    };
  }
  return ctx;
}
