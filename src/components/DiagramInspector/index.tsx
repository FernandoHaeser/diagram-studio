import type { Diagram } from '@/types/diagram';
import { getSpec } from '@/diagrams';
import { useStore } from '@/lib/store';
import { Field } from '../Field';
import { Section } from '../Section';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';
import { diagramInspectorStyles as s } from './styles';

interface DiagramInspectorProps {
  diagram: Diagram;
}

const SHORTCUTS: [string, string][] = [
  ['V / H', 'Selecionar / navegar'],
  ['1 – 9', 'Escolher peça ou relação'],
  ['Espaço + arrastar', 'Mover o quadro'],
  ['⌘Z / ⇧⌘Z', 'Desfazer / refazer'],
  ['⌘D', 'Duplicar peça'],
  ['Delete', 'Excluir seleção'],
  ['Setas', 'Ajustar posição (⇧ = 16px)'],
  ['0  +  -', 'Ajustar à tela, zoom'],
];

export function DiagramInspector({ diagram }: DiagramInspectorProps) {
  const spec = getSpec(diagram.type);
  const updateMeta = useStore((st) => st.updateMeta);
  const warnings = spec.warnings(diagram);
  const { meta } = diagram;

  return (
    <>
      <Section title="Cabeçalho da exportação">
        <div className={s.toggles}>
          <Toggle label="Incluir cabeçalho" checked={meta.header} onChange={(v) => updateMeta({ header: v })} />
          <Toggle label="Incluir legenda automática" checked={meta.legend} onChange={(v) => updateMeta({ legend: v })} />
        </div>
        <Field label="Linha superior (eyebrow)">
          <TextInput mono value={meta.eyebrow} onChange={(e) => updateMeta({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Título">
          <TextInput value={meta.title} onChange={(e) => updateMeta({ title: e.target.value })} />
        </Field>
        <Field label="Subtítulo">
          <TextInput value={meta.subtitle} onChange={(e) => updateMeta({ subtitle: e.target.value })} />
        </Field>
      </Section>

      <Section title="Revisão">
        {warnings.length ? warnings.map((w) => <p key={w} className={s.warn}>{w}</p>) : <p className={s.ok}>Nenhum aviso. O diagrama está dentro do orçamento de complexidade.</p>}
        <p className={`${s.meta} mt-2`}>
          {diagram.nodes.length} peças · {diagram.edges.length} relações
        </p>
      </Section>

      <Section title="Atalhos">
        <div className={s.keys}>
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="contents">
              <span className={s.kbd}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
