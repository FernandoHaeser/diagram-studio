import type { ReactNode } from 'react';
import type { Diagram, DiagramEdge, DiagramNode, DiagramType, Pt, Rect } from '@/types/diagram';
import type { IconName } from '@/components/Icon';

export interface Shape {
  kind: 'rect' | 'ellipse' | 'diamond';
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

export interface NodeCtx {
  selected: boolean;
  pending: boolean;
  interactive: boolean;
}

export type MarkerId =
  | 'arrow'
  | 'arrow-open'
  | 'arrow-accent'
  | 'arrow-link'
  | 'tri-hollow'
  | 'diamond-hollow'
  | 'diamond-filled'
  | 'cf-one'
  | 'cf-zero-one'
  | 'cf-many'
  | 'cf-zero-many';

export type EdgeField = 'label' | 'fromCard' | 'toCard';

export interface FlagSpec {
  key: string;
  label: string;
}

export interface NodeKindSpec {
  kind: string;
  label: string;
  hint: string;
  icon: IconName;
  create: () => Omit<Partial<DiagramNode>, 'id' | 'kind' | 'x' | 'y'> & { label: string };
  size: (n: DiagramNode) => { w: number; h: number };
  shape?: (n: DiagramNode) => Shape;
  render: (n: DiagramNode, ctx: NodeCtx) => ReactNode;
  flags?: FlagSpec[];
  tagLabel?: string;
  subLabel?: string;
  textLabel?: string;
  /** Nome do campo principal no inspector (padrão: "Nome"). */
  labelName?: string;
  resizable?: boolean;
  container?: boolean;
  connectable?: boolean;
  members?: 'class' | 'interface' | 'enum' | 'table';
  /** Botão "adicionar" no inspector: cria um nó filho já ligado ao pai (ex.: atributo de uma entidade). */
  addChild?: { label: string; kind: string; edge: string };
  /** Mantém o nó na linha horizontal (participantes de sequência). */
  lockY?: boolean;
  /** Desenha por trás das arestas (fronteiras, fragmentos). */
  back?: boolean;
  place?: (diagram: Diagram, at: Pt, size: { w: number; h: number }) => Pt;
}

export interface EdgeMarkers {
  start?: MarkerId;
  end?: MarkerId;
}

export interface EdgeKindSpec {
  kind: string;
  label: string;
  hint: string;
  icon: IconName;
  dashed?: boolean;
  markers: (e: DiagramEdge) => EdgeMarkers;
  stereotype?: string;
  /** Cor do traço (padrão: azul-ardósia). */
  color?: string;
  /** Rótulo em mono 8px, como nas setas do diagram-design. */
  labelMono?: boolean;
  fields: EdgeField[];
  defaults?: () => Partial<DiagramEdge>;
}

export interface LegendItem {
  label: string;
  width: number;
  swatch: () => ReactNode;
}

export interface DiagramSpec {
  type: DiagramType;
  label: string;
  description: string;
  icon: IconName;
  eyebrow: string;
  nodeKinds: NodeKindSpec[];
  edgeKinds: EdgeKindSpec[];
  cardOptions?: string[];
  canConnect?: (diagram: Diagram, from: DiagramNode, to: DiagramNode, kind: string) => boolean;
  /** Rota própria das arestas (ex.: mensagens de sequência). */
  route?: (diagram: Diagram) => Record<string, Pt[]>;
  /** Área extra ocupada por elementos que não são nós (ex.: linhas de vida). */
  extent?: (diagram: Diagram) => Rect | null;
  /** Camada desenhada por trás de tudo (ex.: linhas de vida). */
  renderUnder?: (diagram: Diagram) => ReactNode;
  /** Camada entre as linhas de vida e as mensagens (ex.: barras de ativação). */
  renderOver?: (diagram: Diagram) => ReactNode;
  /** Chamado depois de criar uma aresta; pode ajustar o diagrama (ex.: criar a coluna FK). */
  afterConnect?: (diagram: Diagram, edge: DiagramEdge) => Diagram;
  /** Arestas se movem só na vertical (mensagens de sequência). */
  verticalEdges?: boolean;
  legend: (diagram: Diagram) => LegendItem[];
  warnings: (diagram: Diagram) => string[];
  example: () => Pick<Diagram, 'nodes' | 'edges'> & { name: string; title: string; subtitle: string };
}
