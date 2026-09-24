import type { Diagram, Pt, Rect } from '@/types/diagram';
import { getSpec, nodeSpec } from '@/diagrams';
import type { Shape } from '@/diagrams/types';
import { routeEdges } from './routing';
import { unionRects } from './geometry';

export function shapesOf(d: Diagram): Map<string, Shape> {
  const map = new Map<string, Shape>();
  for (const n of d.nodes) {
    const ks = nodeSpec(d, n.kind);
    if (ks.connectable === false) continue;
    if (ks.shape) {
      map.set(n.id, ks.shape(n));
      continue;
    }
    const { w, h } = ks.size(n);
    map.set(n.id, { kind: 'rect', cx: n.x + w / 2, cy: n.y + h / 2, hw: w / 2, hh: h / 2 });
  }
  return map;
}

export function routesOf(d: Diagram, shapes: Map<string, Shape>): Record<string, Pt[]> {
  const spec = getSpec(d.type);
  const custom = spec.route?.(d) ?? {};
  const rest = d.edges.filter((e) => !custom[e.id]);
  return { ...routeEdges(rest, shapes), ...custom };
}

export function nodeRect(d: Diagram, id: string): Rect | null {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) return null;
  const { w, h } = nodeSpec(d, n.kind).size(n);
  return { x: n.x, y: n.y, w, h };
}

export function boundsOf(d: Diagram, routes: Record<string, Pt[]>): Rect | null {
  const rects: Rect[] = d.nodes.map((n) => {
    const { w, h } = nodeSpec(d, n.kind).size(n);
    return { x: n.x, y: n.y, w, h };
  });
  const extra = getSpec(d.type).extent?.(d);
  if (extra) rects.push(extra);
  for (const pts of Object.values(routes)) {
    for (const p of pts) rects.push({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  return unionRects(rects);
}
