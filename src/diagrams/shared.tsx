import type { DiagramEdge, DiagramNode } from '@/types/diagram';
import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snap, snapUp, textWidth, uid } from '@/lib/geometry';
import type { EdgeKindSpec, NodeCtx, NodeKindSpec } from './types';

export const hl = (ctx: NodeCtx, base: string) => (ctx.selected || ctx.pending ? C.link : base);
export const sw = (ctx: NodeCtx) => (ctx.selected || ctx.pending ? 1.6 : 1);

/** Quebra o texto em linhas que caibam em maxW (medido com a fonte real). */
export function wrapText(text: string, maxW: number, size = 12, family: 'sans' | 'mono' = 'sans'): string[] {
  const out: string[] = [];
  for (const para of (text || '').split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, size, family) > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export function makeNode(spec: NodeKindSpec, partial: Partial<DiagramNode>, cx: number, cy: number): DiagramNode {
  const base = spec.create();
  const node: DiagramNode = {
    id: uid(),
    kind: spec.kind,
    x: 0,
    y: 0,
    flags: {},
    ...base,
    ...partial,
  };
  const { w, h } = spec.size(node);
  node.x = snap(cx - w / 2);
  node.y = snap(cy - h / 2);
  return node;
}

export function makeEdge(kind: string, from: DiagramNode, to: DiagramNode, extra: Partial<DiagramEdge> = {}): DiagramEdge {
  return { id: uid(), kind, from: from.id, to: to.id, ...extra };
}

/** Nota: bloco de texto livre com canto dobrado, disponível em todos os diagramas. */
export const noteKind: NodeKindSpec = {
  kind: 'note',
  label: 'Nota',
  hint: 'Comentário livre; ligue-o a um elemento com a linha pontilhada.',
  icon: 'n-note',
  create: () => ({ label: 'Nota', text: 'Escreva aqui uma observação.', w: 176, h: 80 }),
  size: (n) => ({ w: n.w ?? 176, h: n.h ?? 80 }),
  resizable: true,
  textLabel: 'Texto',
  render: (n, ctx) => {
    const { w, h } = { w: n.w ?? 176, h: n.h ?? 80 };
    const fold = 16;
    const lines = wrapText(n.text ?? '', w - 24, 12).slice(0, Math.max(1, Math.floor((h - 20) / 16)));
    return (
      <g>
        <path
          d={`M ${n.x} ${n.y} H ${n.x + w - fold} L ${n.x + w} ${n.y + fold} V ${n.y + h} H ${n.x} Z`}
          fill={C.paper2}
          stroke={hl(ctx, C.soft)}
          strokeWidth={sw(ctx)}
        />
        <path d={`M ${n.x + w - fold} ${n.y} V ${n.y + fold} H ${n.x + w}`} fill="none" stroke={hl(ctx, C.soft)} strokeWidth={1} />
        {lines.map((l, i) => (
          <SvgText key={i} x={n.x + 12} y={n.y + 24 + i * 16} anchor="start" fill={C.muted}>
            {l}
          </SvgText>
        ))}
      </g>
    );
  },
};

export const linkKind: EdgeKindSpec = {
  kind: 'link',
  label: 'Ligar nota',
  hint: 'Linha pontilhada de uma nota até o elemento comentado.',
  icon: 'e-link',
  markers: () => ({}),
  fields: [],
};

/** Regra comum: notas só se ligam por 'link'. Devolve undefined quando a regra não se aplica. */
export function noteRule(a: DiagramNode, b: DiagramNode, kind: string): boolean | undefined {
  const involvesNote = a.kind === 'note' || b.kind === 'note';
  if (kind === 'link') return involvesNote && !(a.kind === 'note' && b.kind === 'note');
  if (involvesNote) return false;
  return undefined;
}

export const widthFor = (label: string, sub: string | undefined, pad: number, min: number, max = 400) =>
  Math.min(max, Math.max(min, snapUp(Math.max(textWidth(label, 12, 'sans', 600), sub ? textWidth(sub, 10, 'mono') : 0) + pad, 8)));

/* ---------- amostras da legenda (desenhadas em 0..32 de largura, centro em y=0) ---------- */

export const SwLine = ({ dashed, arrow, tri }: { dashed?: boolean; arrow?: boolean; tri?: boolean }) => (
  <g>
    <line x1={0} y1={0} x2={tri ? 22 : 32} y2={0} stroke={C.muted} strokeWidth={1} strokeDasharray={dashed ? '5,4' : undefined} />
    {arrow ? <polygon points="24,-3 32,0 24,3" fill={C.muted} /> : null}
    {tri ? <polygon points="22,-5 32,0 22,5" fill={C.paper} stroke={C.muted} strokeWidth={1} /> : null}
  </g>
);

export const SwEllipse = ({ focal, dashed }: { focal?: boolean; dashed?: boolean }) => (
  <ellipse
    cx={16}
    cy={0}
    rx={16}
    ry={9}
    fill={focal ? C.accentTint : C.white}
    stroke={focal ? C.accent : C.ink}
    strokeDasharray={dashed ? '4,3' : undefined}
  />
);

export const SwRect = ({ focal, double }: { focal?: boolean; double?: boolean }) => (
  <g>
    <rect x={0} y={-9} width={32} height={18} rx={2} fill={focal ? C.accentTint : C.white} stroke={focal ? C.accent : C.ink} />
    {double ? <rect x={3} y={-6} width={26} height={12} rx={1} fill="none" stroke={C.ink} /> : null}
  </g>
);
