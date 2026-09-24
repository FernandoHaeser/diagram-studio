import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snap, textWidth, uid } from '@/lib/geometry';
import type { DiagramEdge, DiagramNode } from '@/types/diagram';
import { hl, linkKind, noteKind, noteRule, sw, widthFor } from '../shared';
import type { DiagramSpec, LegendItem, NodeKindSpec, Shape } from '../types';

const BOX_H = 64;

const boxW = (n: DiagramNode) => n.w ?? widthFor(n.label, n.sub, 48, 128, 240);
const boxH = (n: DiagramNode) => n.h ?? BOX_H;

interface BoxStyle {
  fill: string;
  stroke: string;
  dash?: string;
  tag: string;
  tagStroke: string;
}

/** Tratamento visual por tipo de nó, igual à tabela "node type → treatment" do diagram-design. */
export function boxStyle(flags: Record<string, boolean>): BoxStyle {
  if (flags.focal) return { fill: C.accentTint, stroke: C.accent, tag: C.accent, tagStroke: 'rgba(235,108,54,0.50)' };
  if (flags.security) return { fill: 'rgba(235,108,54,0.05)', stroke: 'rgba(235,108,54,0.50)', dash: '4,4', tag: C.accent, tagStroke: 'rgba(235,108,54,0.40)' };
  if (flags.optional) return { fill: 'rgba(45,49,66,0.02)', stroke: 'rgba(45,49,66,0.20)', dash: '4,3', tag: C.soft, tagStroke: 'rgba(45,49,66,0.20)' };
  if (flags.store) return { fill: C.store, stroke: C.muted, tag: C.muted, tagStroke: 'rgba(79,93,117,0.40)' };
  if (flags.external) return { fill: 'rgba(45,49,66,0.03)', stroke: 'rgba(45,49,66,0.30)', tag: C.soft, tagStroke: 'rgba(45,49,66,0.22)' };
  return { fill: C.white, stroke: C.ink, tag: C.ink, tagStroke: 'rgba(45,49,66,0.40)' };
}

const boxKind: NodeKindSpec = {
  kind: 'box',
  label: 'Caixa',
  hint: 'Componente, serviço, etapa ou sistema.',
  icon: 'n-box',
  create: () => ({ label: 'Componente', sub: '', tag: '' }),
  size: (n) => ({ w: boxW(n), h: boxH(n) }),
  shape: (n): Shape => ({
    kind: n.flags.diamond ? 'diamond' : n.flags.round ? 'ellipse' : 'rect',
    cx: n.x + boxW(n) / 2,
    cy: n.y + boxH(n) / 2,
    hw: boxW(n) / 2,
    hh: boxH(n) / 2,
  }),
  resizable: true,
  subLabel: 'Detalhe (mono)',
  tagLabel: 'Etiqueta de tipo (ex.: API, DB)',
  flags: [
    { key: 'focal', label: 'Destaque (laranja, no máx. 2)' },
    { key: 'store', label: 'Armazenamento' },
    { key: 'external', label: 'Externo' },
    { key: 'optional', label: 'Opcional / assíncrono (tracejado)' },
    { key: 'security', label: 'Segurança / limite (tracejado laranja)' },
    { key: 'round', label: 'Formato elíptico' },
    { key: 'diamond', label: 'Decisão (losango)' },
  ],
  render: (n, ctx) => {
    const w = boxW(n);
    const h = boxH(n);
    const st = boxStyle(n.flags);
    const stroke = hl(ctx, st.stroke);
    const cx = n.x + w / 2;
    const cy = n.y + h / 2;
    const tagW = n.tag ? Math.max(28, Math.ceil(textWidth(n.tag, 7, 'mono') + 12)) : 0;
    return (
      <g>
        {n.flags.diamond ? (
          <>
            <polygon points={`${cx},${n.y} ${n.x + w},${cy} ${cx},${n.y + h} ${n.x},${cy}`} fill={C.paper} />
            <polygon points={`${cx},${n.y} ${n.x + w},${cy} ${cx},${n.y + h} ${n.x},${cy}`} fill={st.fill} stroke={stroke} strokeWidth={sw(ctx)} strokeDasharray={st.dash} />
          </>
        ) : n.flags.round ? (
          <>
            <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={C.paper} />
            <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={st.fill} stroke={stroke} strokeWidth={sw(ctx)} strokeDasharray={st.dash} />
          </>
        ) : (
          <>
            <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={C.paper} />
            <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={st.fill} stroke={stroke} strokeWidth={sw(ctx)} strokeDasharray={st.dash} />
          </>
        )}
        {n.tag && !n.flags.round && !n.flags.diamond ? (
          <g>
            <rect x={n.x + 8} y={n.y + 8} width={tagW} height={12} rx={2} fill="transparent" stroke={st.tagStroke} strokeWidth={0.8} />
            <SvgText x={n.x + 8 + tagW / 2} y={n.y + 17} size={7} family="mono" fill={st.tag} spacing="0.08em">
              {n.tag}
            </SvgText>
          </g>
        ) : null}
        <SvgText x={cx} y={cy + 4} weight={600}>
          {n.label}
        </SvgText>
        {n.sub ? (
          <SvgText x={cx} y={cy + 20} size={9} family="mono" fill={C.muted}>
            {n.sub}
          </SvgText>
        ) : null}
      </g>
    );
  },
};

