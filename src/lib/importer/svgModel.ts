import type { Pt } from '@/types/diagram';
import { parseColor, type RGBA } from './color';

/** Matriz afim 2D: [a c e; b d f]. */
export interface Mat {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const IDENT: Mat = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const mul = (m: Mat, n: Mat): Mat => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f,
});
const apply = (m: Mat, x: number, y: number): Pt => ({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f });

function parseTransform(value: string | null): Mat {
  if (!value) return IDENT;
  let m = IDENT;
  for (const [, fn, args] of value.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === 'translate') m = mul(m, { ...IDENT, e: n[0] ?? 0, f: n[1] ?? 0 });
    else if (fn === 'scale') m = mul(m, { ...IDENT, a: n[0] ?? 1, d: n[1] ?? n[0] ?? 1 });
    else if (fn === 'matrix' && n.length === 6) m = mul(m, { a: n[0], b: n[1], c: n[2], d: n[3], e: n[4], f: n[5] });
  }
  return m;
}

export interface RectP {
  x: number;
  y: number;
  w: number;
  h: number;
  round: boolean;
  diamond?: boolean;
  fill: RGBA | null;
  stroke: RGBA | null;
  dash: boolean;
}

export interface TextP {
  text: string;
  /** Centro estimado do texto (já com a âncora e a largura aplicadas). */
  cx: number;
  cy: number;
  width: number;
  size: number;
  weight: number;
  mono: boolean;
  fill: RGBA | null;
}

export interface LineP {
  pts: Pt[];
  stroke: RGBA | null;
  dash: boolean;
  markerStart: boolean;
  markerEnd: boolean;
}

export interface SvgModel {
  width: number;
  height: number;
  rects: RectP[];
  texts: TextP[];
  lines: LineP[];
}

const SKIP = new Set(['defs', 'marker', 'pattern', 'clippath', 'mask', 'symbol', 'style', 'script', 'title', 'desc', 'metadata', 'lineargradient', 'radialgradient', 'filter']);
const INHERITED = new Set(['fill', 'stroke', 'stroke-dasharray', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'fill-opacity', 'stroke-opacity']);

interface Rule {
  tag?: string;
  classes: string[];
  props: Record<string, string>;
}

let activeRules: Rule[] = [];
let activeVars: Record<string, string> = {};

/** Regras CSS simples (.classe, tag.classe, seletores compostos usam o último trecho) do <style>. Ignora @media. */
export function cssRules(doc: Document): Rule[] {
  const rules: Rule[] = [];
  for (const style of doc.querySelectorAll('style')) {
    const css = (style.textContent ?? '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    for (const [, sel, body] of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      const props: Record<string, string> = {};
      for (const decl of body.split(';')) {
        const i = decl.indexOf(':');
        if (i > 0) props[decl.slice(0, i).trim().toLowerCase()] = decl.slice(i + 1).trim();
      }
      for (const part of sel.split(',')) {
        const last = part.trim().split(/[\s>+~]+/).pop() ?? '';
        const classes = [...last.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
        const tag = last.match(/^[a-z][\w-]*/i)?.[0]?.toLowerCase();
        if (classes.length || tag) rules.push({ tag, classes, props });
      }
    }
  }
  return rules;
}

function styleOf(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  const tag = el.tagName.toLowerCase();
  for (const r of activeRules) {
    if ((r.tag == null || r.tag === tag) && r.classes.every((c) => classes.includes(c))) Object.assign(out, r.props);
  }
  for (const part of (el.getAttribute('style') ?? '').split(';')) {
    const i = part.indexOf(':');
    if (i > 0) out[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return out;
}

const resolveVars = (v: string) => v.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_m, name: string, fb?: string) => activeVars[name] ?? fb ?? '');

function prop(el: Element, name: string): string | null {
  for (let cur: Element | null = el; cur && cur.tagName.toLowerCase() !== 'svg'; cur = cur.parentElement) {
    const v = styleOf(cur)[name] ?? cur.getAttribute(name);
    if (v != null && v !== '') return v.includes('var(') && name !== 'fill' && name !== 'stroke' ? resolveVars(v) : v;
    if (!INHERITED.has(name)) break;
  }
  return null;
}

const num = (el: Element, name: string, fallback = 0) => {
  const v = parseFloat(el.getAttribute(name) ?? '');
  return Number.isNaN(v) ? fallback : v;
};

/** Variáveis CSS (`--x: valor`) declaradas em qualquer <style> do documento. */
export function cssVars(doc: Document): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const style of doc.querySelectorAll('style')) {
    for (const [, name, value] of (style.textContent ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) vars[name] ??= value.trim();
  }
  return vars;
}

function pathPoints(d: string): Pt[] {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const pts: Pt[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  let i = 0;
  const take = (k: number) => {
    const out = tokens.slice(i, i + k).map(Number);
    i += k;
    return out;
  };
  const arity: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const lower = cmd.toLowerCase();
    if (lower === 'z') {
      cx = sx;
      cy = sy;
      pts.push({ x: cx, y: cy });
      continue;
    }
    const k = arity[lower];
    if (!k) break;
    const args = take(k);
    if (args.length < k || args.some(Number.isNaN)) break;
    const rel = cmd === lower;
    if (lower === 'h') cx = rel ? cx + args[0] : args[0];
    else if (lower === 'v') cy = rel ? cy + args[0] : args[0];
    else {
      const [ex, ey] = args.slice(-2);
      cx = rel ? cx + ex : ex;
      cy = rel ? cy + ey : ey;
    }
    if (lower === 'm') {
      sx = cx;
      sy = cy;
      cmd = rel ? 'l' : 'L';
    }
    pts.push({ x: cx, y: cy });
  }
  return pts;
}

