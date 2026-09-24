/**
 * Tokens do design system (mesmos papéis semânticos do skill diagram-design).
 * São literais hex porque o SVG exportado não enxerga classes do Tailwind.
 */
export const C = {
  paper: '#f5f5f5',
  paper2: '#ececec',
  white: '#ffffff',
  ink: '#2d3142',
  muted: '#4f5d75',
  soft: '#7a8399',
  rule: 'rgba(45,49,66,0.12)',
  ruleSolid: '#bfc0c0',
  accent: '#eb6c36',
  accentTint: 'rgba(235,108,54,0.08)',
  link: '#2e5aa8',
  store: 'rgba(45,49,66,0.05)',
} as const;

export const F = {
  sans: "'Geist Sans', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
  serif: "'Instrument Serif', Georgia, serif",
} as const;

export type FontKey = keyof typeof F;

export const GRID = 4;
export const ROUTE_RADIUS = 8;
export const FAN_GAP = 16;