const zoneKind: NodeKindSpec = {
  kind: 'zone',
  label: 'Zona',
  hint: 'Agrupa componentes (camada, domínio, rede). Arraste para levar o que está dentro.',
  icon: 'n-system',
  create: () => ({ label: 'ZONA', w: 320, h: 200 }),
  size: (n) => ({ w: n.w ?? 320, h: n.h ?? 200 }),
  resizable: true,
  container: true,
  connectable: false,
  back: true,
  labelName: 'Nome da zona',
  render: (n, ctx) => {
    const w = n.w ?? 320;
    const h = n.h ?? 200;
    const text = n.label.toUpperCase();
    const tw = textWidth(text, 7, 'mono') + text.length * 1 + 16;
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={h} rx={8} fill="rgba(45,49,66,0.02)" stroke={hl(ctx, 'rgba(45,49,66,0.16)')} strokeWidth={ctx.selected ? 1.6 : 0.8} />
        <rect x={n.x + w / 2 - tw / 2} y={n.y + 4} width={tw} height={12} rx={2} fill={C.paper} />
        <SvgText x={n.x + w / 2} y={n.y + 13} size={7} family="mono" fill="rgba(45,49,66,0.55)" spacing="0.14em">
          {text}
        </SvgText>
      </g>
    );
  },
};

const arrow = (kind: string, label: string, hint: string, extra: Partial<DiagramSpec['edgeKinds'][number]>): DiagramSpec['edgeKinds'][number] => ({
  kind,
  label,
  hint,
  icon: 'e-directed',
  labelMono: true,
  markers: () => ({ end: 'arrow' }),
  fields: ['label'],
  ...extra,
});

const Swatch = ({ flags }: { flags: Record<string, boolean> }) => {
  const st = boxStyle(flags);
  return <rect x={0} y={-9} width={32} height={18} rx={3} fill={st.fill} stroke={st.stroke} strokeDasharray={st.dash} />;
};

