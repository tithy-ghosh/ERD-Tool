import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  iconButtonBase,
  iconButtonSizes,
} from "@/components/ui/styles";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  label: string;
  size?: keyof typeof iconButtonSizes;
  tone?: "default" | "danger" | "primary";
};

export default function IconButton({
  icon: Icon,
  label,
  size = "md",
  tone = "default",
  className,
  type = "button",
  ...props
}: Props) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4";

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        iconButtonBase,
        iconButtonSizes[size],
        tone === "danger" && "text-danger hover:bg-danger-soft hover:text-danger",
        tone === "primary" && "text-primary hover:bg-primary-soft hover:text-primary",
        className
      )}
      {...props}
    >
      <Icon className={cn(iconSize, "shrink-0")} aria-hidden="true" />
    </button>
  );
}
