import { useEffect, useRef } from 'react';
import type { Diagram, DiagramNode } from '@/types/diagram';
import { nodeSpec } from '@/diagrams';
import { useLazyCheckpoint } from '@/hooks/useLazyCheckpoint';
import { useStore } from '@/lib/store';
import { Button } from '../Button';
import { Field } from '../Field';
import { MemberEditor } from '../MemberEditor';
import { Section } from '../Section';
import { TextArea, TextInput } from '../TextInput';
import { Toggle } from '../Toggle';
import { nodeInspectorStyles as s } from './styles';

interface NodeInspectorProps {
  diagram: Diagram;
  node: DiagramNode;
}

export function NodeInspector({ diagram, node }: NodeInspectorProps) {
  const ks = nodeSpec(diagram, node.kind);
  const cp = useLazyCheckpoint();
  const updateNode = useStore((st) => st.updateNode);
  const focusTick = useStore((st) => st.focusTick);
  const addChildNode = useStore((st) => st.addChildNode);
  const labelRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    labelRef.current?.focus();
    labelRef.current?.select();
  }, [focusTick]);

  const set = (p: Partial<DiagramNode>) => updateNode(node.id, p);

  return (
    <>
      <Section title={ks.label}>
        <p className={s.hint}>{ks.hint}</p>
        <Field label={ks.labelName ?? 'Nome'}>
          <TextInput
            ref={labelRef}
            value={node.label}
            onFocus={cp.arm}
            onChange={(e) => {
              cp.commit();
              set({ label: e.target.value });
            }}
          />
        </Field>
        {ks.tagLabel ? (
          <Field label={ks.tagLabel}>
            <TextInput
              mono
              value={node.tag ?? ''}
              onFocus={cp.arm}
              onChange={(e) => {
                cp.commit();
                set({ tag: e.target.value });
              }}
            />
          </Field>
        ) : null}
        {ks.subLabel ? (
          <Field label={ks.subLabel}>
            <TextInput
              mono
              value={node.sub ?? ''}
              onFocus={cp.arm}
              onChange={(e) => {
                cp.commit();
                set({ sub: e.target.value });
              }}
            />
          </Field>
        ) : null}
        {ks.textLabel ? (
          <Field label={ks.textLabel}>
            <TextArea
              rows={4}
              value={node.text ?? ''}
              onFocus={cp.arm}
              onChange={(e) => {
                cp.commit();
                set({ text: e.target.value });
              }}
            />
          </Field>
        ) : null}
        {ks.flags?.map((f) => (
          <div key={f.key} className="mb-2">
            <Toggle
              label={f.label}
              checked={!!node.flags[f.key]}
              onChange={(v) => {
                cp.now();
                set({ flags: { ...node.flags, [f.key]: v } });
              }}
            />
          </div>
        ))}
        {ks.addChild ? (
          <Button icon="plus" className="mt-1 w-full" onClick={() => addChildNode(node.id)}>
            {ks.addChild.label}
          </Button>
        ) : null}
      </Section>

      {ks.members ? (
        <Section title={ks.members === 'table' ? 'Colunas' : ks.members === 'enum' ? 'Valores' : 'Membros'}>
          {ks.members === 'table' ? (
            <MemberEditor title="Colunas da tabela" mode="column" addLabel="Adicionar coluna" items={node.members ?? []} onChange={(members) => set({ members })} />
          ) : null}
          {ks.members === 'enum' ? (
            <MemberEditor title="Valores" mode="value" addLabel="Adicionar valor" items={node.members ?? []} onChange={(members) => set({ members })} />
          ) : null}
          {ks.members === 'class' ? (
            <MemberEditor title="Atributos" mode="attribute" addLabel="Adicionar atributo" items={node.members ?? []} onChange={(members) => set({ members })} />
          ) : null}
          {ks.members === 'class' || ks.members === 'interface' ? (
            <MemberEditor title="Métodos" mode="method" addLabel="Adicionar método" items={node.methods ?? []} onChange={(methods) => set({ methods })} />
          ) : null}
        </Section>
      ) : null}

      <div className={`${s.actions} px-4 pb-4`}>
        <Button icon="copy" className="flex-1" onClick={() => useStore.getState().duplicateSelection()}>
          Duplicar
        </Button>
        <Button icon="trash" variant="danger" className="flex-1" onClick={() => useStore.getState().removeSelection()}>
          Excluir
        </Button>
      </div>
    </>
  );
}
