import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snapUp, textWidth, uid } from '@/lib/geometry';
import type { DiagramNode, Member } from '@/types/diagram';
import { hl, linkKind, makeEdge, makeNode, noteKind, noteRule, SwLine, SwRect, sw } from '../shared';
import type { DiagramSpec, LegendItem, NodeKindSpec } from '../types';

const ROW = 20;
const CARDS = ['1', '0..1', '*', '0..*', '1..*'];

const member = (text: string, type?: string, visibility: Member['visibility'] = '+'): Member => ({ id: uid(), text, type, visibility });

const memberText = (m: Member, plain = false) =>
  plain ? m.text : `${m.visibility ?? '+'} ${m.text}${m.type ? `: ${m.type}` : ''}`;

interface Layout {
  w: number;
  h: number;
  headH: number;
  attrsH: number;
  methodsH: number;
  showAttrs: boolean;
  showMethods: boolean;
  stereotype?: string;
}

function layout(n: DiagramNode): Layout {
  const enumish = n.kind === 'enum';
  const iface = n.kind === 'interface';
  const showAttrs = !iface;
  const showMethods = !enumish;
  const stereotype = enumish ? '«enumeration»' : iface ? '«interface»' : n.flags.abstract ? '«abstract»' : undefined;
  const attrs = n.members ?? [];
  const methods = n.methods ?? [];
  const texts = [
    ...(showAttrs ? attrs.map((m) => textWidth(memberText(m, enumish), 10, 'mono')) : []),
    ...(showMethods ? methods.map((m) => textWidth(memberText(m), 10, 'mono')) : []),
  ];
  const w = Math.max(160, snapUp(Math.max(textWidth(n.label, 12, 'sans', 600) + 32, ...texts.map((t) => t + 28)), 8));
  const headH = stereotype ? 44 : 32;
  const attrsH = showAttrs ? attrs.length * ROW + 16 : 0;
  const methodsH = showMethods ? methods.length * ROW + 16 : 0;
  return { w, h: headH + attrsH + methodsH, headH, attrsH, methodsH, showAttrs, showMethods, stereotype };
}

function classLike(kind: 'class' | 'interface' | 'enum'): NodeKindSpec {
  const meta = {
    class: { label: 'Classe', hint: 'Classe com atributos e métodos.', icon: 'n-class' as const, members: 'class' as const },
    interface: { label: 'Interface', hint: 'Contrato com métodos; classes a realizam.', icon: 'n-interface' as const, members: 'interface' as const },
    enum: { label: 'Enum', hint: 'Conjunto fechado de valores.', icon: 'n-enum' as const, members: 'enum' as const },
  }[kind];
  return {
    kind,
    label: meta.label,
    hint: meta.hint,
    icon: meta.icon,
    members: meta.members,
    create: () => ({ label: meta.label === 'Classe' ? 'NovaClasse' : `Novo${meta.label}`, members: [], methods: [] }),
    size: (n) => {
      const l = layout(n);
      return { w: l.w, h: l.h };
    },
    flags: kind === 'class' ? [{ key: 'abstract', label: 'Abstrata (itálico)' }, { key: 'focal', label: 'Destaque (laranja)' }] : [{ key: 'focal', label: 'Destaque (laranja)' }],
    render: (n, ctx) => {
      const l = layout(n);
      const focal = n.flags.focal;
      const stroke = hl(ctx, focal ? C.accent : C.ink);
      const attrs = n.members ?? [];
      const methods = n.methods ?? [];
      const cx = n.x + l.w / 2;
      return (
        <g>
          <rect x={n.x} y={n.y} width={l.w} height={l.h} rx={6} fill={C.paper} />
          <rect x={n.x} y={n.y} width={l.w} height={l.h} rx={6} fill={focal ? C.accentTint : C.white} stroke={stroke} strokeWidth={sw(ctx)} />
          {l.stereotype ? (
            <SvgText x={cx} y={n.y + 15} size={10} family="mono" fill={C.soft}>
              {l.stereotype}
            </SvgText>
          ) : null}
          <SvgText x={cx} y={n.y + (l.stereotype ? 34 : 21)} weight={600} italic={!!n.flags.abstract}>
            {n.label}
          </SvgText>
          <line x1={n.x} y1={n.y + l.headH} x2={n.x + l.w} y2={n.y + l.headH} stroke={stroke} strokeWidth={1} opacity={0.6} />
          {l.showAttrs
            ? attrs.map((m, i) => (
                <SvgText key={m.id} x={n.x + 12} y={n.y + l.headH + 8 + i * ROW + 14} size={10} family="mono" anchor="start">
                  {memberText(m, kind === 'enum')}
                </SvgText>
              ))
            : null}
          {l.showAttrs && l.showMethods ? (
            <line x1={n.x} y1={n.y + l.headH + l.attrsH} x2={n.x + l.w} y2={n.y + l.headH + l.attrsH} stroke={stroke} strokeWidth={1} opacity={0.6} />
          ) : null}
          {l.showMethods
            ? methods.map((m, i) => (
                <SvgText key={m.id} x={n.x + 12} y={n.y + l.headH + l.attrsH + 8 + i * ROW + 14} size={10} family="mono" anchor="start">
                  {memberText(m)}
                </SvgText>
              ))
            : null}
        </g>
      );
    },
  };
}

