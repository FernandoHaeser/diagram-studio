import { C } from '@/lib/tokens';

export const contentStyles = {
  selected: C.link,
  edge: C.muted,
  halo: 'rgba(46,90,168,0.22)',
  handle: { size: 12, fill: C.white, stroke: C.link },
  rubber: C.link,
} as const;
