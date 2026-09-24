import { useState } from 'react';
import { importAndNotify } from '@/lib/importer';
import { useActiveDiagram } from '@/lib/store';
import { Canvas } from '../Canvas';
import { DropOverlay } from '../DropOverlay';
import { EmptyState } from '../EmptyState';
import { Inspector } from '../Inspector';
import { Sidebar } from '../Sidebar';
import { Toolbar } from '../Toolbar';
import { TopBar } from '../TopBar';
import { shellStyles as s } from './styles';

export function AppShell() {
  const diagram = useActiveDiagram();
  const [dragging, setDragging] = useState(false);
  const hasFiles = (e: React.DragEvent) => [...e.dataTransfer.types].includes('Files');

  return (
    <div
      className={s.root}
      onDragEnter={(e) => hasFiles(e) && setDragging(true)}
      onDragOver={(e) => hasFiles(e) && e.preventDefault()}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setDragging(false);
        for (const file of e.dataTransfer.files) void importAndNotify(file);
      }}
    >
      {dragging ? <DropOverlay /> : null}
      <Sidebar />
      <main className={s.main}>
        {diagram ? (
          <>
            <TopBar />
            <div className={s.stage}>
              <Canvas key={diagram.id} />
              <Toolbar />
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>
      <Inspector />
    </div>
  );
}
