import { useRef } from 'react';
import { getSpec } from '@/diagrams';
import { REPO_URL } from '@/lib/constants';
import { download } from '@/lib/export';
import { importAndNotify } from '@/lib/importer';
import { useStore } from '@/lib/store';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { NewDiagramMenu } from '../NewDiagramMenu';
import { sidebarStyles as s } from './styles';

export function Sidebar() {
  const order = useStore((st) => st.order);
  const diagrams = useStore((st) => st.diagrams);
  const activeId = useStore((st) => st.activeId);
  const setActive = useStore((st) => st.setActive);
  const remove = useStore((st) => st.removeDiagram);
  const duplicate = useStore((st) => st.duplicateDiagram);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <nav className={s.root} aria-label="Diagramas do projeto">
      <div className={s.brand}>
        <a href="#/" className={s.wordmark} title="Voltar à página inicial">
          digstdio
        </a>
        <div className={s.tagline}>Documentação de software</div>
      </div>
      <div className={s.top}>
        <NewDiagramMenu />
      </div>
      <div className={s.listTitle}>Diagramas ({order.length})</div>
      <div className={s.list}>
        {order.map((id) => {
          const d = diagrams[id];
          if (!d) return null;
          const active = id === activeId;
          return (
            <div key={id} className={`${s.item} ${active ? s.itemActive : ''}`}>
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2.5 text-left" onClick={() => setActive(id)} aria-current={active ? 'true' : undefined}>
                <Icon name={getSpec(d.type).icon} size={18} className={s.itemIcon} />
                <span className="min-w-0">
                  <span className={s.itemName}>{d.name}</span>
                  <span className={s.itemType}>{getSpec(d.type).label}</span>
                </span>
              </button>
              <span className={s.itemActions}>
                <IconButton icon="copy" label="Duplicar diagrama" className="h-7 w-7" onClick={() => duplicate(id)} />
                <IconButton
                  icon="trash"
                  label="Excluir diagrama"
                  danger
                  className="h-7 w-7"
                  onClick={() => {
                    if (window.confirm(`Excluir "${d.name}"? Essa ação não pode ser desfeita.`)) remove(id);
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
      <div className={s.foot}>
        <div className={s.footButtons}>
          <Button icon="upload" className="flex-1" title="Importa projeto (.json), diagrama do digstdio ou do /diagram-design (.html, .svg)" onClick={() => fileRef.current?.click()}>
            Importar
          </Button>
          <Button
            icon="download"
            className="flex-1"
            title="Baixa todos os diagramas em um único .json"
            disabled={!order.length}
            onClick={() => download('digstdio-projeto.json', new Blob([useStore.getState().exportProject()], { type: 'application/json' }))}
          >
            Projeto
          </Button>
        </div>
        <a className={s.repo} href={REPO_URL} target="_blank" rel="noreferrer" title="Repositório principal">
          {REPO_URL.replace('https://', '')}
        </a>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.html,.htm,.svg,application/json,image/svg+xml,text/html"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importAndNotify(file);
            e.target.value = '';
          }}
        />
      </div>
    </nav>
  );
}