const classKind = classLike('class');
const interfaceKind = classLike('interface');
const enumKind = classLike('enum');

const relFields = ['label', 'fromCard', 'toCard'] as const;

const Diamond = ({ filled }: { filled?: boolean }) => (
  <g>
    <line x1={14} y1={0} x2={32} y2={0} stroke={C.muted} />
    <polygon points="0,0 7,-4.5 14,0 7,4.5" fill={filled ? C.muted : C.paper} stroke={C.muted} strokeWidth={1} />
  </g>
);

export const classSpec: DiagramSpec = {
  type: 'class',
  label: 'Classes',
  description: 'Classes, interfaces, enums e relações UML com multiplicidade.',
  icon: 'dg-class',
  eyebrow: 'DIAGRAMA UML · CLASSES',
  cardOptions: CARDS,
  nodeKinds: [classKind, interfaceKind, enumKind, noteKind],
  edgeKinds: [
    { kind: 'association', label: 'Associação', hint: 'Relação estrutural entre duas classes, com multiplicidade.', icon: 'e-assoc', markers: () => ({}), fields: [...relFields] },
    { kind: 'directed', label: 'Associação direcionada', hint: 'Só a origem conhece o destino (navegabilidade).', icon: 'e-directed', markers: () => ({ end: 'arrow-open' }), fields: [...relFields] },
    { kind: 'inheritance', label: 'Herança', hint: 'Do filho para o pai (seta triangular vazada).', icon: 'e-inherit', markers: () => ({ end: 'tri-hollow' }), fields: [] },
    { kind: 'realization', label: 'Realização', hint: 'Da classe para a interface que ela implementa.', icon: 'e-realize', dashed: true, markers: () => ({ end: 'tri-hollow' }), fields: [] },
    { kind: 'aggregation', label: 'Agregação', hint: 'Todo-parte fraca. O losango fica na origem (o todo).', icon: 'e-aggregation', markers: () => ({ start: 'diamond-hollow' }), fields: [...relFields] },
    { kind: 'composition', label: 'Composição', hint: 'Todo-parte forte. O losango fica na origem (o todo).', icon: 'e-composition', markers: () => ({ start: 'diamond-filled' }), fields: [...relFields] },
    { kind: 'dependency', label: 'Dependência', hint: 'Uso eventual; a origem depende do destino.', icon: 'e-dependency', dashed: true, markers: () => ({ end: 'arrow-open' }), fields: ['label'] },
    linkKind,
  ],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    if (kind === 'inheritance') return a.kind === b.kind && a.kind !== 'enum';
    if (kind === 'realization') return a.kind === 'class' && b.kind === 'interface';
    return true;
  },
  legend: (d) => {
    const has = (k: string) => d.edges.some((e) => e.kind === k);
    const items: LegendItem[] = [];
    if (d.nodes.some((n) => n.flags.focal)) items.push({ label: 'Classe principal', width: 152, swatch: () => <SwRect focal /> });
    if (has('association')) items.push({ label: 'Associação', width: 128, swatch: () => <SwLine /> });
    if (has('directed')) items.push({ label: 'Direcionada', width: 128, swatch: () => <SwLine arrow /> });
    if (has('inheritance')) items.push({ label: 'Herança', width: 112, swatch: () => <SwLine tri /> });
    if (has('realization')) items.push({ label: 'Realização', width: 128, swatch: () => <SwLine dashed tri /> });
    if (has('aggregation')) items.push({ label: 'Agregação', width: 128, swatch: () => <Diamond /> });
    if (has('composition')) items.push({ label: 'Composição', width: 136, swatch: () => <Diamond filled /> });
    if (has('dependency')) items.push({ label: 'Dependência', width: 144, swatch: () => <SwLine dashed arrow /> });
    return items;
  },
  warnings: (d) => {
    const w: string[] = [];
    const classes = d.nodes.filter((n) => n.kind !== 'note').length;
    if (classes > 10) w.push(`${classes} tipos no diagrama: considere separar por pacote/módulo.`);
    return w;
  },
  example: () => {
    const usuario = makeNode(classKind, { label: 'Usuario', members: [member('id', 'UUID', '-'), member('nome', 'string', '-'), member('email', 'string', '-')], methods: [member('criarHabito(titulo)', 'Habito')] }, 180, 340);
    const habito = makeNode(
      classKind,
      {
        label: 'Habito',
        flags: { focal: true },
        members: [member('id', 'UUID', '-'), member('titulo', 'string', '-'), member('frequencia', 'Frequencia', '-'), member('ativo', 'boolean', '-')],
        methods: [member('concluir(data)', 'Registro'), member('arquivar()', 'void')],
      },
      560,
      340,
    );
    const registro = makeNode(classKind, { label: 'Registro', members: [member('data', 'Date', '-'), member('valor', 'number', '-')], methods: [] }, 940, 200);
    const meta = makeNode(classKind, { label: 'Meta', members: [member('alvo', 'number', '-'), member('prazo', 'Date', '-')], methods: [member('progresso()', 'number')] }, 400, 90);
    const frequencia = makeNode(enumKind, { label: 'Frequencia', members: [{ id: uid(), text: 'DIARIA' }, { id: uid(), text: 'SEMANAL' }, { id: uid(), text: 'MENSAL' }] }, 720, 90);
    const notificavel = makeNode(interfaceKind, { label: 'Notificavel', methods: [member('notificar(mensagem)', 'void')] }, 180, 640);
    const lembrete = makeNode(classKind, { label: 'Lembrete', members: [member('horario', 'Time', '-')], methods: [member('notificar(mensagem)', 'void')] }, 560, 640);
    return {
      name: 'Classes',
      title: 'Habit Tracker: classes',
      subtitle: 'Modelo de domínio do acompanhamento de hábitos',
      nodes: [usuario, habito, registro, meta, frequencia, notificavel, lembrete],
      edges: [
        makeEdge('association', usuario, habito, { label: 'possui', fromCard: '1', toCard: '0..*' }),
        makeEdge('composition', habito, registro, { label: 'gera', fromCard: '1', toCard: '0..*' }),
        makeEdge('association', habito, meta, { label: 'mira', fromCard: '1', toCard: '0..1' }),
        makeEdge('directed', habito, frequencia, { fromCard: '*', toCard: '1' }),
        makeEdge('composition', habito, lembrete, { fromCard: '1', toCard: '0..*' }),
        makeEdge('realization', lembrete, notificavel),
      ],
    };
  },
};
