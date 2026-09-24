import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snapUp, textWidth } from '@/lib/geometry';
import type { DiagramNode } from '@/types/diagram';
import { hl, linkKind, makeEdge, makeNode, noteKind, noteRule, SwEllipse, SwRect, sw } from '../shared';
import type { DiagramSpec, LegendItem, NodeKindSpec, Shape } from '../types';

const entityW = (n: DiagramNode) => Math.max(128, snapUp(textWidth(n.label, 12, 'sans', 600) + 48, 8));
const relW = (n: DiagramNode) => Math.max(128, snapUp(textWidth(n.label, 12, 'sans', 600) + 72, 8));
const attrW = (n: DiagramNode) => Math.max(88, snapUp(textWidth(n.label, 12, 'sans', 500) + 40, 8));
const ENTITY_H = 48;
const REL_H = 72;
const ATTR_H = 32;

const entityKind: NodeKindSpec = {
  kind: 'entity',
  label: 'Entidade',
  hint: 'Algo do mundo real sobre o qual guardamos dados.',
  icon: 'n-entity',
  create: () => ({ label: 'Entidade' }),
  size: (n) => ({ w: entityW(n), h: ENTITY_H }),
  flags: [{ key: 'weak', label: 'Entidade fraca (borda dupla)' }, { key: 'focal', label: 'Destaque (laranja)' }],
  addChild: { label: 'Adicionar atributo', kind: 'attribute', edge: 'attr' },
  render: (n, ctx) => {
    const w = entityW(n);
    const focal = n.flags.focal;
    const stroke = hl(ctx, focal ? C.accent : C.ink);
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={ENTITY_H} rx={4} fill={C.paper} />
        <rect x={n.x} y={n.y} width={w} height={ENTITY_H} rx={4} fill={focal ? C.accentTint : C.white} stroke={stroke} strokeWidth={sw(ctx)} />
        {n.flags.weak ? <rect x={n.x + 4} y={n.y + 4} width={w - 8} height={ENTITY_H - 8} rx={2} fill="none" stroke={stroke} strokeWidth={1} /> : null}
        <SvgText x={n.x + w / 2} y={n.y + ENTITY_H / 2 + 4} weight={600}>
          {n.label}
        </SvgText>
      </g>
    );
  },
};

const relationshipKind: NodeKindSpec = {
  kind: 'relationship',
  label: 'Relacionamento',
  hint: 'Associação entre entidades (verbo: possui, gera, participa).',
  icon: 'n-relationship',
  create: () => ({ label: 'relaciona' }),
  size: (n) => ({ w: relW(n), h: REL_H }),
  shape: (n): Shape => ({ kind: 'diamond', cx: n.x + relW(n) / 2, cy: n.y + REL_H / 2, hw: relW(n) / 2, hh: REL_H / 2 }),
  flags: [{ key: 'identifying', label: 'Identificador (borda dupla)' }],
  addChild: { label: 'Adicionar atributo', kind: 'attribute', edge: 'attr' },
  render: (n, ctx) => {
    const w = relW(n);
    const cx = n.x + w / 2;
    const cy = n.y + REL_H / 2;
    const pts = (inset: number) => `${cx},${n.y + inset} ${n.x + w - inset * 1.6},${cy} ${cx},${n.y + REL_H - inset} ${n.x + inset * 1.6},${cy}`;
    const stroke = hl(ctx, C.ink);
    return (
      <g>
        <polygon points={pts(0)} fill={C.paper} />
        <polygon points={pts(0)} fill={C.white} stroke={stroke} strokeWidth={sw(ctx)} />
        {n.flags.identifying ? <polygon points={pts(5)} fill="none" stroke={stroke} strokeWidth={1} /> : null}
        <SvgText x={cx} y={cy + 4} weight={500}>
          {n.label}
        </SvgText>
      </g>
    );
  },
};

const attributeKind: NodeKindSpec = {
  kind: 'attribute',
  label: 'Atributo',
  hint: 'Propriedade de uma entidade ou relacionamento.',
  icon: 'n-attribute',
  create: () => ({ label: 'atributo' }),
  size: (n) => ({ w: attrW(n), h: ATTR_H }),
  shape: (n): Shape => ({ kind: 'ellipse', cx: n.x + attrW(n) / 2, cy: n.y + ATTR_H / 2, hw: attrW(n) / 2, hh: ATTR_H / 2 }),
  flags: [
    { key: 'key', label: 'Chave (identificador, sublinhado)' },
    { key: 'derived', label: 'Derivado (tracejado)' },
    { key: 'multi', label: 'Multivalorado (borda dupla)' },
  ],
  render: (n, ctx) => {
    const w = attrW(n);
    const cx = n.x + w / 2;
    const cy = n.y + ATTR_H / 2;
    const stroke = hl(ctx, C.ink);
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={ATTR_H / 2} fill={C.paper} />
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={ATTR_H / 2} fill={C.white} stroke={stroke} strokeWidth={sw(ctx)} strokeDasharray={n.flags.derived ? '4,3' : undefined} />
        {n.flags.multi ? <ellipse cx={cx} cy={cy} rx={w / 2 - 4} ry={ATTR_H / 2 - 4} fill="none" stroke={stroke} strokeWidth={1} /> : null}
        <SvgText x={cx} y={cy + 4} weight={500} underline={!!n.flags.key}>
          {n.label}
        </SvgText>
      </g>
    );
  },
};

