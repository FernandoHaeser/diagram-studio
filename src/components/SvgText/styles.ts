import type { FontKey } from '@/lib/tokens';

export const svgTextStyles = {
  defaultFamily: 'sans' as FontKey,
  defaultSize: 12,
  letterSpacing: { eyebrow: '0.18em', tag: '0.08em', label: '0.06em' },
} as const;
