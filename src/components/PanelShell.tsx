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
      <header className="flex shrink-0 items-start gap-2.5 border-b border-line px-4 py-3 md:px-5">
        {icon ? (
          <span className="mt-0.5 shrink-0 text-ink-subtle">{icon}</span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-semibold text-ink">
            {title}
          </h2>
          {eyebrow ? (
            <p className="mt-0.5 truncate text-xs text-ink-muted">{eyebrow}</p>
          ) : null}
        </div>
        <IconButton
          icon={X}
          label={`Close ${title}`}
          size="sm"
          onClick={onClose}
          className="-mr-1 -mt-0.5"
        />
      </header>

      {toolbar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-surface-subtle px-4 py-2.5 md:px-5">
          {toolbar}
        </div>
      ) : null}

      <div className={bodyClassName}>{children}</div>

      {footer ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface px-4 py-3 md:px-5">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
