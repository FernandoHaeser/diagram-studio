export const exportMenuStyles = {
  root: 'relative',
  panel: 'absolute right-0 top-10 z-30 w-64 rounded-lg border border-rule-solid bg-surface p-3',
  title: 'mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted',
  row: 'mb-2 flex items-center gap-2',
  label: 'w-16 shrink-0 text-[12px] text-muted',
  divider: 'my-3 h-px bg-rule',
  stack: 'flex flex-col gap-1.5',
} as const;
