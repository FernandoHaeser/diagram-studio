import type { Diagram, DiagramEdge, DiagramNode, Pt, Rect } from '@/types/diagram';
import { getSpec } from '@/diagrams';
import { snap, snapUp, uid } from '@/lib/geometry';
import { isAccent, isBlue, isDark, visible } from './color';
import { buildModel, cssRules, cssVars, type LineP, type RectP, type TextP } from './svgModel';

export interface HeuristicResult {
  diagram: Diagram;
  report: string[];
}

interface Cand extends RectP {
  id: string;
  zone: boolean;
  area: number;
  texts: TextP[];
  label?: string;
}

const CONNECT_TOLERANCE = 14;
const MIN_W = 56;
const MIN_H = 28;
const MIN_EDGE = 20;

const contains = (o: Rect, x: number, y: number, pad = 0) => x >= o.x - pad && x <= o.x + o.w + pad && y >= o.y - pad && y <= o.y + o.h + pad;
const encloses = (o: Rect, i: Rect) => i.x >= o.x - 1 && i.y >= o.y - 1 && i.x + i.w <= o.x + o.w + 1 && i.y + i.h <= o.y + o.h + 1 && (i.w < o.w || i.h < o.h);
const same = (a: Rect, b: Rect) => Math.abs(a.x - b.x) < 1.5 && Math.abs(a.y - b.y) < 1.5 && Math.abs(a.w - b.w) < 1.5 && Math.abs(a.h - b.h) < 1.5;

function rectDistance(p: Pt, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function segDistance(p: Pt, a: Pt, b: Pt): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2)) : 0;
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

const polyDistance = (p: Pt, pts: Pt[]) => Math.min(...pts.slice(1).map((q, i) => segDistance(p, pts[i], q)));
const polyLength = (pts: Pt[]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);

function boxFlags(c: Cand): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  const s = c.stroke;
  if (isAccent(s)) {
    if (c.dash) flags.security = true;
    else flags.focal = true;
  } else if (c.dash) flags.optional = true;
  else if (visible(c.fill, 0.02) && c.fill!.a <= 0.14 && isDark(c.fill) && s && s.a >= 0.5) flags.store = true;
  else if (s && s.a <= 0.42 && isDark(s)) flags.external = true;
  if (c.round) flags.round = true;
  if (c.diamond) flags.diamond = true;
  return flags;
}

/**
 * Reconstrói um diagrama de arquitetura a partir de um <svg> gerado pelo /diagram-design.
 * Entende: caixas (rect/ellipse com traço), zonas (caixa que contém outras), tags de tipo, rótulos,
 * setas (path/line/polyline com marker) e o tratamento visual por tipo de nó.
 */
