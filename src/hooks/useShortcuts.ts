import { useEffect, useRef } from 'react';
import { specs } from '@/diagrams';
import { useStore } from '@/lib/store';
import type { Tool } from '@/types/diagram';

interface Options {
  onSpace: (down: boolean) => void;
  onFit: () => void;
  onZoom: (factor: number) => void;
}

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

/** Atalhos globais do editor (ignorados enquanto o foco está num campo de texto). */
export function useShortcuts({ onSpace, onFit, onZoom }: Options) {
  const nudgeAt = useRef(0);
  const opts = useRef({ onSpace, onFit, onZoom });
  opts.current = { onSpace, onFit, onZoom };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      const st = useStore.getState();
      const d = st.activeId ? st.diagrams[st.activeId] : null;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        opts.current.onSpace(true);
        return;
      }
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        st.redo();
        return;
      }
      if (mod && key === 'd') {
        e.preventDefault();
        st.duplicateSelection();
        return;
      }
      if (mod && key === 'c') {
        e.preventDefault();
        st.copySelection();
        return;
      }
      if (mod && key === 'x') {
        e.preventDefault();
        st.cutSelection();
        return;
      }
      if (mod && key === 'v') {
        e.preventDefault();
        st.pasteClipboard();
        return;
      }
      if (mod) return;
      if (key === 'escape') {
        st.setTool({ type: 'select' });
        st.select(null);
        return;
      }
      if ((key === 'delete' || key === 'backspace') && st.selection) {
        e.preventDefault();
        st.removeSelection();
        return;
      }
      if (key === '0') return opts.current.onFit();
      if (key === '=' || key === '+') return opts.current.onZoom(1.2);
      if (key === '-') return opts.current.onZoom(1 / 1.2);
      if (key === 'v') return st.setTool({ type: 'select' });
      if (key === 'h') return st.setTool({ type: 'pan' });

      if (d && /^[1-9]$/.test(key)) {
        const spec = specs[d.type];
        const tools: Tool[] = [
          ...spec.nodeKinds.map((k): Tool => ({ type: 'node', kind: k.kind })),
          ...spec.edgeKinds.map((k): Tool => ({ type: 'edge', kind: k.kind })),
        ];
        const t = tools[Number(key) - 1];
        if (t) st.setTool(t);
        return;
      }

      if (key.startsWith('arrow') && st.selection?.type === 'node' && d) {
        e.preventDefault();
        const step = e.shiftKey ? 16 : 4;
        const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
        const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
        const n = d.nodes.find((x) => x.id === st.selection!.id);
        if (!n) return;
        const now = Date.now();
        if (now - nudgeAt.current > 600) st.checkpoint();
        nudgeAt.current = now;
        st.setPositions({ [n.id]: { x: n.x + dx, y: n.y + dy } });
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') opts.current.onSpace(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}
