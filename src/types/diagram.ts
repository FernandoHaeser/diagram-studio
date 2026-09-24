export type DiagramType = 'usecase' | 'class' | 'er' | 'logical' | 'sequence' | 'architecture';

export interface Pt {
  x: number;
  y: number;
}

export interface Member {
  id: string;
  text: string;
  type?: string;
  visibility?: '+' | '-' | '#' | '~';
  pk?: boolean;
  fk?: boolean;
  nn?: boolean;
  uq?: boolean;
}

export interface DiagramNode {
  id: string;
  kind: string;
  /** Canto superior esquerdo. Todo nó usa essa convenção. */
  x: number;
  y: number;
  /** Só é persistido em nós redimensionáveis (fronteira, fragmento, nota). */
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  /** Etiqueta de tipo no canto da caixa (ex.: API, DB). */
  tag?: string;
  text?: string;
  flags: Record<string, boolean>;
  members?: Member[];
  methods?: Member[];
}

export interface DiagramEdge {
  id: string;
  kind: string;
  from: string;
  to: string;
  label?: string;
  fromCard?: string;
  toCard?: string;
  /** Posição vertical da mensagem (diagrama de sequência). */
  y?: number;
}

export interface DiagramMeta {
  eyebrow: string;
  title: string;
  subtitle: string;
  header: boolean;
  legend: boolean;
}

export interface Diagram {
  id: string;
  type: DiagramType;
  name: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  meta: DiagramMeta;
  createdAt: number;
  updatedAt: number;
}

export type Tool =
  | { type: 'select' }
  | { type: 'pan' }
  | { type: 'node'; kind: string }
  | { type: 'edge'; kind: string };

export type Selection = { type: 'node' | 'edge'; id: string } | null;

export interface Viewport {
  tx: number;
  ty: number;
  k: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
