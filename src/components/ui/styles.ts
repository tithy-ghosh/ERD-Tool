export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export const buttonBase =
  `inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;

export const buttonVariants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-subtle",
  ghost: "text-ink-muted hover:bg-surface-subtle hover:text-ink",
  soft: "bg-primary-soft text-primary hover:bg-blue-100",
  danger: "bg-danger text-white hover:bg-red-700",
  outlineDanger:
    "border border-danger/30 bg-surface text-danger hover:bg-danger-soft",
} as const;

export const buttonSizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 px-4 text-[13px]",
} as const;

export const iconButtonBase =
  `grid shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${focusRing}`;

export const iconButtonSizes = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-9 w-9",
} as const;

export const fieldClass =
  `h-9 w-full rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const textareaClass =
  `w-full resize-none rounded-md border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const labelClass = "text-xs font-medium text-ink-muted";

export const helperClass = "text-xs leading-relaxed text-ink-muted";

export const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-subtle";
