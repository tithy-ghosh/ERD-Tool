import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export default function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface-subtle px-1.5 font-sans text-[10px] font-medium text-ink-muted",
        className
      )}
    >
      {children}
    </kbd>
  );
}
