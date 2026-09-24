import type { DiagramNode, Pt, Rect } from '@/types/diagram';
import { F, type FontKey } from './tokens';

export const snap = (v: number, g = 4) => Math.round(v / g) * g;
export const snapUp = (v: number, g = 8) => Math.ceil(v / g) * g;
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export function resetTextCache() {
  cache.clear();
}

/** Mede o texto com a fonte real (canvas); cai numa estimativa se o canvas não existir. */
export function textWidth(text: string, size: number, family: FontKey = 'sans', weight = 400): number {
  if (!text) return 0;
  const key = `${family}|${size}|${weight}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let w = text.length * size * (family === 'mono' ? 0.6 : 0.56);
  try {
    ctx ??= document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.font = `${weight} ${size}px ${F[family]}`;
      w = ctx.measureText(text).width;
    }
  } catch {
    /* ambiente sem canvas: mantém a estimativa */
  }
  cache.set(key, w);
  return w;
}

export function rectOf(n: DiagramNode, size: { w: number; h: number }): Rect {
  return { x: n.x, y: n.y, w: size.w, h: size.h };
}

export function center(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

export function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rects) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const uid = () => Math.random().toString(36).slice(2, 10);
