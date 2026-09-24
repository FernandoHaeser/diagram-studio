import { SvgText } from '@/components/SvgText';
import { C } from '@/lib/tokens';
import { snap, snapUp, textWidth } from '@/lib/geometry';
import type { Diagram, DiagramEdge, DiagramNode, Pt } from '@/types/diagram';
import { hl, linkKind, makeEdge, makeNode, noteKind, noteRule, sw } from '../shared';
import type { DiagramSpec, LegendItem, NodeKindSpec } from '../types';

const ACTOR = { w: 96, h: 112 };
const isHead = (n: DiagramNode) => n.kind === 'participant' || n.kind === 'actor';
const isMessage = (e: DiagramEdge) => e.kind === 'sync' || e.kind === 'async' || e.kind === 'return';

const pW = (n: DiagramNode) => Math.max(128, snapUp(Math.max(textWidth(n.label, 12, 'sans', 600), n.sub ? textWidth(n.sub, 10, 'mono') : 0) + 32, 8));
const pH = (n: DiagramNode) => (n.sub ? 52 : 40);

const sizeOf = (n: DiagramNode) => (n.kind === 'actor' ? ACTOR : { w: pW(n), h: pH(n) });
const cxOf = (n: DiagramNode) => n.x + sizeOf(n).w / 2;

const placeHead: NodeKindSpec['place'] = (d, at, size) => {
  const heads = d.nodes.filter(isHead);
  return { x: snap(at.x - size.w / 2), y: heads.length ? Math.min(...heads.map((h) => h.y)) : 40 };
};

const participantKind: NodeKindSpec = {
  kind: 'participant',
  label: 'Participante',
  hint: 'Objeto, serviço ou sistema com linha de vida.',
  icon: 'n-participant',
  create: () => ({ label: 'Participante' }),
  size: (n) => ({ w: pW(n), h: pH(n) }),
  subLabel: 'Detalhe (mono)',
  lockY: true,
  place: placeHead,
  render: (n, ctx) => {
    const w = pW(n);
    const h = pH(n);
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={C.paper} />
        <rect x={n.x} y={n.y} width={w} height={h} rx={6} fill={C.white} stroke={hl(ctx, C.ink)} strokeWidth={sw(ctx)} />
        <SvgText x={n.x + w / 2} y={n.sub ? n.y + 22 : n.y + 24} weight={600}>
          {n.label}
        </SvgText>
        {n.sub ? (
          <SvgText x={n.x + w / 2} y={n.y + 40} size={10} family="mono" fill={C.soft}>
            {n.sub}
          </SvgText>
        ) : null}
      </g>
    );
  },
};

const actorKind: NodeKindSpec = {
  kind: 'actor',
  label: 'Ator',
  hint: 'Pessoa que inicia ou recebe interações.',
  icon: 'n-actor',
  create: () => ({ label: 'Ator' }),
  size: () => ACTOR,
  subLabel: 'Detalhe (mono)',
  lockY: true,
  place: placeHead,
  render: (n, ctx) => {
    const cx = n.x + ACTOR.w / 2;
    const color = hl(ctx, C.ink);
    return (
      <g>
        {ctx.interactive ? <rect x={n.x} y={n.y} width={ACTOR.w} height={ACTOR.h} fill="transparent" /> : null}
        <circle cx={cx} cy={n.y + 14} r={11} fill={C.paper} stroke={color} strokeWidth={1.2} />
        <path
          d={`M ${cx} ${n.y + 25} V ${n.y + 56} M ${cx - 24} ${n.y + 34} H ${cx + 24} M ${cx} ${n.y + 56} L ${cx - 18} ${n.y + 78} M ${cx} ${n.y + 56} L ${cx + 18} ${n.y + 78}`}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <SvgText x={cx} y={n.y + 96} weight={600} fill={color}>
          {n.label}
        </SvgText>
        {n.sub ? (
          <SvgText x={cx} y={n.y + 110} size={10} family="mono" fill={color}>
            {n.sub}
          </SvgText>
        ) : null}
      </g>
    );
  },
};

