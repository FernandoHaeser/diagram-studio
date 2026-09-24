export const buttonStyles = {
  base: 'inline-flex items-center justify-center gap-2 rounded-md border px-3 h-8 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-link',
  variants: {
    primary: 'border-ink bg-ink text-paper hover:bg-muted hover:border-muted',
    secondary: 'border-rule-solid bg-surface text-ink hover:border-ink',
    ghost: 'border-transparent text-muted hover:bg-paper-2 hover:text-ink',
    danger: 'border-rule-solid bg-surface text-danger hover:border-danger',
  },
} as const;
