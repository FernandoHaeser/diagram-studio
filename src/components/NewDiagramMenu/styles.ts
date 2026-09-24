export const newMenuStyles = {
  root: 'relative',
  panel: 'absolute left-0 right-0 top-10 z-30 rounded-lg border border-rule-solid bg-white p-1.5',
  item: 'flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-paper-2',
  icon: 'mt-0.5 text-ink',
  name: 'block text-[13px] font-medium text-ink',
  desc: 'block text-[12px] leading-snug text-soft',
  foot: 'mt-1 border-t border-rule px-2 pt-2 pb-1',
} as const;
