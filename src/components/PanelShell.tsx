"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

type Props = {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  onClose: () => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
};

export default function PanelShell({
  title,
  eyebrow,
  icon,
  onClose,
  toolbar,
  footer,
  bodyClassName = "min-h-0 flex-1 overflow-y-auto overscroll-contain",
  children,
}: Props) {
  return (
    <section
      aria-label={title}
      className="flex h-full min-h-0 flex-col bg-surface"
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3.5">
        {icon ? (
          <span className="shrink-0 text-ink-subtle">{icon}</span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[13px] font-semibold text-ink">
            {title}
          </h2>
          {eyebrow ? (
            <p className="truncate text-[10px] text-ink-muted">{eyebrow}</p>
          ) : null}
        </div>
        <IconButton
          icon={X}
          label={`Close ${title}`}
          size="sm"
          onClick={onClose}
          className="-mr-1"
        />
      </header>

      {toolbar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface-subtle px-3.5 py-2.5">
          {toolbar}
        </div>
      ) : null}

      <div className={bodyClassName}>{children}</div>

      {footer ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-3.5 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
