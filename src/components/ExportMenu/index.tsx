import { useEffect, useRef, useState } from 'react';
import { exportDiagramJson, exportPngFile, exportSvgFile } from '@/lib/export';
import { useActiveDiagram } from '@/lib/store';
import { Button } from '../Button';
import { SelectInput } from '../SelectInput';
import { Toggle } from '../Toggle';
import { exportMenuStyles as s } from './styles';

export function ExportMenu() {
  const diagram = useActiveDiagram();
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState('2');
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!diagram) return null;
  const empty = diagram.nodes.length === 0;

  const run = async (kind: string, fn: () => Promise<void> | void) => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={s.root}>
      <Button variant="primary" icon="download" onClick={() => setOpen((v) => !v)} disabled={empty} aria-expanded={open}>
        Exportar
      </Button>
      {open ? (
        <div className={s.panel} role="dialog" aria-label="Opções de exportação">
          <p className={s.title}>Imagem</p>
          <div className={s.row}>
            <span className={s.label}>Escala</span>
            <SelectInput
              value={scale}
              onChange={setScale}
              options={[
                { value: '1', label: '1x (tela)' },
                { value: '2', label: '2x (documentos)' },
                { value: '3', label: '3x (impressão)' },
              ]}
            />
          </div>
          <Toggle label="Fundo transparente" checked={transparent} onChange={setTransparent} />
          <div className={s.divider} />
          <div className={s.stack}>
            <Button icon="image" onClick={() => run('png', () => exportPngFile(diagram, Number(scale), transparent))} disabled={!!busy}>
              {busy === 'png' ? 'Gerando PNG...' : 'Baixar PNG'}
            </Button>
            <Button icon="code" onClick={() => run('svg', () => exportSvgFile(diagram, transparent))} disabled={!!busy}>
              {busy === 'svg' ? 'Gerando SVG...' : 'Baixar SVG'}
            </Button>
            <Button icon="file" onClick={() => run('json', () => exportDiagramJson(diagram))} disabled={!!busy}>
              Baixar JSON (este diagrama)
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