const fragmentKind: NodeKindSpec = {
  kind: 'fragment',
  label: 'Fragmento',
  hint: 'Região combinada: alt, opt, loop, par, break.',
  icon: 'n-fragment',
  create: () => ({ label: 'condição', sub: 'opt', w: 320, h: 120 }),
  size: (n) => ({ w: n.w ?? 320, h: n.h ?? 120 }),
  resizable: true,
  connectable: false,
  back: true,
  labelName: 'Condição',
  subLabel: 'Operador (alt, opt, loop, par)',
  render: (n, ctx) => {
    const w = n.w ?? 320;
    const h = n.h ?? 120;
    const op = n.sub || 'opt';
    const tw = textWidth(op, 12, 'sans', 600) + 24;
    const stroke = hl(ctx, C.muted);
    return (
      <g>
        <rect x={n.x} y={n.y} width={w} height={h} rx={2} fill="none" stroke={stroke} strokeWidth={sw(ctx)} />
        <path d={`M ${n.x} ${n.y} H ${n.x + tw} V ${n.y + 12} L ${n.x + tw - 8} ${n.y + 22} H ${n.x} Z`} fill={C.paper2} stroke={stroke} strokeWidth={1} />
        <SvgText x={n.x + (tw - 4) / 2} y={n.y + 15} weight={600}>
          {op}
        </SvgText>
        <SvgText x={n.x + tw + 12} y={n.y + 16} anchor="start" fill={C.muted}>
          {n.label ? `[${n.label}]` : ''}
        </SvgText>
      </g>
    );
  },
};

interface Bar {
  nodeId: string;
  y0: number;
  y1: number;
}

const yOf = (e: DiagramEdge) => e.y ?? 200;

function bars(d: Diagram): Bar[] {
  const msgs = d.edges.filter(isMessage);
  const out: Bar[] = [];
  for (const m of msgs) {
    if (m.kind !== 'sync' || m.from === m.to) continue;
    const back = msgs
      .filter((r) => r.kind === 'return' && r.from === m.to && r.to === m.from && yOf(r) > yOf(m))
      .sort((a, b) => yOf(a) - yOf(b))[0];
    out.push({ nodeId: m.to, y0: yOf(m) - 4, y1: back ? yOf(back) + 4 : yOf(m) + 32 });
  }
  return out;
}

const inBar = (all: Bar[], nodeId: string, y: number) => all.some((b) => b.nodeId === nodeId && y >= b.y0 && y <= b.y1);

function lifelineEnd(d: Diagram): number {
  const heads = d.nodes.filter(isHead);
  const base = Math.max(0, ...heads.map((h) => h.y + sizeOf(h).h));
  const lowest = Math.max(0, ...d.edges.filter(isMessage).map((e) => yOf(e) + (e.from === e.to ? 24 : 0)), ...d.nodes.filter((n) => n.kind === 'fragment').map((f) => f.y + (f.h ?? 120)));
  return snap(Math.max(base + 160, lowest + 56));
}

const Open = ({ dashed }: { dashed?: boolean }) => (
  <g>
    <line x1={0} y1={0} x2={30} y2={0} stroke={C.muted} strokeDasharray={dashed ? '5,4' : undefined} />
    <polyline points="24,-4 32,0 24,4" fill="none" stroke={C.muted} />
  </g>
);
const Filled = () => (
  <g>
    <line x1={0} y1={0} x2={26} y2={0} stroke={C.muted} />
    <polygon points="24,-3.5 32,0 24,3.5" fill={C.muted} />
  </g>
);

