import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snapUp, textWidth, uid } from '@/lib/geometry';
import type { DiagramEdge, DiagramNode, Member } from '@/types/diagram';
import { hl, linkKind, makeEdge, makeNode, noteKind, noteRule, SwLine, SwRect, sw } from '../shared';
import type { DiagramSpec, LegendItem, MarkerId, NodeKindSpec } from '../types';

const HEAD = 32;
const ROW = 24;
const TAGS = 48;

const CARDS = ['1', '0..1', 'N', '0..N'];

const cardMarker = (card?: string): MarkerId | undefined => {
  switch (card) {
    case '1':
      return 'cf-one';
    case '0..1':
      return 'cf-zero-one';
    case 'N':
    case '1..N':
    case '*':
    case '1..*':
      return 'cf-many';
    case '0..N':
    case '0..*':
      return 'cf-zero-many';
    default:
      return undefined;
  }
};

const typeText = (m: Member) => `${m.type ?? ''}${m.nn ? ' NN' : ''}${m.uq ? ' UQ' : ''}`.trim();

function tableW(n: DiagramNode): number {
  const rows = n.members ?? [];
  const name = Math.max(0, ...rows.map((m) => textWidth(m.text, 12, 'sans', 500)));
  const type = Math.max(0, ...rows.map((m) => textWidth(typeText(m), 10, 'mono')));
  return Math.max(200, snapUp(Math.max(textWidth(n.label, 12, 'sans', 600) + 32, 12 + TAGS + name + 24 + type + 12), 8));
}
const tableH = (n: DiagramNode) => HEAD + (n.members ?? []).length * ROW + 8;

const Tag = ({ x, y, text, color }: { x: number; y: number; text: string; color: string }) => (
  <g>
    <rect x={x} y={y - 9} width={20} height={12} rx={2} fill="none" stroke={color} strokeWidth={0.8} opacity={0.7} />
    <SvgText x={x + 10} y={y} size={8} family="mono" fill={color} weight={500} spacing="0.04em">
      {text}
    </SvgText>
  </g>
);

const tableKind: NodeKindSpec = {
  kind: 'table',
  label: 'Tabela',
  hint: 'Tabela com colunas, chave primária (PK) e estrangeira (FK).',
  icon: 'n-table',
  members: 'table',
  create: () => ({
    label: 'nova_tabela',
    members: [{ id: uid(), text: 'id', type: 'INT', pk: true, nn: true }],
  }),
  size: (n) => ({ w: tableW(n), h: tableH(n) }),
  flags: [{ key: 'focal', label: 'Destaque (laranja)' }],
  render: (n, ctx) => {
    const w = tableW(n);
    const h = tableH(n);
    const focal = n.flags.focal;
    const stroke = hl(ctx, focal ? C.accent : C.ink);
    const rows = n.members ?? [];
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={C.paper} />
        <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={C.white} stroke={stroke} strokeWidth={sw(ctx)} />
        <path
          d={`M ${n.x} ${n.y + HEAD} V ${n.y + 6} Q ${n.x} ${n.y} ${n.x + 6} ${n.y} H ${n.x + w - 6} Q ${n.x + w} ${n.y} ${n.x + w} ${n.y + 6} V ${n.y + HEAD} Z`}
          fill={focal ? C.accentTint : C.store}
        />
        <line x1={n.x} y1={n.y + HEAD} x2={n.x + w} y2={n.y + HEAD} stroke={stroke} strokeWidth={1} opacity={0.6} />
        <SvgText x={n.x + w / 2} y={n.y + 21} weight={600}>
          {n.label}
        </SvgText>
        {rows.map((m, i) => {
          const y = n.y + HEAD + 4 + i * ROW + 16;
          return (
            <g key={m.id}>
              {m.pk ? <Tag x={n.x + 12} y={y} text="PK" color={C.ink} /> : null}
              {m.fk ? <Tag x={n.x + 12 + (m.pk ? 24 : 0)} y={y} text="FK" color={C.link} /> : null}
              <SvgText x={n.x + 12 + TAGS} y={y} anchor="start" weight={m.pk ? 600 : 500} underline={false}>
                {m.text}
              </SvgText>
              <SvgText x={n.x + w - 12} y={y} anchor="end" size={10} family="mono" fill={C.soft}>
                {typeText(m)}
              </SvgText>
            </g>
          );
        })}
      </g>
    );
  },
};

const rel = (kind: 'identifying' | 'non-identifying'): DiagramSpec['edgeKinds'][number] => ({
  kind,
  label: kind === 'identifying' ? 'Relação identificadora' : 'Relação não identificadora',
  hint:
    kind === 'identifying'
      ? 'A chave do pai compõe a chave primária do filho (linha sólida).'
      : 'A chave do pai é só uma coluna comum no filho (linha tracejada).',
  icon: kind === 'identifying' ? 'e-relation' : 'e-relation-dashed',
  dashed: kind === 'non-identifying',
  markers: (e: DiagramEdge) => ({ start: cardMarker(e.fromCard), end: cardMarker(e.toCard) }),
  fields: ['label', 'fromCard', 'toCard'],
  defaults: () => ({ fromCard: '1', toCard: '0..N' }),
});

