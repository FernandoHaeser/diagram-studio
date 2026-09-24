import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Diagram, DiagramEdge, DiagramNode, DiagramMeta, DiagramType, Pt, Selection, Tool } from '@/types/diagram';
import { getSpec, nodeSpec, specList, specs } from '@/diagrams';
import { snap, uid } from './geometry';

interface History {
  past: Diagram[];
  future: Diagram[];
}

interface StoreState {
  diagrams: Record<string, Diagram>;
  order: string[];
  activeId: string | null;

  selection: Selection;
  tool: Tool;
  pendingFrom: string | null;
  notice: string | null;
  focusTick: number;
  fontTick: number;
  history: Record<string, History>;

  createDiagram: (type: DiagramType, withExample: boolean) => string;
  removeDiagram: (id: string) => void;
  duplicateDiagram: (id: string) => void;
  renameDiagram: (id: string, name: string) => void;
  setActive: (id: string) => void;
  updateMeta: (patch: Partial<DiagramMeta>) => void;

  setTool: (tool: Tool) => void;
  select: (sel: Selection) => void;
  setPending: (id: string | null) => void;
  setNotice: (text: string | null) => void;
  focusLabel: () => void;
  bumpFonts: () => void;

  checkpoint: () => void;
  undo: () => void;
  redo: () => void;

  addNode: (kind: string, at: Pt) => void;
  addChildNode: (parentId: string) => void;
  addEdge: (kind: string, fromId: string, toId: string) => boolean;
  updateNode: (id: string, patch: Partial<DiagramNode>) => void;
  updateEdge: (id: string, patch: Partial<DiagramEdge>) => void;
  setPositions: (pos: Record<string, Pt>) => void;
  resizeNode: (id: string, w: number, h: number) => void;
  reverseEdge: (id: string) => void;
  removeSelection: () => void;
  duplicateSelection: () => void;

  addDiagrams: (list: Diagram[]) => void;
  exportProject: () => string;
  importProject: (text: string) => { ok: true; count: number } | { ok: false; error: string };
}

const HISTORY_LIMIT = 100;

function buildDiagram(type: DiagramType, withExample: boolean): Diagram {
  const spec = getSpec(type);
  const ex = withExample ? spec.example() : { name: 'Sem título', title: '', subtitle: '', nodes: [], edges: [] };
  const now = Date.now();
  return {
    id: uid(),
    type,
    name: ex.name,
    nodes: ex.nodes,
    edges: ex.edges,
    meta: { eyebrow: spec.eyebrow, title: ex.title || ex.name, subtitle: ex.subtitle, header: true, legend: true },
    createdAt: now,
    updatedAt: now,
  };
}

const cloneMembers = <T extends { id: string }>(list?: T[]) => list?.map((m) => ({ ...m, id: uid() }));

