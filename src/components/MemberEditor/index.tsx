import type { Member } from '@/types/diagram';
import { uid } from '@/lib/geometry';
import { useLazyCheckpoint } from '@/hooks/useLazyCheckpoint';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { SelectInput } from '../SelectInput';
import { TextInput } from '../TextInput';
import { memberStyles as s } from './styles';

export type MemberMode = 'attribute' | 'method' | 'value' | 'column';

interface MemberEditorProps {
  title: string;
  mode: MemberMode;
  items: Member[];
  addLabel: string;
  onChange: (items: Member[]) => void;
}

const VIS = ['+', '-', '#', '~'].map((v) => ({ value: v, label: v }));
const CHIPS: { key: 'pk' | 'fk' | 'nn' | 'uq'; label: string; title: string }[] = [
  { key: 'pk', label: 'PK', title: 'Chave primária' },
  { key: 'fk', label: 'FK', title: 'Chave estrangeira' },
  { key: 'nn', label: 'NN', title: 'Não nulo (NOT NULL)' },
  { key: 'uq', label: 'UQ', title: 'Único (UNIQUE)' },
];

const blank = (mode: MemberMode): Member => {
  switch (mode) {
    case 'attribute':
      return { id: uid(), text: 'atributo', type: 'string', visibility: '-' };
    case 'method':
      return { id: uid(), text: 'metodo()', type: 'void', visibility: '+' };
    case 'value':
      return { id: uid(), text: 'VALOR' };
    case 'column':
      return { id: uid(), text: 'coluna', type: 'VARCHAR(100)' };
  }
};

export function MemberEditor({ title, mode, items, addLabel, onChange }: MemberEditorProps) {
  const cp = useLazyCheckpoint();
  const patch = (id: string, p: Partial<Member>) => onChange(items.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    cp.now();
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className={s.root}>
      <div className={s.head}>
        <span className={s.title}>{title}</span>
      </div>

      {items.length === 0 ? <div className={s.empty}>Nada por aqui ainda.</div> : null}

      {items.map((m, i) => (
        <div key={m.id} className={s.row}>
          <div className={s.line}>
            {mode === 'attribute' || mode === 'method' ? (
              <div className={s.vis}>
                <SelectInput
                  aria-label="Visibilidade"
                  value={m.visibility ?? '+'}
                  options={VIS}
                  onChange={(v) => {
                    cp.now();
                    patch(m.id, { visibility: v as Member['visibility'] });
                  }}
                />
              </div>
            ) : null}
            <TextInput
              mono
              aria-label="Nome"
              value={m.text}
              onFocus={cp.arm}
              onChange={(e) => {
                cp.commit();
                patch(m.id, { text: e.target.value });
              }}
            />
            {mode !== 'value' ? (
              <TextInput
                mono
                aria-label="Tipo"
                className={s.type}
                placeholder="tipo"
                value={m.type ?? ''}
                onFocus={cp.arm}
                onChange={(e) => {
                  cp.commit();
                  patch(m.id, { type: e.target.value });
                }}
              />
            ) : null}
          </div>

          {mode === 'column' ? (
            <div className={s.chips}>
              {CHIPS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.title}
                  aria-pressed={!!m[c.key]}
                  className={`${s.chip} ${m[c.key] ? s.chipOn : s.chipOff}`}
                  onClick={() => {
                    cp.now();
                    patch(m.id, { [c.key]: !m[c.key] });
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className={s.actions}>
            <IconButton icon="chevron-down" label="Subir" className={`${s.small} rotate-180`} disabled={i === 0} onClick={() => move(i, -1)} />
            <IconButton icon="chevron-down" label="Descer" className={s.small} disabled={i === items.length - 1} onClick={() => move(i, 1)} />
            <IconButton
              icon="trash"
              label="Remover"
              danger
              className={s.small}
              onClick={() => {
                cp.now();
                onChange(items.filter((x) => x.id !== m.id));
              }}
            />
          </div>
        </div>
      ))}

      <Button
        icon="plus"
        variant="secondary"
        className="w-full"
        onClick={() => {
          cp.now();
          onChange([...items, blank(mode)]);
        }}
      >
        {addLabel}
      </Button>
    </div>
  );
}