export const sequenceSpec: DiagramSpec = {
  type: 'sequence',
  label: 'Sequência',
  description: 'Participantes, mensagens no tempo, ativações e fragmentos.',
  icon: 'dg-sequence',
  eyebrow: 'DIAGRAMA UML · SEQUÊNCIA',
  verticalEdges: true,
  extent: (d) => {
    const heads = d.nodes.filter(isHead);
    if (!heads.length) return null;
    const xs = heads.map(cxOf);
    const y0 = Math.min(...heads.map((h) => h.y));
    return { x: Math.min(...xs), y: y0, w: Math.max(...xs) - Math.min(...xs), h: lifelineEnd(d) - y0 };
  },
  nodeKinds: [actorKind, participantKind, fragmentKind, noteKind],
  edgeKinds: [
    { kind: 'sync', label: 'Mensagem síncrona', hint: 'Chamada que espera resposta (seta cheia). Gera barra de ativação.', icon: 'e-sync', markers: () => ({ end: 'arrow' }), fields: ['label'], defaults: () => ({ label: 'mensagem()' }) },
    { kind: 'async', label: 'Mensagem assíncrona', hint: 'Envio sem esperar resposta (seta aberta).', icon: 'e-async', markers: () => ({ end: 'arrow-open' }), fields: ['label'], defaults: () => ({ label: 'evento' }) },
    { kind: 'return', label: 'Retorno', hint: 'Resposta a uma chamada (tracejada).', icon: 'e-return', dashed: true, markers: () => ({ end: 'arrow-open' }), fields: ['label'], defaults: () => ({ label: 'resposta' }) },
    linkKind,
  ],
  canConnect: (_d, a, b, kind) => {
    const note = noteRule(a, b, kind);
    if (note !== undefined) return note;
    return isHead(a) && isHead(b);
  },
  afterConnect: (d, edge) => {
    if (!isMessage(edge) || edge.y !== undefined) return d;
    const others = d.edges.filter((e) => e.id !== edge.id && isMessage(e));
    const headsBottom = Math.max(0, ...d.nodes.filter(isHead).map((h) => h.y + sizeOf(h).h));
    const next = snap(others.length ? Math.max(...others.map(yOf)) + 48 : headsBottom + 48);
    return { ...d, edges: d.edges.map((e) => (e.id === edge.id ? { ...e, y: next } : e)) };
  },
  route: (d) => {
    const all = bars(d);
    const byId = new Map(d.nodes.map((n) => [n.id, n]));
    const out: Record<string, Pt[]> = {};
    for (const e of d.edges) {
      if (!isMessage(e)) continue;
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b) continue;
      const y = yOf(e);
      if (a.id === b.id) {
        const x = cxOf(a) + (inBar(all, a.id, y) ? 6 : 0);
        out[e.id] = [
          { x, y },
          { x: x + 36, y },
          { x: x + 36, y: y + 24 },
          { x, y: y + 24 },
        ];
        continue;
      }
      const dir = cxOf(b) > cxOf(a) ? 1 : -1;
      out[e.id] = [
        { x: cxOf(a) + (inBar(all, a.id, y) ? dir * 6 : 0), y },
        { x: cxOf(b) - (inBar(all, b.id, y) ? dir * 6 : 0), y },
      ];
    }
    return out;
  },
  renderUnder: (d) => {
    const end = lifelineEnd(d);
    return (
      <g>
        {d.nodes.filter(isHead).map((n) => (
          <line key={n.id} x1={cxOf(n)} y1={n.y + sizeOf(n).h} x2={cxOf(n)} y2={end} stroke={C.soft} strokeWidth={1} strokeDasharray="4,4" />
        ))}
      </g>
    );
  },
  renderOver: (d) => {
    const byId = new Map(d.nodes.map((n) => [n.id, n]));
    return (
      <g>
        {bars(d).map((b, i) => {
          const n = byId.get(b.nodeId);
          if (!n) return null;
          return <rect key={i} x={cxOf(n) - 6} y={b.y0} width={12} height={b.y1 - b.y0} fill={C.white} stroke={C.ink} strokeWidth={1} />;
        })}
      </g>
    );
  },
  legend: (d) => {
    const items: LegendItem[] = [];
    if (d.edges.some((e) => e.kind === 'sync')) items.push({ label: 'Síncrona', width: 112, swatch: () => <Filled /> });
    if (d.edges.some((e) => e.kind === 'async')) items.push({ label: 'Assíncrona', width: 128, swatch: () => <Open /> });
    if (d.edges.some((e) => e.kind === 'return')) items.push({ label: 'Retorno', width: 112, swatch: () => <Open dashed /> });
    return items;
  },
  warnings: (d) => {
    const w: string[] = [];
    const heads = d.nodes.filter(isHead).length;
    const msgs = d.edges.filter(isMessage).length;
    if (heads > 6) w.push(`${heads} participantes: acima de 5-6 a leitura fica difícil.`);
    if (msgs > 20) w.push(`${msgs} mensagens: considere dividir em fluxos menores.`);
    return w;
  },
  example: () => {
    const usuario = makeNode(actorKind, { label: 'Usuário', y: 40 }, 120, 96);
    usuario.y = 40;
    const app = makeNode(participantKind, { label: 'App', sub: 'SPA React' }, 400, 66);
    const api = makeNode(participantKind, { label: 'API', sub: 'Node.js' }, 680, 66);
    const google = makeNode(participantKind, { label: 'Google', sub: 'OAuth 2.0' }, 960, 66);
    app.y = api.y = google.y = 40;
    const ys = [200, 248, 296, 344, 392, 440, 520, 592, 640];
    const m = (kind: string, from: DiagramNode, to: DiagramNode, label: string, i: number) => makeEdge(kind, from, to, { label, y: ys[i] });
    const edges = [
      m('sync', usuario, app, 'clica em Entrar com Google', 0),
      m('sync', app, google, 'GET /authorize', 1),
      m('return', google, app, 'código de autorização', 2),
      m('sync', app, api, 'POST /auth/google {código}', 3),
      m('sync', api, google, 'troca código por tokens', 4),
      m('return', google, api, 'id_token', 5),
      m('sync', api, api, 'valida token e cria sessão', 6),
      m('return', api, app, 'JWT de sessão', 7),
      m('return', app, usuario, 'abre o painel', 8),
    ];
    const frag = makeNode(fragmentKind, { label: 'primeiro acesso', sub: 'opt', w: 488, h: 96 }, 0, 0);
    frag.x = 440;
    frag.y = 464;
    return { name: 'Login com Google',
      title: 'Habit Tracker: login com Google', subtitle: 'Fluxo de autenticação OAuth 2.0', nodes: [frag, usuario, app, api, google], edges };
  },
};
