import { useMemo } from 'react';
import type { Diagram, DiagramEdge, DiagramNode, Pt, Selection } from '@/types/diagram';
import { getSpec, edgeSpec, nodeSpec } from '@/diagrams';
import { pathD, labelSpot, endSpot } from '@/lib/routing';
import { routesOf, shapesOf } from '@/lib/layout';
import { textWidth } from '@/lib/geometry';
import { C } from '@/lib/tokens';
import { SvgText } from '../SvgText';
import { contentStyles as s } from './styles';

interface DiagramContentProps {
  diagram: Diagram;
  interactive?: boolean;
  selection?: Selection;
  pendingFrom?: string | null;
  cursor?: Pt | null;
}

function EdgeView({ diagram, edge, pts, selected, interactive }: { diagram: Diagram; edge: DiagramEdge; pts: Pt[]; selected: boolean; interactive: boolean }) {
  const ks = edgeSpec(diagram, edge.kind);
  const d = pathD(pts);
  const m = ks.markers(edge);
  const stroke = selected ? s.selected : (ks.color ?? s.edge);
  const text = edge.label ?? ks.stereotype;
  const stereotype = (!edge.label && !!ks.stereotype) || !!ks.labelMono;
  const self = edge.from === edge.to && pts.length === 4;
  const spot = !text
    ? null
    : self
      ? { x: pts[1].x + 8, y: (pts[1].y + pts[2].y) / 2 + 4, anchor: 'start' as const, vertical: false }
      : labelSpot(pts, !!(edge.fromCard || edge.toCard));
  const size = stereotype ? 8 : 12;
  const w = text ? textWidth(text, size, stereotype ? 'mono' : 'sans') + (stereotype ? text.length * 0.6 : 0) + 12 : 0;
  const card = (value: string | undefined, atStart: boolean) => {
    if (!value) return null;
    const p = endSpot(pts, atStart);
    return (
      <SvgText x={p.x} y={p.y} anchor={p.anchor === 'end' ? 'end' : 'start'} size={10} family="mono" fill={C.ink}>
        {value}
      </SvgText>
    );
  };
  return (
    <g>
      {interactive ? <path d={d} fill="none" stroke="transparent" strokeWidth={14} data-edge-id={edge.id} style={{ cursor: 'pointer' }} /> : null}
      {selected ? <path d={d} fill="none" stroke={s.halo} strokeWidth={7} strokeLinecap="round" pointerEvents="none" /> : null}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1}
        strokeDasharray={ks.dashed ? '5,4' : undefined}
        markerStart={m.start ? `url(#${m.start})` : undefined}
        markerEnd={m.end ? `url(#${m.end})` : undefined}
        pointerEvents="none"
      />
      {text && spot ? (
        <g pointerEvents="none">
          {spot.anchor === 'middle' ? (
            <rect x={spot.x - w / 2} y={spot.y - 12} width={w} height={16} rx={2} fill={C.paper} />
          ) : (
            <rect x={spot.x - 4} y={spot.y - 12} width={w} height={16} rx={2} fill={C.paper} />
          )}
          <SvgText x={spot.x} y={spot.y} anchor={spot.anchor} size={size} family={stereotype ? 'mono' : 'sans'} fill={stereotype ? (ks.color ?? C.soft) : C.muted} spacing={stereotype ? '0.08em' : undefined}>
            {text}
          </SvgText>
        </g>
      ) : null}
      {card(edge.fromCard, true)}
      {card(edge.toCard, false)}
    </g>
  );
}

export function DiagramContent({ diagram, interactive = false, selection = null, pendingFrom = null, cursor = null }: DiagramContentProps) {
  const spec = getSpec(diagram.type);
  const layout = useMemo(() => {
    const shapes = shapesOf(diagram);
    return { shapes, routes: routesOf(diagram, shapes) };
  }, [diagram]);

  const renderNode = (n: DiagramNode) => {
    const ks = nodeSpec(diagram, n.kind);
    const isSel = selection?.type === 'node' && selection.id === n.id;
    const size = ks.size(n);
    return (
      <g key={n.id} data-node-id={interactive ? n.id : undefined}>
        {ks.render(n, { selected: isSel, pending: pendingFrom === n.id, interactive })}
        {interactive && isSel && ks.resizable ? (
          <rect
            data-resize={n.id}
            x={n.x + size.w - s.handle.size / 2}
            y={n.y + size.h - s.handle.size / 2}
            width={s.handle.size}
            height={s.handle.size}
            rx={3}
            fill={s.handle.fill}
            stroke={s.handle.stroke}
            style={{ cursor: 'nwse-resize' }}
          />
        ) : null}
      </g>
    );
  };

  const back = diagram.nodes.filter((n) => nodeSpec(diagram, n.kind).back);
  const front = diagram.nodes.filter((n) => !nodeSpec(diagram, n.kind).back);
  const pendingShape = pendingFrom ? layout.shapes.get(pendingFrom) : undefined;

  return (
    <g>
      {spec.renderUnder?.(diagram)}
      {back.map(renderNode)}
      {spec.renderOver?.(diagram)}
      {diagram.edges.map((e) => {
        const pts = layout.routes[e.id];
        if (!pts) return null;
        return <EdgeView key={e.id} diagram={diagram} edge={e} pts={pts} selected={selection?.type === 'edge' && selection.id === e.id} interactive={interactive} />;
      })}
      {front.map(renderNode)}
      {interactive && pendingShape && cursor ? (
        <line x1={pendingShape.cx} y1={pendingShape.cy} x2={cursor.x} y2={cursor.y} stroke={s.rubber} strokeWidth={1.2} strokeDasharray="4,4" pointerEvents="none" />
      ) : null}
    </g>
  );
}
