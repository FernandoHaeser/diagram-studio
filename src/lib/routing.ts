import type { DiagramEdge, Pt } from '@/types/diagram';
import type { Shape } from '@/diagrams/types';
import { FAN_GAP, ROUTE_RADIUS } from './tokens';
import { clamp, snap } from './geometry';

type Side = 'l' | 'r' | 't' | 'b';

interface End {
  edge: DiagramEdge;
  end: 'from' | 'to';
  shape: Shape;
  other: Shape;
  side: Side;
  off: number;
  pt: Pt;
}

const isHoriz = (s: Side) => s === 'l' || s === 'r';
const dirOf = (s: Side) => (s === 'r' || s === 'b' ? 1 : -1);

function sideOf(a: Shape, b: Shape): Side {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  // Se os nós se sobrepõem na horizontal, a ligação natural é vertical; senão, lateral.
  if (Math.abs(dx) < a.hw + b.hw && Math.abs(dy) > 0) return dy > 0 ? 'b' : 't';
  return dx >= 0 ? 'r' : 'l';
}

function anchorPt(s: Shape, side: Side, off: number): Pt {
  const horiz = isHoriz(side);
  const sg = dirOf(side);
  const o = clamp(off, -((horiz ? s.hh : s.hw) - 4), (horiz ? s.hh : s.hw) - 4);
  if (s.kind === 'rect') {
    return horiz ? { x: s.cx + sg * s.hw, y: s.cy + o } : { x: s.cx + o, y: s.cy + sg * s.hh };
  }
  if (s.kind === 'ellipse') {
    if (horiz) return { x: s.cx + sg * s.hw * Math.sqrt(Math.max(0, 1 - (o / s.hh) ** 2)), y: s.cy + o };
    return { x: s.cx + o, y: s.cy + sg * s.hh * Math.sqrt(Math.max(0, 1 - (o / s.hw) ** 2)) };
  }
  if (horiz) return { x: s.cx + sg * s.hw * (1 - Math.abs(o) / s.hh), y: s.cy + o };
  return { x: s.cx + o, y: s.cy + sg * s.hh * (1 - Math.abs(o) / s.hw) };
}

function elbow(s: Pt, t: Pt, horiz: boolean, jog?: number): Pt[] {
  const [a, b] = horiz ? [s.x, t.x] : [s.y, t.y];
  const same = horiz ? Math.abs(s.y - t.y) < 0.5 : Math.abs(s.x - t.x) < 0.5;
  if (same) return [s, t];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let j = jog ?? snap((a + b) / 2);
  j = hi - lo < ROUTE_RADIUS * 2 + 4 ? (a + b) / 2 : clamp(j, lo + ROUTE_RADIUS, hi - ROUTE_RADIUS);
  return horiz ? [s, { x: j, y: s.y }, { x: j, y: t.y }, t] : [s, { x: s.x, y: j }, { x: t.x, y: j }, t];
}

/**
 * Roteamento ortogonal com cotovelos arredondados.
 * - Cada aresta que divide a mesma face de um nó ganha um ponto de ancoragem próprio (leque de 12px).
 * - O cotovelo de cada aresta do grupo é escalonado para que nenhuma cruze outra.
 */
