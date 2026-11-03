"use client";

import type { LucideIcon } from "lucide-react";

const headerButton =
  "group relative inline-flex h-full shrink-0 items-center justify-center gap-1.5 px-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:px-3";

export function HeaderButton({
  label,
  icon: Icon,
  onClick,
  active,
  danger = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const tone = danger
    ? "text-danger"
    : active
      ? "text-ink"
      : "text-ink-muted hover:text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-expanded={active}
      className={`${headerButton} ${tone}`}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${
          active
            ? "text-primary"
            : danger
              ? "text-danger"
              : "text-ink-subtle group-hover:text-ink"
        }`}
      />
      <span className="hidden xl:inline">{label}</span>
      <span
        aria-hidden="true"
        className={`absolute inset-x-2 bottom-0 h-0.5 transition-opacity ${
          active
            ? "bg-primary opacity-100"
            : "bg-ink-subtle opacity-0 group-hover:opacity-40"
        }`}
      />
    </button>
  );
}

export function MobileAction({
  label,
  icon: Icon,
  onClick,
  active,
  danger = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`flex min-h-12 w-full items-center gap-3 px-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${
        danger
          ? "text-danger hover:bg-primary-soft/50"
          : active
            ? "bg-primary-soft/60 text-primary"
            : "text-ink-muted hover:bg-surface-warm hover:text-ink"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="font-mono text-[8px] tracking-[0.16em] text-ink-subtle">
        {active ? "ACTIVE" : "→"}
      </span>
    </button>
  );
}
