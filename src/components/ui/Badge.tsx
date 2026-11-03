import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "pk" | "fk";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-surface-subtle text-ink-muted",
  primary: "border-primary/20 bg-primary-soft text-primary",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
  pk: "border-pk/20 bg-pk-soft text-pk",
  fk: "border-fk/20 bg-fk-soft text-fk",
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

export default function Badge({ children, tone = "neutral", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium leading-none",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
