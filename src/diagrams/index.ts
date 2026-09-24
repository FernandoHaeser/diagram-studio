import type { Diagram, DiagramType } from '@/types/diagram';
import { architectureSpec } from './architecture';
import { classSpec } from './class';
import { erSpec } from './er';
import { logicalSpec } from './logical';
import { sequenceSpec } from './sequence';
import { usecaseSpec } from './usecase';
import type { DiagramSpec, EdgeKindSpec, NodeKindSpec } from './types';

export const specs: Record<DiagramType, DiagramSpec> = {
  usecase: usecaseSpec,
  class: classSpec,
  er: erSpec,
  logical: logicalSpec,
  sequence: sequenceSpec,
  architecture: architectureSpec,
};

export const specList: DiagramSpec[] = [architectureSpec, usecaseSpec, classSpec, erSpec, logicalSpec, sequenceSpec];

export const getSpec = (type: DiagramType): DiagramSpec => specs[type];

export function nodeSpec(d: Diagram, kind: string): NodeKindSpec {
  const found = specs[d.type].nodeKinds.find((k) => k.kind === kind);
  if (!found) throw new Error(`Tipo de nó desconhecido: ${kind}`);
  return found;
}

export function edgeSpec(d: Diagram, kind: string): EdgeKindSpec {
  const found = specs[d.type].edgeKinds.find((k) => k.kind === kind);
  if (!found) throw new Error(`Tipo de aresta desconhecido: ${kind}`);
  return found;
}
