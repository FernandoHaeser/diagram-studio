import { useEffect, useRef, useState } from 'react';
import { specList } from '@/diagrams';
import { useStore } from '@/lib/store';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Toggle } from '../Toggle';
import { newMenuStyles as s } from './styles';

export function NewDiagramMenu() {
  const [open, setOpen] = useState(false);
  const [withExample, setWithExample] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const create = useStore((st) => st.createDiagram);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} className={s.root}>
      <Button variant="primary" icon="plus" className="w-full" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Novo diagrama
      </Button>
      {open ? (
        <div className={s.panel} role="menu">
          {specList.map((spec) => (
            <button
              key={spec.type}
              type="button"
              role="menuitem"
              className={s.item}
              onClick={() => {
                create(spec.type, withExample);
                setOpen(false);
              }}
            >
              <Icon name={spec.icon} size={18} className={s.icon} />
              <span>
                <span className={s.name}>{spec.label}</span>
                <span className={s.desc}>{spec.description}</span>
              </span>
            </button>
          ))}
          <div className={s.foot}>
            <Toggle label="Começar com um exemplo" checked={withExample} onChange={setWithExample} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
