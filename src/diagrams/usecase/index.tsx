import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { textWidth } from '@/lib/geometry';
import type { DiagramNode } from '@/types/diagram';
import { hl, linkKind, makeEdge, makeNode, noteKind, noteRule, SwEllipse, SwLine, sw, widthFor } from '../shared';
import type { DiagramSpec, NodeKindSpec, Shape } from '../types';

const UC_H = 64;
const ACTOR = { w: 96, h: 152 };

const ucWidth = (n: DiagramNode) => widthFor(n.label, n.sub, 56, 144, 320);

const actorKind: NodeKindSpec = {
  kind: 'actor',
  label: 'Ator',
  hint: 'Quem interage com o sistema (pessoa ou sistema externo).',
  icon: 'n-actor',
  create: () => ({ label: 'Ator' }),
  size: () => ACTOR,
  shape: (n): Shape => ({ kind: 'rect', cx: n.x + ACTOR.w / 2, cy: n.y + 58, hw: 36, hh: 54 }),
  flags: [{ key: 'external', label: 'Sistema externo (cinza)' }],
  subLabel: 'Detalhe (mono)',
  render: (n, ctx) => {
    const cx = n.x + ACTOR.w / 2;
    const color = hl(ctx, n.flags.external ? C.muted : C.ink);
    return (
      <g>
        {ctx.interactive ? <rect x={n.x} y={n.y} width={ACTOR.w} height={ACTOR.h} fill="transparent" /> : null}
        <circle cx={cx} cy={n.y + 18} r={14} fill={C.paper} stroke={color} strokeWidth={1.2} />
        <path
          d={`M ${cx} ${n.y + 32} V ${n.y + 78} M ${cx - 32} ${n.y + 44} H ${cx + 32} M ${cx} ${n.y + 78} L ${cx - 26} ${n.y + 110} M ${cx} ${n.y + 78} L ${cx + 26} ${n.y + 110}`}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <SvgText x={cx} y={n.y + 132} weight={600} fill={color}>
          {n.label}
        </SvgText>
        {n.sub ? (
          <SvgText x={cx} y={n.y + 146} size={10} family="mono" fill={color}>
            {n.sub}
          </SvgText>
        ) : null}
      </g>
    );
  },
};

const useCaseKind: NodeKindSpec = {
  kind: 'usecase',
  label: 'Caso de uso',
  hint: 'Uma funcionalidade que entrega valor a um ator.',
  icon: 'n-usecase',
  create: () => ({ label: 'Caso de uso' }),
  size: (n) => ({ w: ucWidth(n), h: UC_H }),
  shape: (n): Shape => ({ kind: 'ellipse', cx: n.x + ucWidth(n) / 2, cy: n.y + UC_H / 2, hw: ucWidth(n) / 2, hh: UC_H / 2 }),
  flags: [{ key: 'focal', label: 'Destaque (laranja, no máx. 2)' }],
  subLabel: 'Detalhe (mono)',
  render: (n, ctx) => {
    const w = ucWidth(n);
    const cx = n.x + w / 2;
    const cy = n.y + UC_H / 2;
    const focal = n.flags.focal;
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={UC_H / 2} fill={C.paper} />
        <ellipse
          cx={cx}
          cy={cy}
          rx={w / 2}
          ry={UC_H / 2}
          fill={focal ? C.accentTint : C.white}
          stroke={hl(ctx, focal ? C.accent : C.ink)}
          strokeWidth={sw(ctx)}
        />
        <SvgText x={cx} y={n.sub ? cy - 2 : cy + 4} weight={600}>
          {n.label}
        </SvgText>
        {n.sub ? (
          <SvgText x={cx} y={cy + 12} size={10} family="mono" fill={C.soft}>
            {n.sub}
          </SvgText>
        ) : null}
      </g>
    );
  },
};

const systemKind: NodeKindSpec = {
  kind: 'system',
  label: 'Fronteira',
  hint: 'Limite do sistema; arraste para carregar o que está dentro.',
  icon: 'n-system',
  create: () => ({ label: 'Sistema', w: 480, h: 360 }),
  size: (n) => ({ w: n.w ?? 480, h: n.h ?? 360 }),
  resizable: true,
  container: true,
  connectable: false,
  back: true,
  labelName: 'Nome do sistema',
  render: (n, ctx) => {
    const w = n.w ?? 480;
    const h = n.h ?? 360;
    const tab = Math.max(64, textWidth(n.label, 12, 'sans', 600) + 24);
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={h} rx={8} fill="none" stroke={hl(ctx, C.ink)} strokeWidth={sw(ctx)} />
        <rect x={n.x + 16} y={n.y - 8} width={tab} height={16} fill={C.paper} />
        <SvgText x={n.x + 16 + tab / 2} y={n.y + 4} weight={600}>
          {n.label}
        </SvgText>
      </g>
    );
  },
};

