export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED: Record<string, RGBA> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

/** Lê cor CSS (#hex, rgb[a](), nome) resolvendo `var(--x)` a partir das variáveis do <style>. */
export function parseColor(input: string | null | undefined, vars: Record<string, string> = {}, depth = 0): RGBA | null {
  if (!input || depth > 4) return null;
  const v = input.trim().toLowerCase();
  if (!v || v === 'none' || v === 'currentcolor' || v.startsWith('url(')) return null;

  const varMatch = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (varMatch) return parseColor(vars[varMatch[1]] ?? varMatch[2], vars, depth + 1);

  if (NAMED[v]) return NAMED[v];

  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }

  const fn = v.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)));
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  return null;
}

export const visible = (c: RGBA | null, min = 0.03): c is RGBA => !!c && c.a >= min;

/** Laranja/coral (o "accent" do diagram-design, mas também qualquer tom quente parecido). */
export const isAccent = (c: RGBA | null) => !!c && c.r > 190 && c.g > 50 && c.g < 175 && c.b < 120;

/** Azul de links/APIs. */
export const isBlue = (c: RGBA | null) => !!c && c.b > c.r + 40 && c.b >= c.g;

export const isDark = (c: RGBA | null) => !!c && c.r < 130 && c.g < 130 && c.b < 150;
