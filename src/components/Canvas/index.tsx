import { useEffect, useMemo, useRef, useState } from 'react';
import type { Pt } from '@/types/diagram';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useViewport } from '@/hooks/useViewport';
import { getSpec, nodeSpec } from '@/diagrams';
import { boundsOf, routesOf, shapesOf } from '@/lib/layout';
import { snap } from '@/lib/geometry';
import { useActiveDiagram, useStore } from '@/lib/store';
import { DiagramContent } from '../DiagramContent';
import { MarkerDefs } from '../MarkerDefs';
import { StatusHint } from '../StatusHint';
import { ZoomControls } from '../ZoomControls';
import { canvasStyles as s } from './styles';

const DRAG_THRESHOLD = 3;

export function Canvas() {
  const diagram = useActiveDiagram();
  const tool = useStore((st) => st.tool);
  const selection = useStore((st) => st.selection);
  const pendingFrom = useStore((st) => st.pendingFrom);
  const notice = useStore((st) => st.notice);
  const fontTick = useStore((st) => st.fontTick);

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [space, setSpace] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  const { vp, setVp, fit, zoomAt, zoomBy } = useViewport(diagram?.id ?? null, size, () => {
    if (!diagram) return null;
    return boundsOf(diagram, routesOf(diagram, shapesOf(diagram)));
  });
  const vpRef = useRef(vp);
  vpRef.current = vp;

  useShortcuts({ onSpace: setSpace, onFit: fit, onZoom: zoomBy });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.01));
      else setVp((v) => ({ ...v, tx: v.tx - e.deltaX, ty: v.ty - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', onWheel);
    };
  }, [zoomAt, setVp]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => useStore.getState().setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const toWorld = (e: { clientX: number; clientY: number }): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    const v = vpRef.current;
    return { x: (e.clientX - rect.left - v.tx) / v.k, y: (e.clientY - rect.top - v.ty) / v.k };
  };

  const track = (onMove: (e: PointerEvent) => void, onEnd?: () => void) => {
    const move = (e: PointerEvent) => onMove(e);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onEnd?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startPan = (e: React.PointerEvent) => {
    const start = { x: e.clientX, y: e.clientY, ...vpRef.current };
    setGrabbing(true);
    track(
      (ev) => setVp({ k: start.k, tx: start.tx + ev.clientX - start.x, ty: start.ty + ev.clientY - start.y }),
      () => setGrabbing(false),
    );
  };

  const startNodeDrag = (id: string, e: React.PointerEvent) => {
    const st = useStore.getState();
    const d = st.diagrams[st.activeId!];
    const node = d.nodes.find((n) => n.id === id);
    if (!node) return;
    st.select({ type: 'node', id });
    const ks = nodeSpec(d, node.kind);
    const size = ks.size(node);
    const carried = ks.container
      ? d.nodes.filter((n) => n.id !== id && n.x + 4 > node.x && n.y + 4 > node.y && n.x < node.x + size.w && n.y < node.y + size.h)
      : [];
    const origin = [node, ...carried].map((n) => ({ id: n.id, x: n.x, y: n.y, lockY: nodeSpec(d, n.kind).lockY }));
    const start = { x: e.clientX, y: e.clientY };
    const w0 = toWorld(e);
    let began = false;
    track((ev) => {
      if (!began) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_THRESHOLD) return;
        began = true;
        useStore.getState().checkpoint();
      }
      const w = toWorld(ev);
      const pos: Record<string, Pt> = {};
      for (const o of origin) pos[o.id] = { x: snap(o.x + w.x - w0.x), y: o.lockY ? o.y : snap(o.y + w.y - w0.y) };
      useStore.getState().setPositions(pos);
    });
  };

  const startResize = (id: string) => {
    const d = useStore.getState().diagrams[useStore.getState().activeId!];
    const node = d.nodes.find((n) => n.id === id);
    if (!node) return;
    let began = false;
    track((ev) => {
      if (!began) {
        began = true;
        useStore.getState().checkpoint();
      }
      const w = toWorld(ev);
      useStore.getState().resizeNode(id, Math.max(96, snap(w.x - node.x)), Math.max(64, snap(w.y - node.y)));
    });
  };

  const startEdgeDrag = (id: string, e: React.PointerEvent) => {
    const d = useStore.getState().diagrams[useStore.getState().activeId!];
    const edge = d.edges.find((x) => x.id === id);
    if (!edge) return;
    const y0 = edge.y ?? 200;
    const w0 = toWorld(e);
    let began = false;
    track((ev) => {
      if (!began) {
        if (Math.abs(toWorld(ev).y - w0.y) < DRAG_THRESHOLD) return;
        began = true;
        useStore.getState().checkpoint();
      }
      useStore.getState().updateEdge(id, { y: Math.max(0, snap(y0 + toWorld(ev).y - w0.y)) });
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const st = useStore.getState();
    const d = st.activeId ? st.diagrams[st.activeId] : null;
    if (!d) return;
    const target = e.target as Element;
    const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null;
    const edgeId = target.closest('[data-edge-id]')?.getAttribute('data-edge-id') ?? null;
    const resizeId = target.closest('[data-resize]')?.getAttribute('data-resize') ?? null;

    if (e.button === 1 || space || st.tool.type === 'pan') {
      e.preventDefault();
      return startPan(e);
    }
    if (e.button !== 0) return;
    const p = toWorld(e);

    if (st.tool.type === 'node') return st.addNode(st.tool.kind, { x: snap(p.x), y: snap(p.y) });

    if (st.tool.type === 'edge') {
      const node = nodeId ? d.nodes.find((n) => n.id === nodeId) : null;
      if (!node || nodeSpec(d, node.kind).connectable === false) {
        if (st.pendingFrom) st.setPending(null);
        return;
      }
      if (!st.pendingFrom) st.setPending(node.id);
      else if (st.pendingFrom === node.id) st.setPending(null);
      else st.addEdge(st.tool.kind, st.pendingFrom, node.id);
      return;
    }

    if (resizeId) return startResize(resizeId);
    if (nodeId) return startNodeDrag(nodeId, e);
    if (edgeId) {
      st.select({ type: 'edge', id: edgeId });
      if (getSpec(d.type).verticalEdges) startEdgeDrag(edgeId, e);
      return;
    }
    st.select(null);
    startPan(e);
  };

  const hint = useMemo(() => {
    if (notice) return { text: notice, warn: true };
    if (!diagram) return null;
    if (tool.type === 'node') return { text: `Clique no quadro para posicionar: ${nodeSpec(diagram, tool.kind).label}. Esc cancela.` };
    if (tool.type === 'edge') {
      const label = getSpec(diagram.type).edgeKinds.find((k) => k.kind === tool.kind)?.label ?? '';
      return { text: pendingFrom ? `${label}: agora clique no destino.` : `${label}: clique na origem.` };
    }
    return null;
  }, [notice, tool, pendingFrom, diagram]);

  if (!diagram) return null;
  const cursorClass = grabbing ? 'cursor-grabbing' : space || tool.type === 'pan' ? 'cursor-grab' : tool.type === 'select' ? '' : 'cursor-crosshair';
  const grid = s.gridSize * vp.k;

  return (
    <div ref={wrapRef} className={s.root}>
      <svg
        ref={svgRef}
        className={`${s.svg} ${cursorClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => (pendingFrom ? setCursor(toWorld(e)) : cursor && setCursor(null))}
        onDoubleClick={(e) => {
          if ((e.target as Element).closest('[data-node-id]')) useStore.getState().focusLabel();
        }}
      >
        <defs>
          <pattern id="canvas-grid" width={grid} height={grid} patternUnits="userSpaceOnUse" patternTransform={`translate(${vp.tx} ${vp.ty})`}>
            <circle cx={1} cy={1} r={0.9} fill={s.gridDot} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />
        <g transform={`translate(${vp.tx} ${vp.ty}) scale(${vp.k})`}>
          <MarkerDefs />
          <DiagramContent key={fontTick} diagram={diagram} interactive selection={selection} pendingFrom={pendingFrom} cursor={cursor} />
        </g>
      </svg>

      {diagram.nodes.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>Quadro em branco</p>
          <p className={s.emptyText}>Escolha uma peça na barra de ferramentas e clique aqui para posicioná-la. Depois ligue as peças pelas ferramentas de relação.</p>
        </div>
      ) : null}

      {hint ? <StatusHint text={hint.text} warn={hint.warn} /> : null}
      <ZoomControls zoom={vp.k} onIn={() => zoomBy(1.2)} onOut={() => zoomBy(1 / 1.2)} onFit={fit} />
    </div>
  );
}
