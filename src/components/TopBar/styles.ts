export const topBarStyles = {
  root: 'flex h-16 shrink-0 items-center justify-between gap-4 border-b border-rule bg-surface px-5',
  left: 'min-w-0 flex-1',
  eyebrow: 'font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted',
  name: 'block w-full truncate rounded-md border border-transparent bg-transparent px-1 -mx-1 font-serif text-2xl leading-8 text-ink hover:border-rule-solid focus:border-link focus:outline-none',
  right: 'flex shrink-0 items-center gap-1',
  sep: 'mx-2 h-5 w-px bg-rule-solid',
} as const;
