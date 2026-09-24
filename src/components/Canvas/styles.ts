export const canvasStyles = {
  root: 'relative h-full w-full overflow-hidden bg-paper',
  svg: 'diagram-svg block h-full w-full touch-none select-none',
  empty: 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center',
  emptyTitle: 'font-serif text-3xl text-ink',
  emptyText: 'max-w-sm text-[13px] leading-relaxed text-muted',
  gridDot: 'rgba(45,49,66,0.16)',
  gridSize: 24,
} as const;
