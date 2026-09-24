import type { ReactNode } from 'react';
import { markerStyles as s } from './styles';

/**
 * Todos os marcadores têm a ponta em (0,0) e crescem para x negativo;
 * `auto-start-reverse` faz o mesmo desenho servir para o início e o fim da linha.
 */
function Marker({ id, children }: { id: string; children: ReactNode }) {
  return (
    <marker
      id={id}
      viewBox="-24 -10 28 20"
      markerWidth={28}
      markerHeight={20}
      refX={0}
      refY={0}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
      overflow="visible"
    >
      {children}
    </marker>
  );
}

const line = { stroke: s.stroke, strokeWidth: s.width, fill: 'none' } as const;
const crow = (
  <>
    <path d="M -12 0 L 0 -6 M -12 0 L 0 6" {...line} />
    <path d="M -12 0 H 0" {...line} />
  </>
);

export function MarkerDefs() {
  return (
    <defs>
      <Marker id="arrow">
        <polygon points="-8,-3 0,0 -8,3" fill={s.fill} />
      </Marker>
      <Marker id="arrow-accent">
        <polygon points="-8,-3 0,0 -8,3" fill="#eb6c36" />
      </Marker>
      <Marker id="arrow-link">
        <polygon points="-8,-3 0,0 -8,3" fill="#2e5aa8" />
      </Marker>
      <Marker id="arrow-open">
        <polyline points="-8,-4 0,0 -8,4" {...line} />
      </Marker>
      <Marker id="tri-hollow">
        <polygon points="-12,-6 0,0 -12,6" fill={s.paper} stroke={s.stroke} strokeWidth={s.width} />
      </Marker>
      <Marker id="diamond-hollow">
        <polygon points="0,0 -8,-5 -16,0 -8,5" fill={s.paper} stroke={s.stroke} strokeWidth={s.width} />
      </Marker>
      <Marker id="diamond-filled">
        <polygon points="0,0 -8,-5 -16,0 -8,5" fill={s.fill} stroke={s.stroke} strokeWidth={s.width} />
      </Marker>
      <Marker id="cf-one">
        <path d="M -6 -6 V 6 M -11 -6 V 6" {...line} />
      </Marker>
      <Marker id="cf-zero-one">
        <path d="M -6 -6 V 6" {...line} />
        <circle cx={-13} cy={0} r={3.5} fill={s.paper} stroke={s.stroke} strokeWidth={s.width} />
      </Marker>
      <Marker id="cf-many">
        {crow}
        <path d="M -15 -6 V 6" {...line} />
      </Marker>
      <Marker id="cf-zero-many">
        {crow}
        <circle cx={-17} cy={0} r={3.5} fill={s.paper} stroke={s.stroke} strokeWidth={s.width} />
      </Marker>
    </defs>
  );
}