/** Ângulos (graus) usados para distribuir filhos ao redor do pai, em anéis crescentes. */
const CHILD_ANGLES = [-90, -135, -45, 180, 0, 135, 45, -160, -20, 160, 20, -115, -65, 115, 65];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const active = () => {
        const { activeId, diagrams } = get();
        return activeId ? diagrams[activeId] : null;
      };
      const write = (d: Diagram) => set((s) => ({ diagrams: { ...s.diagrams, [d.id]: { ...d, updatedAt: Date.now() } } }));
      const patch = (fn: (d: Diagram) => Diagram) => {
        const d = active();
        if (d) write(fn(d));
      };

      return {
        diagrams: {},
        order: [],
        activeId: null,
        selection: null,
        tool: { type: 'select' },
        pendingFrom: null,
        notice: null,
        focusTick: 0,
        fontTick: 0,
        history: {},

        createDiagram: (type, withExample) => {
          const d = buildDiagram(type, withExample);
          set((s) => ({
            diagrams: { ...s.diagrams, [d.id]: d },
            order: [...s.order, d.id],
            activeId: d.id,
            selection: null,
            tool: { type: 'select' },
            pendingFrom: null,
          }));
          return d.id;
        },
        removeDiagram: (id) =>
          set((s) => {
            const { [id]: _gone, ...rest } = s.diagrams;
            const order = s.order.filter((x) => x !== id);
            const idx = s.order.indexOf(id);
            const activeId = s.activeId === id ? (order[Math.min(idx, order.length - 1)] ?? null) : s.activeId;
            return { diagrams: rest, order, activeId, selection: null, pendingFrom: null };
          }),
        duplicateDiagram: (id) => {
          const src = get().diagrams[id];
          if (!src) return;
          const copy: Diagram = JSON.parse(JSON.stringify(src));
          copy.id = uid();
          copy.name = `${src.name} (cópia)`;
          copy.createdAt = copy.updatedAt = Date.now();
          set((s) => ({ diagrams: { ...s.diagrams, [copy.id]: copy }, order: [...s.order, copy.id], activeId: copy.id, selection: null }));
        },
        renameDiagram: (id, name) => {
          const d = get().diagrams[id];
          if (!d) return;
          const meta = d.meta.title === d.name ? { ...d.meta, title: name } : d.meta;
          write({ ...d, name, meta });
        },
        setActive: (id) => set({ activeId: id, selection: null, pendingFrom: null, tool: { type: 'select' } }),
        updateMeta: (p) => patch((d) => ({ ...d, meta: { ...d.meta, ...p } })),

        setTool: (tool) => set({ tool, pendingFrom: null, notice: null }),
        select: (selection) => set({ selection }),
        setPending: (pendingFrom) => set({ pendingFrom }),
        setNotice: (notice) => set({ notice }),
        focusLabel: () => set((s) => ({ focusTick: s.focusTick + 1 })),
        bumpFonts: () => set((s) => ({ fontTick: s.fontTick + 1 })),

        checkpoint: () => {
          const d = active();
          if (!d) return;
          set((s) => {
            const h = s.history[d.id] ?? { past: [], future: [] };
            return { history: { ...s.history, [d.id]: { past: [...h.past, d].slice(-HISTORY_LIMIT), future: [] } } };
          });
        },
        undo: () => {
          const d = active();
          const h = d && get().history[d.id];
          if (!d || !h || !h.past.length) return;
          const prev = h.past[h.past.length - 1];
          set((s) => ({
            diagrams: { ...s.diagrams, [d.id]: prev },
            history: { ...s.history, [d.id]: { past: h.past.slice(0, -1), future: [...h.future, d] } },
            selection: null,
            pendingFrom: null,
          }));
        },
        redo: () => {
          const d = active();
          const h = d && get().history[d.id];
          if (!d || !h || !h.future.length) return;
          const next = h.future[h.future.length - 1];
          set((s) => ({
            diagrams: { ...s.diagrams, [d.id]: next },
            history: { ...s.history, [d.id]: { past: [...h.past, d], future: h.future.slice(0, -1) } },
            selection: null,
            pendingFrom: null,
          }));
        },

        addNode: (kind, at) => {
          const d = active();
          if (!d) return;
          const ks = nodeSpec(d, kind);
          const node: DiagramNode = { id: uid(), kind, x: 0, y: 0, flags: {}, ...ks.create() };
          if (kind !== 'note') {
            const used = new Set(d.nodes.filter((n) => n.kind === kind).map((n) => n.label));
            const sep = node.label.includes('_') ? '_' : ' ';
            for (let i = 2; used.has(node.label); i++) node.label = `${ks.create().label}${sep}${i}`;
          }
          const size = ks.size(node);
          const pos = ks.place ? ks.place(d, at, size) : { x: snap(at.x - size.w / 2), y: snap(at.y - size.h / 2) };
          node.x = pos.x;
          node.y = pos.y;
          get().checkpoint();
          write({ ...d, nodes: [...d.nodes, node] });
          set({ selection: { type: 'node', id: node.id }, tool: { type: 'select' }, pendingFrom: null });
          get().focusLabel();
        },
        addChildNode: (parentId) => {
          const d = active();
          const parent = d?.nodes.find((n) => n.id === parentId);
          if (!d || !parent) return;
          const ks = nodeSpec(d, parent.kind);
          if (!ks.addChild) return;
          const childSpec = nodeSpec(d, ks.addChild.kind);
          const siblings = d.edges.filter((e) => (e.from === parentId || e.to === parentId) && e.kind === ks.addChild!.edge).length;
          const ps = ks.size(parent);
          const angle = (CHILD_ANGLES[siblings % CHILD_ANGLES.length] * Math.PI) / 180;
          const ring = 1 + Math.floor(siblings / CHILD_ANGLES.length);
          const child: DiagramNode = { id: uid(), kind: childSpec.kind, x: 0, y: 0, flags: {}, ...childSpec.create() };
          const cs = childSpec.size(child);
          const cx = parent.x + ps.w / 2 + Math.cos(angle) * (ps.w / 2 + 88 + 24 * ring);
          const cy = parent.y + ps.h / 2 + Math.sin(angle) * (ps.h / 2 + 88 + 24 * ring);
          child.x = snap(cx - cs.w / 2);
          child.y = snap(cy - cs.h / 2);
          const edge: DiagramEdge = { id: uid(), kind: ks.addChild.edge, from: parentId, to: child.id };
          get().checkpoint();
          write({ ...d, nodes: [...d.nodes, child], edges: [...d.edges, edge] });
          set({ selection: { type: 'node', id: child.id } });
          get().focusLabel();
        },
        addEdge: (kind, fromId, toId) => {
          const d = active();
          if (!d) return false;
          const spec = getSpec(d.type);
          const ks = spec.edgeKinds.find((k) => k.kind === kind);
          const a = d.nodes.find((n) => n.id === fromId);
          const b = d.nodes.find((n) => n.id === toId);
          if (!ks || !a || !b) return false;
          if (spec.canConnect && !spec.canConnect(d, a, b, kind)) {
            set({ notice: `"${ks.label}" não se aplica entre ${a.label} e ${b.label}.` });
            return false;
          }
          const duplicate = d.type !== 'sequence' && d.edges.some((e) => e.kind === kind && ((e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)));
          if (duplicate) {
            set({ notice: 'Essas duas peças já estão ligadas por esse tipo de relação.' });
            return false;
          }
          const edge: DiagramEdge = { id: uid(), kind, from: fromId, to: toId, ...ks.defaults?.() };
          const next = { ...d, edges: [...d.edges, edge] };
          get().checkpoint();
          write(spec.afterConnect ? spec.afterConnect(next, edge) : next);
          set({ selection: { type: 'edge', id: edge.id }, pendingFrom: null, notice: null });
          return true;
        },
        updateNode: (id, p) => patch((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...p } : n)) })),
        updateEdge: (id, p) => patch((d) => ({ ...d, edges: d.edges.map((e) => (e.id === id ? { ...e, ...p } : e)) })),
        setPositions: (pos) => patch((d) => ({ ...d, nodes: d.nodes.map((n) => (pos[n.id] ? { ...n, ...pos[n.id] } : n)) })),
        resizeNode: (id, w, h) => patch((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, w, h } : n)) })),
        reverseEdge: (id) => {
          get().checkpoint();
          patch((d) => ({ ...d, edges: d.edges.map((e) => (e.id === id ? { ...e, from: e.to, to: e.from, fromCard: e.toCard, toCard: e.fromCard } : e)) }));
        },
        removeSelection: () => {
          const d = active();
          const sel = get().selection;
          if (!d || !sel) return;
          get().checkpoint();
          if (sel.type === 'node') write({ ...d, nodes: d.nodes.filter((n) => n.id !== sel.id), edges: d.edges.filter((e) => e.from !== sel.id && e.to !== sel.id) });
          else write({ ...d, edges: d.edges.filter((e) => e.id !== sel.id) });
          set({ selection: null });
        },
        duplicateSelection: () => {
          const d = active();
          const sel = get().selection;
          if (!d || sel?.type !== 'node') return;
          const src = d.nodes.find((n) => n.id === sel.id);
          if (!src) return;
          const copy: DiagramNode = { ...src, id: uid(), x: src.x + 24, y: src.y + 24, flags: { ...src.flags }, members: cloneMembers(src.members), methods: cloneMembers(src.methods) };
          get().checkpoint();
          write({ ...d, nodes: [...d.nodes, copy] });
          set({ selection: { type: 'node', id: copy.id } });
        },

        addDiagrams: (list) => {
          const added = list.map((d) => ({ ...d, id: uid(), meta: { ...buildDiagram(d.type, false).meta, ...d.meta }, updatedAt: Date.now() }));
          set((s) => ({
            diagrams: { ...s.diagrams, ...Object.fromEntries(added.map((d) => [d.id, d])) },
            order: [...s.order, ...added.map((d) => d.id)],
            activeId: added[0].id,
            selection: null,
            tool: { type: 'select' },
            pendingFrom: null,
          }));
        },

        exportProject: () => JSON.stringify({ app: 'diagram-studio', version: 1, diagrams: get().order.map((id) => get().diagrams[id]) }, null, 2),
        importProject: (text) => {
          try {
            const data = JSON.parse(text);
            const list: unknown = Array.isArray(data) ? data : data.diagrams;
            if (!Array.isArray(list)) return { ok: false, error: 'Arquivo sem lista de diagramas.' };
            const valid = list.filter((x): x is Diagram => !!x && typeof x === 'object' && x.type in specs && Array.isArray(x.nodes) && Array.isArray(x.edges));
            if (!valid.length) return { ok: false, error: 'Nenhum diagrama válido no arquivo.' };
            get().addDiagrams(valid);
            return { ok: true, count: valid.length };
          } catch {
            return { ok: false, error: 'Não foi possível ler o JSON.' };
          }
        },
      };
    },
    {
      name: 'diagram-studio:v1',
      version: 1,
      partialize: (s) => ({ diagrams: s.diagrams, order: s.order, activeId: s.activeId }),
    },
  ),
);

/** Na primeira visita, cria um exemplo de cada tipo para o usuário enxergar o que dá para fazer. */
export function seedIfEmpty() {
  const s = useStore.getState();
  if (s.order.length) return;
  specList.forEach((spec) => s.createDiagram(spec.type, true));
  useStore.getState().setActive(useStore.getState().order[0]);
}

export const useActiveDiagram = () => useStore((s) => (s.activeId ? s.diagrams[s.activeId] : null));
