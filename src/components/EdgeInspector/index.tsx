import type { Diagram, DiagramEdge } from '@/types/diagram';
import { getSpec } from '@/diagrams';
import { useLazyCheckpoint } from '@/hooks/useLazyCheckpoint';
import { useStore } from '@/lib/store';
import { Button } from '../Button';
import { Field } from '../Field';
import { Icon } from '../Icon';
import { Section } from '../Section';
import { SelectInput } from '../SelectInput';
import { TextInput } from '../TextInput';
import { edgeInspectorStyles as s } from './styles';

interface EdgeInspectorProps {
  diagram: Diagram;
  edge: DiagramEdge;
}

export function EdgeInspector({ diagram, edge }: EdgeInspectorProps) {
  const spec = getSpec(diagram.type);
  const ks = spec.edgeKinds.find((k) => k.kind === edge.kind)!;
  const cp = useLazyCheckpoint();
  const updateEdge = useStore((st) => st.updateEdge);
  const from = diagram.nodes.find((n) => n.id === edge.from);
  const to = diagram.nodes.find((n) => n.id === edge.to);

  const cardOptions = (current?: string) => {
    const base = spec.cardOptions ?? [];
    const list = current && !base.includes(current) ? [...base, current] : base;
    return [{ value: '', label: 'Sem indicação' }, ...list.map((c) => ({ value: c, label: c }))];
  };

  const changeKind = (kind: string) => {
    if (!from || !to) return;
    if (spec.canConnect && !spec.canConnect(diagram, from, to, kind)) {
      useStore.getState().setNotice(`Esse tipo de relação não se aplica entre ${from.label} e ${to.label}.`);
      return;
    }
    cp.now();
    const next = spec.edgeKinds.find((k) => k.kind === kind);
    updateEdge(edge.id, { kind, ...(next?.defaults?.() && !edge.fromCard && !edge.toCard ? next.defaults() : {}) });
  };

  return (
    <>
      <Section title="Relação">
        <p className={s.hint}>{ks.hint}</p>
        <div className={s.pair}>
          <span className={s.chip}>{from?.label}</span>
          <Icon name="e-directed" size={14} />
          <span className={s.chip}>{to?.label}</span>
        </div>
        <Field label="Tipo">
          <SelectInput value={edge.kind} options={spec.edgeKinds.map((k) => ({ value: k.kind, label: k.label }))} onChange={changeKind} />
        </Field>
        {ks.fields.includes('label') ? (
          <Field label={diagram.type === 'sequence' ? 'Mensagem' : 'Rótulo'}>
            <TextInput
              value={edge.label ?? ''}
              placeholder={diagram.type === 'sequence' ? 'ex.: criarPedido()' : 'ex.: possui'}
              onFocus={cp.arm}
              onChange={(e) => {
                cp.commit();
                updateEdge(edge.id, { label: e.target.value });
              }}
            />
          </Field>
        ) : null}
        {ks.fields.includes('fromCard') ? (
          <Field label={`Cardinalidade junto a ${from?.label ?? 'origem'}`}>
            <SelectInput
              value={edge.fromCard ?? ''}
              options={cardOptions(edge.fromCard)}
              onChange={(v) => {
                cp.now();
                updateEdge(edge.id, { fromCard: v || undefined });
              }}
            />
          </Field>
        ) : null}
        {ks.fields.includes('toCard') ? (
          <Field label={`Cardinalidade junto a ${to?.label ?? 'destino'}`}>
            <SelectInput
              value={edge.toCard ?? ''}
              options={cardOptions(edge.toCard)}
              onChange={(v) => {
                cp.now();
                updateEdge(edge.id, { toCard: v || undefined });
              }}
            />
          </Field>
        ) : null}
        {spec.verticalEdges && edge.kind !== 'link' ? <p className={s.hint}>Arraste a mensagem na vertical para reordenar no tempo.</p> : null}
        <div className={s.actions}>
          <Button icon="swap" className="flex-1" onClick={() => useStore.getState().reverseEdge(edge.id)}>
            Inverter
          </Button>
          <Button icon="trash" variant="danger" className="flex-1" onClick={() => useStore.getState().removeSelection()}>
            Excluir
          </Button>
        </div>
      </Section>
    </>
  );
}
