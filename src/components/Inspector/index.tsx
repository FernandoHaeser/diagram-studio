import { useActiveDiagram, useStore } from '@/lib/store';
import { DiagramInspector } from '../DiagramInspector';
import { EdgeInspector } from '../EdgeInspector';
import { NodeInspector } from '../NodeInspector';
import { inspectorStyles as s } from './styles';

export function Inspector() {
  const diagram = useActiveDiagram();
  const selection = useStore((st) => st.selection);
  if (!diagram) return <aside className={s.root} />;

  const node = selection?.type === 'node' ? diagram.nodes.find((n) => n.id === selection.id) : undefined;
  const edge = selection?.type === 'edge' ? diagram.edges.find((e) => e.id === selection.id) : undefined;

  return (
    <aside className={s.root} aria-label="Propriedades">
      <div className={s.header}>{node ? 'Peça selecionada' : edge ? 'Relação selecionada' : 'Diagrama'}</div>
      {node ? <NodeInspector key={node.id} diagram={diagram} node={node} /> : null}
      {edge ? <EdgeInspector key={edge.id} diagram={diagram} edge={edge} /> : null}
      {!node && !edge ? <DiagramInspector diagram={diagram} /> : null}
    </aside>
  );
}