export const logicalSpec: DiagramSpec = {
  type: 'logical',
  label: 'ER lógico',
  description: 'Tabelas, colunas, PK/FK e cardinalidade em pé-de-galinha.',
  icon: 'dg-logical',
  eyebrow: 'MODELAGEM DE DADOS · MODELO LÓGICO',
  cardOptions: CARDS,
  nodeKinds: [tableKind, noteKind],
  edgeKinds: [rel('non-identifying'), rel('identifying'), linkKind],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    return a.kind === 'table' && b.kind === 'table';
  },
  afterConnect: (d, edge) => {
    if (edge.kind === 'link') return d;
    const parent = d.nodes.find((n) => n.id === edge.from);
    const child = d.nodes.find((n) => n.id === edge.to);
    if (!parent || !child || parent.id === child.id) return d;
    const pk = (parent.members ?? []).find((m) => m.pk);
    if (!pk) return d;
    const existing = child.members ?? [];
    // Se o nome da PK já existe no filho (ex.: ambas têm "id"), a FK vira "<tabela>_<pk>".
    const name = existing.some((m) => m.text === pk.text) ? `${parent.label}_${pk.text}` : pk.text;
    if (existing.some((m) => m.text === name)) return d;
    const identifying = edge.kind === 'identifying';
    const fk: Member = { id: uid(), text: name, type: pk.type, fk: true, pk: identifying, nn: identifying || edge.toCard !== '0..1' };
    return { ...d, nodes: d.nodes.map((n) => (n.id === child.id ? { ...n, members: [...(n.members ?? []), fk] } : n)) };
  },
  legend: (d) => {
    const items: LegendItem[] = [];
    const cols = d.nodes.flatMap((n) => n.members ?? []);
    if (d.nodes.some((n) => n.kind === 'table')) items.push({ label: 'Tabela', width: 96, swatch: () => <SwRect /> });
    if (cols.some((m) => m.pk)) items.push({ label: 'PK: chave primária', width: 176, swatch: () => <Tag x={6} y={4} text="PK" color={C.ink} /> });
    if (cols.some((m) => m.fk)) items.push({ label: 'FK: chave estrangeira', width: 192, swatch: () => <Tag x={6} y={4} text="FK" color={C.link} /> });
    if (d.edges.some((e) => e.kind === 'identifying')) items.push({ label: 'Identificadora', width: 144, swatch: () => <SwLine /> });
    if (d.edges.some((e) => e.kind === 'non-identifying')) items.push({ label: 'Não identificadora', width: 168, swatch: () => <SwLine dashed /> });
    return items;
  },
  warnings: (d) => {
    const w: string[] = [];
    const tables = d.nodes.filter((n) => n.kind === 'table');
    if (tables.length > 8) w.push(`${tables.length} tabelas: considere dividir por módulo.`);
    const noPk = tables.filter((t) => !(t.members ?? []).some((m) => m.pk));
    if (noPk.length) w.push(`Sem chave primária: ${noPk.map((t) => t.label).join(', ')}.`);
    return w;
  },
  example: () => {
    const col = (text: string, type: string, o: Partial<Member> = {}): Member => ({ id: uid(), text, type, ...o });
    const usuarios = makeNode(
      tableKind,
      { label: 'usuarios', members: [col('id_usuario', 'INT', { pk: true, nn: true }), col('nome', 'VARCHAR(120)', { nn: true }), col('email', 'VARCHAR(160)', { nn: true, uq: true }), col('criado_em', 'TIMESTAMP', { nn: true })] },
      200,
      240,
    );
    const habitos = makeNode(
      tableKind,
      {
        label: 'habitos',
        flags: { focal: true },
        members: [col('id_habito', 'INT', { pk: true, nn: true }), col('id_usuario', 'INT', { fk: true, nn: true }), col('titulo', 'VARCHAR(120)', { nn: true }), col('frequencia', 'VARCHAR(10)', { nn: true }), col('ativo', 'BOOLEAN', { nn: true })],
      },
      640,
      240,
    );
    const registros = makeNode(tableKind, { label: 'registros', members: [col('id_registro', 'INT', { pk: true, nn: true }), col('id_habito', 'INT', { fk: true, nn: true }), col('data', 'DATE', { nn: true }), col('valor', 'DECIMAL(10,2)')] }, 1080, 240);
    const metas = makeNode(tableKind, { label: 'metas', members: [col('id_meta', 'INT', { pk: true, nn: true }), col('id_habito', 'INT', { fk: true, nn: true, uq: true }), col('alvo', 'DECIMAL(10,2)', { nn: true }), col('prazo', 'DATE')] }, 640, 560);
    return {
      name: 'Modelo lógico',
      title: 'Habit Tracker: modelo lógico',
      subtitle: 'Tabelas, chaves e cardinalidade',
      nodes: [usuarios, habitos, registros, metas],
      edges: [
        makeEdge('non-identifying', usuarios, habitos, { label: 'possui', fromCard: '1', toCard: '0..N' }),
        makeEdge('non-identifying', habitos, registros, { label: 'gera', fromCard: '1', toCard: '0..N' }),
        makeEdge('non-identifying', habitos, metas, { label: 'mira', fromCard: '1', toCard: '0..1' }),
      ],
    };
  },
};
