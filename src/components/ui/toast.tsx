"use client";

import { create } from "zustand";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "default" | "success" | "error";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: Tone;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastItem = ToastInput & { id: string };

type ToastState = {
  toasts: ToastItem[];
  push: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (input) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    set({ toasts: [...get().toasts.slice(-3), { ...input, id }] });
    window.setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((toastItem) => toastItem.id !== id) }),
}));

export function toast(input: ToastInput) {
  useToastStore.getState().push(input);
}

const toneStyles: Record<Tone, { icon: typeof Info; className: string }> = {
  default: { icon: Info, className: "text-primary" },
  success: { icon: CheckCircle2, className: "text-success" },
  error: { icon: AlertCircle, className: "text-danger" },
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((item) => {
        const tone = item.tone ?? "default";
        const Icon = toneStyles[tone].icon;

        return (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.4)] animate-sheet-in"
          >
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", toneStyles[tone].className)}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {item.description}
                </p>
              ) : null}
              {item.action ? (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                  className="mt-1.5 text-xs font-medium text-primary hover:text-primary-hover"
                >
                  {item.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-ink-subtle transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