export const usecaseSpec: DiagramSpec = {
  type: 'usecase',
  label: 'Casos de uso',
  description: 'Atores, funcionalidades e as relações include/extend.',
  icon: 'dg-usecase',
  eyebrow: 'DIAGRAMA UML · CASOS DE USO',
  nodeKinds: [actorKind, useCaseKind, systemKind, noteKind],
  edgeKinds: [
    { kind: 'assoc', label: 'Associação', hint: 'Ator participa do caso de uso (linha simples, sem seta).', icon: 'e-assoc', markers: () => ({}), fields: [] },
    { kind: 'include', label: '«include»', hint: 'O caso de uso base sempre usa o incluído. Seta do base para o incluído.', icon: 'e-include', dashed: true, stereotype: '«include»', markers: () => ({ end: 'arrow' }), fields: [] },
    { kind: 'extend', label: '«extend»', hint: 'Comportamento opcional. Seta de quem estende para o caso base.', icon: 'e-extend', dashed: true, stereotype: '«extend»', markers: () => ({ end: 'arrow' }), fields: [] },
    { kind: 'generalization', label: 'Generalização', hint: 'Especialização entre atores ou entre casos de uso.', icon: 'e-inherit', markers: () => ({ end: 'tri-hollow' }), fields: [] },
    linkKind,
  ],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    if (a.kind === 'system' || b.kind === 'system') return false;
    switch (kind) {
      case 'assoc':
        return a.kind !== b.kind;
      case 'include':
      case 'extend':
        return a.kind === 'usecase' && b.kind === 'usecase';
      case 'generalization':
        return a.kind === b.kind;
      default:
        return false;
    }
  },
  legend: (d) => {
    const items = [];
    if (d.nodes.some((n) => n.kind === 'usecase' && n.flags.focal)) items.push({ label: 'Caso de uso principal', width: 176, swatch: () => <SwEllipse focal /> });
    if (d.nodes.some((n) => n.kind === 'usecase')) items.push({ label: 'Caso de uso', width: 136, swatch: () => <SwEllipse /> });
    if (d.edges.some((e) => e.kind === 'assoc')) items.push({ label: 'Associação', width: 128, swatch: () => <SwLine /> });
    if (d.edges.some((e) => e.kind === 'include' || e.kind === 'extend')) items.push({ label: '«include» / «extend»', width: 184, swatch: () => <SwLine dashed arrow /> });
    if (d.edges.some((e) => e.kind === 'generalization')) items.push({ label: 'Generalização', width: 144, swatch: () => <SwLine tri /> });
    return items;
  },
  warnings: (d) => {
    const w: string[] = [];
    const focal = d.nodes.filter((n) => n.flags.focal).length;
    const ucs = d.nodes.filter((n) => n.kind === 'usecase').length;
    if (focal > 2) w.push(`${focal} destaques: acima de 2 o laranja deixa de indicar o que é focal.`);
    if (ucs > 12) w.push(`${ucs} casos de uso: considere dividir em um diagrama por módulo.`);
    return w;
  },
  example: () => {
    const actor = actorKind;
    const uc = useCaseKind;
    const system = makeNode(systemKind, { label: 'Sistema Habit Tracker', w: 672, h: 912 }, 0, 0);
    system.x = 260;
    system.y = 24;
    const list: [string, string, boolean?][] = [
      ['Gerenciar hábitos', 'criar/editar/excluir', true],
      ['Mover cards de tarefa', 'kanban', true],
      ['Definir metas', ''],
      ['Escolher visualização', 'kanban/semanal/lista'],
      ['Registrar progresso', ''],
      ['Visualizar estatísticas', ''],
      ['Sincronizar calendário', ''],
      ['Interagir em comunidade', 'a confirmar'],
      ['Acompanhar gamificação', ''],
      ['Fazer login', 'google/facebook/e-mail'],
    ];
    const ucs = list.map(([label, sub, focal], i) => makeNode(uc, { label, sub, flags: { focal: !!focal } }, 440, 80 + 88 * i));
    const grafico = makeNode(uc, { label: 'Ver gráfico de progresso' }, 780, 80 + 88 * 5);
    const auth = makeNode(uc, { label: 'Autenticar via provedor' }, 780, 80 + 88 * 9);
    const user = makeNode(actor, { label: 'Usuário' }, 90, 450);
    const provider = makeNode(actor, { label: 'Provedor', sub: 'google/facebook/e-mail', flags: { external: true } }, 1000, 872);
    const edges = [
      ...ucs.map((u) => makeEdge('assoc', user, u)),
      makeEdge('include', ucs[5], grafico),
      makeEdge('extend', auth, ucs[9]),
      makeEdge('assoc', provider, auth),
    ];
    return {
      name: 'Casos de uso',
      title: 'Habit Tracker: casos de uso',
      subtitle: 'Ator Usuário interagindo com o sistema de acompanhamento de hábitos',
      nodes: [system, ...ucs, grafico, auth, user, provider],
      edges,
    };
  },
};
