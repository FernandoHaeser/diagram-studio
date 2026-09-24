import { useCallback, useEffect, useRef, useState } from 'react';
import type { Rect, Viewport } from '@/types/diagram';
import { clamp } from '@/lib/geometry';

const cache = new Map<string, Viewport>();
const MIN_K = 0.2;
const MAX_K = 3;

interface Size {
  w: number;
  h: number;
}

/** Pan/zoom por diagrama, guardado só em memória (persistir a cada gesto reescreveria o localStorage). */
export function useViewport(diagramId: string | null, size: Size, getBounds: () => Rect | null) {
  const [vp, setVp] = useState<Viewport>({ tx: 0, ty: 0, k: 1 });
  const sizeRef = useRef(size);
  const boundsRef = useRef(getBounds);
  sizeRef.current = size;
  boundsRef.current = getBounds;
  const ready = size.w > 0 && size.h > 0;
  const initialized = useRef<string | null>(null);

  const fit = useCallback(() => {
    const { w, h } = sizeRef.current;
    const b = boundsRef.current();
    if (!w || !h) return;
    if (!b) return setVp({ tx: w / 2, ty: h / 2, k: 1 });
    const pad = 96;
    const k = clamp(Math.min((w - pad * 2) / Math.max(b.w, 1), (h - pad * 2) / Math.max(b.h, 1)), MIN_K, 1.25);
    setVp({ k, tx: (w - b.w * k) / 2 - b.x * k, ty: (h - b.h * k) / 2 - b.y * k + 24 });
  }, []);

  useEffect(() => {
    if (!diagramId || !ready) return;
    const cached = cache.get(diagramId);
    if (cached) setVp(cached);
    else fit();
    initialized.current = diagramId;
  }, [diagramId, ready, fit]);

  useEffect(() => {
    if (diagramId && initialized.current === diagramId) cache.set(diagramId, vp);
  }, [diagramId, vp]);

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setVp((v) => {
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const r = k / v.k;
      return { k, tx: px - (px - v.tx) * r, ty: py - (py - v.ty) * r };
    });
  }, []);

  const zoomBy = useCallback((factor: number) => zoomAt(sizeRef.current.w / 2, sizeRef.current.h / 2, factor), [zoomAt]);

  return { vp, setVp, fit, zoomAt, zoomBy };
}