const hasMarker = (el: Element, name: 'marker-start' | 'marker-end') => {
  const v = prop(el, name);
  return !!v && v !== 'none';
};

/** Converte o <svg> em primitivas com coordenadas absolutas (transformações aplicadas). */
export function buildModel(svg: Element, vars: Record<string, string>, rules: Rule[] = []): SvgModel {
  activeRules = rules;
  activeVars = vars;
  const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  const width = vb.length === 4 && vb[2] > 0 ? vb[2] : num(svg, 'width', 1000);
  const height = vb.length === 4 && vb[3] > 0 ? vb[3] : num(svg, 'height', 600);
  const rects: RectP[] = [];
  const texts: TextP[] = [];
  const lines: LineP[] = [];
  const color = (el: Element, name: string) => {
    const c = parseColor(prop(el, name), vars);
    if (!c) return null;
    const op = parseFloat(prop(el, `${name}-opacity`) ?? '');
    return Number.isNaN(op) ? c : { ...c, a: c.a * op };
  };
  const dashed = (el: Element) => {
    const v = prop(el, 'stroke-dasharray');
    return !!v && v !== 'none' && v !== '0';
  };
  const size = (v: string | null, m: Mat) => (parseFloat(v ?? '') || 12) * (v?.endsWith('rem') || v?.endsWith('em') ? 16 : 1) * Math.abs(m.d);

  const walk = (el: Element, parent: Mat) => {
    for (const child of el.children) {
      const tag = child.tagName.toLowerCase();
      if (SKIP.has(tag) || styleOf(child).display === 'none' || child.getAttribute('display') === 'none') continue;
      const m = mul(parent, parseTransform(child.getAttribute('transform')));

      if (tag === 'g' || tag === 'a' || tag === 'svg') {
        walk(child, m);
      } else if (tag === 'rect') {
        const w = child.getAttribute('width')?.endsWith('%') ? (parseFloat(child.getAttribute('width')!) / 100) * width : num(child, 'width');
        const h = child.getAttribute('height')?.endsWith('%') ? (parseFloat(child.getAttribute('height')!) / 100) * height : num(child, 'height');
        const a = apply(m, num(child, 'x'), num(child, 'y'));
        rects.push({ x: a.x, y: a.y, w: w * Math.abs(m.a), h: h * Math.abs(m.d), round: false, fill: color(child, 'fill'), stroke: color(child, 'stroke'), dash: dashed(child) });
      } else if (tag === 'ellipse' || tag === 'circle') {
        const rx = tag === 'circle' ? num(child, 'r') : num(child, 'rx');
        const ry = tag === 'circle' ? num(child, 'r') : num(child, 'ry');
        const c = apply(m, num(child, 'cx'), num(child, 'cy'));
        const wx = rx * Math.abs(m.a);
        const hy = ry * Math.abs(m.d);
        rects.push({ x: c.x - wx, y: c.y - hy, w: wx * 2, h: hy * 2, round: true, fill: color(child, 'fill'), stroke: color(child, 'stroke'), dash: dashed(child) });
      } else if (tag === 'text') {
        const spans = [...child.querySelectorAll('tspan')].filter((s) => s.hasAttribute('x') || s.hasAttribute('y'));
        const parts = spans.length ? spans : [child];
        for (const p of parts) {
          const text = (p.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (!text) continue;
          const fs = size(prop(p, 'font-size'), m);
          const family = (prop(p, 'font-family') ?? '').toLowerCase();
          const mono = family.includes('mono') || family.includes('courier') || family.includes('consolas');
          const width = text.length * fs * (mono ? 0.6 : 0.56);
          const at = apply(m, num(p, 'x', num(child, 'x')), num(p, 'y', num(child, 'y')));
          const anchor = prop(p, 'text-anchor') ?? 'start';
          const cx = anchor === 'middle' ? at.x : anchor === 'end' ? at.x - width / 2 : at.x + width / 2;
          texts.push({ text, cx, cy: at.y - fs * 0.35, width, size: fs, weight: parseInt(prop(p, 'font-weight') ?? '400', 10) || 400, mono, fill: color(p, 'fill') });
        }
      } else if (tag === 'polygon') {
        const n = (child.getAttribute('points') ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
        const pts: Pt[] = [];
        for (let i = 0; i + 1 < n.length; i += 2) pts.push(apply(m, n[i], n[i + 1]));
        const stroke = color(child, 'stroke');
        if (pts.length === 4 && stroke) {
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          const x = Math.min(...xs);
          const y = Math.min(...ys);
          rects.push({ x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, round: false, diamond: true, fill: color(child, 'fill'), stroke, dash: dashed(child) });
        }
      } else if (tag === 'line' || tag === 'polyline' || tag === 'path') {
        let raw: Pt[] = [];
        if (tag === 'line') raw = [{ x: num(child, 'x1'), y: num(child, 'y1') }, { x: num(child, 'x2'), y: num(child, 'y2') }];
        else if (tag === 'polyline') {
          const n = (child.getAttribute('points') ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
          for (let i = 0; i + 1 < n.length; i += 2) raw.push({ x: n[i], y: n[i + 1] });
        } else raw = pathPoints(child.getAttribute('d') ?? '');
        if (raw.length < 2) continue;
        lines.push({
          pts: raw.map((p) => apply(m, p.x, p.y)),
          stroke: color(child, 'stroke'),
          dash: dashed(child),
          markerStart: hasMarker(child, 'marker-start'),
          markerEnd: hasMarker(child, 'marker-end'),
        });
      }
    }
  };

  walk(svg, IDENT);
  return { width, height, rects, texts, lines };
}
