export const iconButtonStyles = {
  base: 'inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-link',
  active: 'bg-ink text-paper hover:bg-ink hover:text-paper',
  danger: 'hover:bg-danger-tint hover:text-danger',
} as const;
