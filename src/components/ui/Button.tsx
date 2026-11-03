import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
} from "@/components/ui/styles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
};

export default function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  type = "button",
  ...props
}: Props) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    >
      {Icon ? <Icon className={cn(iconSize, "shrink-0")} aria-hidden="true" /> : null}
      {children}
      {IconRight ? (
        <IconRight className={cn(iconSize, "shrink-0")} aria-hidden="true" />
      ) : null}
    </button>
  );
}