export const architectureSpec: DiagramSpec = {
  type: 'architecture',
  label: 'Arquitetura',
  description: 'Caixas, zonas e setas: arquitetura, fluxo e processos. Destino dos diagramas importados.',
  icon: 'dg-architecture',
  eyebrow: 'ARQUITETURA · DIAGRAMA',
  nodeKinds: [boxKind, zoneKind, noteKind],
  edgeKinds: [
    arrow('arrow', 'Seta', 'Fluxo interno ou genérico.', {}),
    arrow('accent', 'Seta de destaque', 'Fluxo principal (laranja).', { icon: 'e-accent', color: C.accent, markers: () => ({ end: 'arrow-accent' }) }),
    arrow('api', 'Chamada externa', 'HTTP/API ou sistema externo (azul).', { icon: 'e-api', color: C.link, markers: () => ({ end: 'arrow-link' }) }),
    arrow('dashed', 'Seta tracejada', 'Opcional, assíncrono ou retorno.', { icon: 'e-include', dashed: true }),
    arrow('line', 'Linha', 'Conexão sem direção.', { icon: 'e-assoc', markers: () => ({}) }),
    linkKind,
  ],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    return a.kind === 'box' && b.kind === 'box';
  },
  legend: (d) => {
    const items: LegendItem[] = [];
    const boxes = d.nodes.filter((n) => n.kind === 'box');
    const has = (f: string) => boxes.some((n) => n.flags[f]);
    const used = (k: string) => d.edges.some((e: DiagramEdge) => e.kind === k);
    if (has('focal')) items.push({ label: 'Foco', width: 96, swatch: () => <Swatch flags={{ focal: true }} /> });
    if (has('store')) items.push({ label: 'Armazenamento', width: 168, swatch: () => <Swatch flags={{ store: true }} /> });
    if (has('external')) items.push({ label: 'Externo', width: 120, swatch: () => <Swatch flags={{ external: true }} /> });
    if (has('optional')) items.push({ label: 'Opcional', width: 128, swatch: () => <Swatch flags={{ optional: true }} /> });
    if (has('security')) items.push({ label: 'Segurança / limite', width: 176, swatch: () => <Swatch flags={{ security: true }} /> });
    const line = (color: string, marker: string, dashed?: boolean) => () => (
      <g>
        <line x1={0} y1={0} x2={28} y2={0} stroke={color} strokeDasharray={dashed ? '5,4' : undefined} />
        <polygon points="24,-3 32,0 24,3" fill={marker} />
      </g>
    );
    if (used('arrow')) items.push({ label: 'Fluxo', width: 96, swatch: line(C.muted, C.muted) });
    if (used('accent')) items.push({ label: 'Fluxo principal', width: 152, swatch: line(C.accent, C.accent) });
    if (used('api')) items.push({ label: 'Chamada externa', width: 168, swatch: line(C.link, C.link) });
    if (used('dashed')) items.push({ label: 'Opcional / retorno', width: 168, swatch: line(C.muted, C.muted, true) });
    return items;
  },
  warnings: (d) => {
    const w: string[] = [];
    const boxes = d.nodes.filter((n) => n.kind === 'box').length;
    const focal = d.nodes.filter((n) => n.flags.focal).length;
    if (boxes > 9) w.push(`${boxes} caixas: acima de 9, considere dividir em visão geral + detalhe.`);
    if (focal > 2) w.push(`${focal} destaques: o laranja funciona com 1 ou 2.`);
    if (d.edges.length > 12) w.push(`${d.edges.length} conexões: acima de 12 fica difícil de acompanhar.`);
    return w;
  },
  example: () => {
    const box = (x: number, y: number, w: number, h: number, label: string, sub: string, tag: string, flags: Record<string, boolean> = {}): DiagramNode => ({
      id: uid(),
      kind: 'box',
      x: snap(x),
      y: snap(y),
      w,
      h,
      label,
      sub,
      tag,
      flags,
    });
    const zone: DiagramNode = { id: uid(), kind: 'zone', x: 616, y: 128, w: 164, h: 272, label: 'CONTENT', flags: {} };
    const reader = box(40, 240, 128, 64, 'Reader', 'Browser', 'EXT', { external: true });
    const edge = box(220, 240, 144, 64, 'Cloudflare', 'Pages · cache', 'EDGE', { external: true });
    const astro = box(416, 240, 160, 64, 'Astro Origin', 'SSR + MDX', 'ORIG', { focal: true });
    const mdx = box(628, 160, 144, 64, 'MDX Bundle', 'build', 'BUN');
    const cms = box(628, 320, 144, 64, 'CMS', 'headless', 'DB', { store: true });
    const e = (kind: string, from: DiagramNode, to: DiagramNode, label: string): DiagramEdge => ({ id: uid(), kind, from: from.id, to: to.id, label });
    return {
      name: 'Arquitetura',
      title: 'Site de conteúdo em produção',
      subtitle: 'Do leitor até a origem, com cache na borda',
      nodes: [zone, reader, edge, astro, mdx, cms],
      edges: [e('api', reader, edge, 'HTTPS'), e('accent', edge, astro, 'SSR'), e('arrow', astro, mdx, 'READ MDX'), e('arrow', astro, cms, 'QUERY'), e('dashed', edge, reader, 'RESP')],
    };
  },
};
