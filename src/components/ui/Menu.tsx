"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import IconButton from "@/components/ui/IconButton";

export type MenuItem =
  | {
      label: string;
      icon?: LucideIcon;
      onClick: () => void;
      danger?: boolean;
      disabled?: boolean;
      badge?: string;
      shortcut?: string;
    }
  | { separator: true };

type Props = {
  label: string;
  items: MenuItem[];
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  align?: "start" | "end";
  buttonClassName?: string;
  tone?: "default" | "danger" | "primary";
};

const MENU_WIDTH = 208;

export default function MenuButton({
  label,
  items,
  icon = MoreHorizontal,
  size = "md",
  align = "end",
  buttonClassName,
  tone = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left =
      align === "end"
        ? Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
        : Math.max(8, rect.left);
    setPosition({ top: rect.bottom + 6, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    const timer = window.setTimeout(() => {
      menuRef.current
        ?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')
        ?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        <IconButton
          icon={icon}
          label={label}
          size={size}
          tone={tone}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openMenu())}
          className={buttonClassName}
        />
      </div>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
              className="fixed z-[80] rounded-lg border border-line bg-surface p-1 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] animate-soft-fade"
            >
              {items.map((item, index) =>
                "separator" in item ? (
                  <div
                    key={`separator-${index}`}
                    className="my-1 h-px bg-line"
                    role="separator"
                  />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                    className={cn(
                      "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:bg-surface-subtle disabled:pointer-events-none disabled:opacity-40",
                      item.danger
                        ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft"
                        : "text-ink hover:bg-surface-subtle focus-visible:bg-surface-subtle"
                    )}
                  >
                    {item.icon ? (
                      <item.icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          item.danger ? "text-danger" : "text-ink-subtle"
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 text-[9px] font-medium text-ink-subtle">
                        {item.badge}
                      </span>
                    ) : null}
                    {item.shortcut ? (
                      <span className="text-[10px] text-ink-subtle">
                        {item.shortcut}
                      </span>
                    ) : null}
                  </button>
                )
              )}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export type MenuTriggerRef = RefObject<HTMLDivElement | null>;