export function routeEdges(edges: DiagramEdge[], shapes: Map<string, Shape>): Record<string, Pt[]> {
  const ends: End[] = [];
  const result: Record<string, Pt[]> = {};

  for (const edge of edges) {
    const a = shapes.get(edge.from);
    const b = shapes.get(edge.to);
    if (!a || !b) continue;
    if (edge.from === edge.to) {
      const y = a.cy;
      const x = a.cx + a.hw;
      result[edge.id] = [
        { x, y: y - 8 },
        { x: x + 28, y: y - 8 },
        { x: x + 28, y: y + 8 },
        { x, y: y + 8 },
      ];
      continue;
    }
    ends.push({ edge, end: 'from', shape: a, other: b, side: sideOf(a, b), off: 0, pt: { x: 0, y: 0 } });
    ends.push({ edge, end: 'to', shape: b, other: a, side: sideOf(b, a), off: 0, pt: { x: 0, y: 0 } });
  }

  const groups = new Map<string, End[]>();
  for (const e of ends) {
    const key = `${e.end === 'from' ? e.edge.from : e.edge.to}:${e.side}`;
    const g = groups.get(key);
    if (g) g.push(e);
    else groups.set(key, [e]);
  }

  for (const g of groups.values()) {
    const horiz = isHoriz(g[0].side);
    const ax = horiz ? 'cy' : 'cx';
    g.sort((p, q) => p.other[ax] - q.other[ax]);
    g.forEach((e, i) => {
      e.off = (i - (g.length - 1) / 2) * FAN_GAP;
      e.pt = anchorPt(e.shape, e.side, e.off);
    });
  }

  const jogs = new Map<string, number>();
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const side = g[0].side;
    const horiz = isHoriz(side);
    const ax = horiz ? 'cy' : 'cx';
    const pAx = horiz ? 'y' : 'x';
    const before = g.filter((e) => e.other[ax] < e.pt[pAx]).sort((p, q) => p.other[ax] - q.other[ax]);
    const after = g.filter((e) => e.other[ax] >= e.pt[pAx]).sort((p, q) => q.other[ax] - p.other[ax]);
    for (const list of [before, after]) {
      list.forEach((e, i) => {
        const base = horiz ? e.pt.x : e.pt.y;
        jogs.set(`${e.edge.id}:${e.end}`, snap(base + dirOf(side) * (24 + FAN_GAP * i)));
      });
    }
  }

  const byEdge = new Map<string, { from?: End; to?: End }>();
  for (const e of ends) {
    const cur = byEdge.get(e.edge.id) ?? {};
    cur[e.end] = e;
    byEdge.set(e.edge.id, cur);
  }
  for (const [id, { from, to }] of byEdge) {
    if (!from || !to) continue;
    const jog = jogs.get(`${id}:from`) ?? jogs.get(`${id}:to`);
    result[id] = elbow(from.pt, to.pt, isHoriz(from.side), jog);
  }
  return result;
}

/** Converte pontos ortogonais em um path SVG com cantos arredondados (raio 8). */
export function pathD(pts: Pt[]): string {
  if (!pts.length) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const l1 = Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y);
    const l2 = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
    const r = Math.min(ROUTE_RADIUS, l1 / 2, l2 / 2);
    const toward = (a: Pt, b: Pt, t: number): Pt => {
      const n = Math.abs(b.x - a.x) + Math.abs(b.y - a.y) || 1;
      return { x: a.x + ((b.x - a.x) / n) * t, y: a.y + ((b.y - a.y) / n) * t };
    };
    const a = toward(p1, p0, r);
    const b = toward(p1, p2, r);
    d += ` L ${a.x} ${a.y} Q ${p1.x} ${p1.y} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L ${last.x} ${last.y}`;
}

export interface LabelSpot {
  x: number;
  y: number;
  anchor: 'middle' | 'start';
  vertical: boolean;
}

/** Ponto do rótulo: no meio do maior segmento, com folga de 8px acima (ou ao lado, se vertical). */
export function labelSpot(pts: Pt[], avoidEnds = false): LabelSpot {
  let best: [Pt, Pt] = [pts[0], pts[pts.length - 1]];
  let top = -Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
    const touchesEnd = i === 0 || i === pts.length - 2;
    const score = len - (avoidEnds && touchesEnd ? 48 : 0);
    if (score > top) {
      top = score;
      best = [pts[i], pts[i + 1]];
    }
  }
  const mx = (best[0].x + best[1].x) / 2;
  const my = (best[0].y + best[1].y) / 2;
  const vertical = Math.abs(best[0].x - best[1].x) < 0.5;
  return vertical ? { x: mx + 10, y: my + 4, anchor: 'start', vertical } : { x: mx, y: my - 10, anchor: 'middle', vertical };
}

/** Posição de um rótulo de cardinalidade perto de uma ponta, deslocado para fora da linha. */
export function endSpot(pts: Pt[], atStart: boolean): Pt & { anchor: 'start' | 'end' | 'middle' } {
  const p = atStart ? pts[0] : pts[pts.length - 1];
  const q = atStart ? pts[1] : pts[pts.length - 2];
  const dx = Math.sign(q.x - p.x);
  const dy = Math.sign(q.y - p.y);
  if (dx !== 0) return { x: p.x + dx * 14, y: p.y - 6, anchor: dx > 0 ? 'start' : 'end' };
  return { x: p.x + 8, y: p.y + dy * 16, anchor: 'start' };
}
