import { specList } from '@/diagrams';
import { useStore } from '@/lib/store';
import { Icon } from '../Icon';
import { emptyStyles as s } from './styles';

export function EmptyState() {
  const create = useStore((st) => st.createDiagram);
  return (
    <div className={s.root}>
      <div>
        <h1 className={s.title}>Nenhum diagrama aberto</h1>
        <p className={s.text}>Comece por um dos tipos abaixo. Tudo fica salvo no navegador e pode ser exportado em PNG, SVG ou JSON.</p>
      </div>
      <div className={s.grid}>
        {specList.map((spec) => (
          <button key={spec.type} type="button" className={s.card} onClick={() => create(spec.type, false)}>
            <Icon name={spec.icon} size={20} />
            <span>
              <span className={s.name}>{spec.label}</span>
              <span className={s.desc}>{spec.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