export function importHeuristic(svg: Element, doc: Document, fileName: string): HeuristicResult {
  const report: string[] = [];
  const model = buildModel(svg, cssVars(doc), cssRules(doc));

  const legendTexts = model.texts.filter((t) => /^legend[ae]?$/i.test(t.text));
  const legendY = legendTexts.length ? Math.min(...legendTexts.map((t) => t.cy)) - 22 : Infinity;

  /* ---------- caixas e zonas ---------- */
  const raw = model.rects.filter((r) => {
    if (!visible(r.stroke, 0.04) || r.w < MIN_W || r.h < MIN_H) return false;
    if (r.w >= model.width * 0.92 && r.h >= model.height * 0.92) return false;
    return r.y < legendY;
  });
  const cands: Cand[] = [];
  for (const r of raw) {
    if (cands.some((c) => same(c, r))) continue;
    cands.push({ ...r, id: uid(), zone: false, area: r.w * r.h, texts: [] });
  }
  for (const a of cands) a.zone = cands.some((b) => b !== a && encloses(a, b));
  const leaves = cands.filter((c) => !c.zone);
  const zones = cands.filter((c) => c.zone);

  /* ---------- textos ---------- */
  const free: TextP[] = [];
  for (const t of model.texts) {
    if (t.cy >= legendY || t.size >= 24 || (t.fill && t.fill.a < 0.15)) continue;
    const owner = cands.filter((c) => contains(c, t.cx, t.cy)).sort((a, b) => a.area - b.area)[0];
    if (owner && !owner.zone) owner.texts.push(t);
    else free.push(t);
  }

  const nodes: DiagramNode[] = [];
  const byCand = new Map<string, DiagramNode>();

  // Zonas mais internas primeiro, para cada uma ficar com o rótulo mais próximo do seu topo.
  const nearTop = (z: Cand, t: TextP) => t.mono && t.size <= 10.5 && t.cx >= z.x && t.cx <= z.x + z.w && t.cy >= z.y - 12 && t.cy <= z.y + 24;
  for (const z of [...zones].sort((a, b) => a.area - b.area)) {
    const label = free.filter((t) => nearTop(z, t)).sort((a, b) => a.cy - b.cy)[0];
    if (label) free.splice(free.indexOf(label), 1);
    z.label = label?.text ?? 'ZONA';
  }

  for (const c of zones) {
    const n: DiagramNode = { id: c.id, kind: 'zone', x: snap(c.x), y: snap(c.y), w: snapUp(c.w, 4), h: snapUp(c.h, 4), label: c.label ?? 'ZONA', flags: {} };
    nodes.push(n);
    byCand.set(c.id, n);
  }

  for (const c of leaves) {
    const texts = [...c.texts].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
    let tag: string | undefined;
    const labels: string[] = [];
    const subs: string[] = [];
    for (const t of texts) {
      const upper = t.text === t.text.toUpperCase();
      if (!tag && t.mono && t.size <= 8.5 && t.text.length <= 8 && upper && t.cx - c.x <= 90 && t.cy - c.y <= 26) tag = t.text;
      else if (t.mono && t.size <= 10.5) subs.push(t.text);
      else labels.push(t.text);
    }
    const label = labels.join(' ') || subs.shift() || 'Sem nome';
    const n: DiagramNode = {
      id: c.id,
      kind: 'box',
      x: snap(c.x),
      y: snap(c.y),
      w: snapUp(c.w, 4),
      h: snapUp(c.h, 4),
      label,
      sub: subs.join(' · ') || undefined,
      tag,
      flags: boxFlags(c),
    };
    nodes.push(n);
    byCand.set(c.id, n);
  }

  /* ---------- setas ---------- */
  const edges: DiagramEdge[] = [];
  const edgePts = new Map<string, Pt[]>();
  let skipped = 0;
  const attach = (p: Pt): Cand | null => {
    const best = leaves
      .map((c) => ({ c, d: rectDistance(p, c) }))
      .filter((x) => x.d <= CONNECT_TOLERANCE)
      .sort((a, b) => a.d - b.d || a.c.area - b.c.area)[0];
    return best?.c ?? null;
  };

  for (const l of model.lines as LineP[]) {
    if (!visible(l.stroke, 0.2) || polyLength(l.pts) < MIN_EDGE) continue;
    if (l.pts.every((p) => p.y >= legendY)) continue;
    const start = l.pts[0];
    const end = l.pts[l.pts.length - 1];
    if (leaves.some((c) => l.pts.every((p) => contains(c, p.x, p.y)))) continue;
    if (!l.markerStart && !l.markerEnd && !leaves.length) continue;

    const a = attach(start);
    const b = attach(end);
    if (!a || !b) {
      if (l.markerEnd || l.markerStart) skipped += 1;
      continue;
    }
    if (a === b) continue;
    const reversed = l.markerStart && !l.markerEnd;
    const [from, to] = reversed ? [b, a] : [a, b];
    const arrow = l.markerStart || l.markerEnd;
    const kind = !arrow ? 'line' : isAccent(l.stroke) ? 'accent' : isBlue(l.stroke) ? 'api' : l.dash ? 'dashed' : 'arrow';
    if (edges.some((e) => e.from === from.id && e.to === to.id && e.kind === kind)) continue;
    const edge: DiagramEdge = { id: uid(), kind, from: from.id, to: to.id };
    edges.push(edge);
    edgePts.set(edge.id, l.pts);
  }

  /* ---------- rótulos das setas e notas ---------- */
  let orphan = 0;
  const notes: DiagramNode[] = [];
  for (const t of free) {
    const p = { x: t.cx, y: t.cy };
    const near = edges
      .map((e) => ({ e, d: polyDistance(p, edgePts.get(e.id)!) }))
      .filter((x) => x.d <= 26)
      .sort((a, b) => a.d - b.d)[0];
    if (near) {
      near.e.label = near.e.label ? `${near.e.label} ${t.text}` : t.text;
    } else if (!t.mono && t.size >= 10 && t.text.length >= 3 && notes.length < 10) {
      const w = snapUp(Math.min(240, Math.max(96, t.width + 32)), 4);
      notes.push({ id: uid(), kind: 'note', x: snap(t.cx - w / 2), y: snap(t.cy - 20), w, h: 44, label: 'Nota', text: t.text, flags: {} });
    } else orphan += 1;
  }
  nodes.push(...notes);

  /* ---------- relatório ---------- */
  report.push(`${leaves.length} caixas, ${zones.length} zonas e ${edges.length} conexões importadas.`);
  if (skipped) report.push(`${skipped} seta(s) ignorada(s): a ponta não encosta em nenhuma caixa.`);
  if (notes.length) report.push(`${notes.length} texto(s) solto(s) viraram nota.`);
  if (orphan) report.push(`${orphan} rótulo(s) sem seta por perto foram ignorados.`);

  /* ---------- cabeçalho (do HTML ao redor, se houver) ---------- */
  const text = (sel: string) => doc.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const title = text('h1') || doc.title?.trim() || fileName.replace(/\.[^.]+$/, '');
  const spec = getSpec('architecture');
  const now = Date.now();
  const diagram: Diagram = {
    id: uid(),
    type: 'architecture',
    name: title.slice(0, 60),
    nodes,
    edges,
    meta: { eyebrow: text('.eyebrow') || spec.eyebrow, title, subtitle: text('.subtitle') || text('h1 + p'), header: true, legend: true },
    createdAt: now,
    updatedAt: now,
  };
  return { diagram, report };
}

