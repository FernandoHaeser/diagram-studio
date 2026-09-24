import { getSpec } from '@/diagrams';
import { useActiveDiagram, useStore } from '@/lib/store';
import { ExportMenu } from '../ExportMenu';
import { IconButton } from '../IconButton';
import { topBarStyles as s } from './styles';

export function TopBar() {
  const diagram = useActiveDiagram();
  const rename = useStore((st) => st.renameDiagram);
  const undo = useStore((st) => st.undo);
  const redo = useStore((st) => st.redo);
  const canUndo = useStore((st) => (st.activeId ? (st.history[st.activeId]?.past.length ?? 0) > 0 : false));
  const canRedo = useStore((st) => (st.activeId ? (st.history[st.activeId]?.future.length ?? 0) > 0 : false));
  if (!diagram) return null;

  return (
    <header className={s.root}>
      <div className={s.left}>
        <p className={s.eyebrow}>{getSpec(diagram.type).label}</p>
        <input className={s.name} aria-label="Nome do diagrama" value={diagram.name} onChange={(e) => rename(diagram.id, e.target.value)} />
      </div>
      <div className={s.right}>
        <IconButton icon="undo" label="Desfazer (⌘Z)" onClick={undo} disabled={!canUndo} />
        <IconButton icon="redo" label="Refazer (⇧⌘Z)" onClick={redo} disabled={!canRedo} />
        <span className={s.sep} />
        <ExportMenu />
      </div>
    </header>
  );
}
