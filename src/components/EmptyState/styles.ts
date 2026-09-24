export const emptyStyles = {
  root: 'flex h-full flex-col items-center justify-center gap-6 px-8 text-center',
  title: 'font-serif text-4xl text-ink',
  text: 'max-w-md text-[14px] leading-relaxed text-muted',
  grid: 'grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2',
  card: 'flex items-start gap-3 rounded-lg border border-rule-solid bg-surface p-3 text-left transition-colors hover:border-ink',
  name: 'block text-[13px] font-medium text-ink',
  desc: 'block text-[12px] leading-snug text-soft',
} as const;
