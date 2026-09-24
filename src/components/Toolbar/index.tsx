import { Fragment } from 'react';
import { getSpec } from '@/diagrams';
import { useActiveDiagram, useStore } from '@/lib/store';
import type { Tool } from '@/types/diagram';
import { IconButton } from '../IconButton';
import { toolbarStyles as s } from './styles';

const sameTool = (a: Tool, b: Tool) => a.type === b.type && ('kind' in a && 'kind' in b ? a.kind === b.kind : true);

export function Toolbar() {
  const diagram = useActiveDiagram();
  const tool = useStore((st) => st.tool);
  const setTool = useStore((st) => st.setTool);
  if (!diagram) return null;
  const spec = getSpec(diagram.type);

  const groups: { key: string; items: { tool: Tool; icon: (typeof spec.nodeKinds)[number]['icon']; label: string; hotkey?: string }[] }[] = [
    {
      key: 'base',
      items: [
        { tool: { type: 'select' }, icon: 'select', label: 'Selecionar e mover', hotkey: 'V' },
        { tool: { type: 'pan' }, icon: 'pan', label: 'Navegar pelo quadro', hotkey: 'H' },
      ],
    },
    { key: 'nodes', items: spec.nodeKinds.map((k, i) => ({ tool: { type: 'node', kind: k.kind } as Tool, icon: k.icon, label: `${k.label}: ${k.hint}`, hotkey: String(i + 1) })) },
    {
      key: 'edges',
      items: spec.edgeKinds.map((k, i) => ({ tool: { type: 'edge', kind: k.kind } as Tool, icon: k.icon, label: `${k.label}: ${k.hint}`, hotkey: String(spec.nodeKinds.length + i + 1) })),
    },
  ];

  return (
    <div className={s.root} role="toolbar" aria-label="Ferramentas do diagrama">
      {groups.map((g, gi) => (
        <Fragment key={g.key}>
          {gi > 0 ? <span className={s.sep} /> : null}
          {g.items.map((it) => (
            <IconButton
              key={`${it.tool.type}-${'kind' in it.tool ? it.tool.kind : ''}`}
              icon={it.icon}
              label={it.hotkey ? `${it.label} (${it.hotkey})` : it.label}
              active={sameTool(tool, it.tool)}
              onClick={() => setTool(it.tool)}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