const Diamond = () => <polygon points="16,-9 32,0 16,9 0,0" fill={C.white} stroke={C.ink} strokeWidth={1} />;

export const erSpec: DiagramSpec = {
  type: 'er',
  label: 'ER conceitual',
  description: 'Entidades, relacionamentos e atributos na notação de Chen.',
  icon: 'dg-er',
  eyebrow: 'MODELAGEM DE DADOS · MODELO CONCEITUAL (ER)',
  cardOptions: ['1', 'N', '0..1', '1..N', '0..N'],
  nodeKinds: [entityKind, relationshipKind, attributeKind, noteKind],
  edgeKinds: [
    {
      kind: 'participation',
      label: 'Participação',
      hint: 'Liga entidade e relacionamento; informe a cardinalidade junto à entidade.',
      icon: 'e-assoc',
      markers: () => ({}),
      fields: ['fromCard', 'toCard'],
    },
    { kind: 'attr', label: 'Atributo', hint: 'Liga um atributo à entidade ou ao relacionamento.', icon: 'e-assoc', markers: () => ({}), fields: [] },
    linkKind,
  ],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    if (kind === 'attr') return a.kind === 'attribute' || b.kind === 'attribute';
    if (kind === 'participation') return (a.kind === 'entity' && b.kind === 'relationship') || (a.kind === 'relationship' && b.kind === 'entity');
    return false;
  },
  legend: (d) => {
    const items: LegendItem[] = [];
    if (d.nodes.some((n) => n.kind === 'entity')) items.push({ label: 'Entidade', width: 112, swatch: () => <SwRect /> });
    if (d.nodes.some((n) => n.kind === 'relationship')) items.push({ label: 'Relacionamento', width: 160, swatch: () => <Diamond /> });
    if (d.nodes.some((n) => n.kind === 'attribute')) items.push({ label: 'Atributo', width: 112, swatch: () => <SwEllipse /> });
    if (d.nodes.some((n) => n.flags.key)) items.push({ label: 'Chave (sublinhado)', width: 176, swatch: () => <SwEllipse /> });
    return items;
  },
  warnings: (d) => {
    const ents = d.nodes.filter((n) => n.kind === 'entity').length;
    return ents > 8 ? [`${ents} entidades: considere dividir o modelo por contexto.`] : [];
  },
  example: () => {
    const usuario = makeNode(entityKind, { label: 'Usuario', flags: { focal: true } }, 220, 340);
    const habito = makeNode(entityKind, { label: 'Habito', flags: { focal: true } }, 660, 340);
    const registro = makeNode(entityKind, { label: 'Registro' }, 1100, 340);
    const possui = makeNode(relationshipKind, { label: 'possui' }, 440, 340);
    const gera = makeNode(relationshipKind, { label: 'gera' }, 880, 340);
    const attrs = (owner: DiagramNode, cx: number, list: [string, boolean?][]) =>
      list.map(([label, key], i) => ({ owner, node: makeNode(attributeKind, { label, flags: { key: !!key } }, cx + (i - 1) * 104, 170) }));
    const all = [
      ...attrs(usuario, 220, [['nome'], ['id_usuario', true], ['email']]),
      ...attrs(habito, 660, [['titulo'], ['id_habito', true], ['frequencia']]),
      ...attrs(registro, 1100, [['data'], ['id_registro', true], ['valor']]),
    ];
    return {
      name: 'Modelo conceitual',
      title: 'Habit Tracker: modelo conceitual',
      subtitle: 'Entidades, relacionamentos e atributos (notação de Chen)',
      nodes: [usuario, habito, registro, possui, gera, ...all.map((a) => a.node)],
      edges: [
        makeEdge('participation', usuario, possui, { fromCard: '1' }),
        makeEdge('participation', possui, habito, { toCard: 'N' }),
        makeEdge('participation', habito, gera, { fromCard: '1' }),
        makeEdge('participation', gera, registro, { toCard: 'N' }),
        ...all.map((a) => makeEdge('attr', a.owner, a.node)),
      ],
    };
  },
};
