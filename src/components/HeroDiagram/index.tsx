import { heroStyles as s } from './styles';

interface Col {
  name: string;
  type: string;
  tag?: 'PK' | 'FK';
}
interface Table {
  name: string;
  x: number;
  y: number;
  w: number;
  focal?: boolean;
  cols: Col[];
}

const HEAD = 28;
const ROW = 22;

const tables: Table[] = [
  {
    name: 'usuarios',
    x: 16,
    y: 24,
    w: 178,
    cols: [
      { name: 'id_usuario', type: 'INT', tag: 'PK' },
      { name: 'nome', type: 'VARCHAR' },
      { name: 'email', type: 'VARCHAR' },
    ],
  },
  {
    name: 'habitos',
    x: 296,
    y: 24,
    w: 188,
    focal: true,
    cols: [
      { name: 'id_habito', type: 'INT', tag: 'PK' },
      { name: 'id_usuario', type: 'INT', tag: 'FK' },
      { name: 'titulo', type: 'VARCHAR' },
    ],
  },
  {
    name: 'registros',
    x: 156,
    y: 214,
    w: 188,
    cols: [
      { name: 'id_registro', type: 'INT', tag: 'PK' },
      { name: 'id_habito', type: 'INT', tag: 'FK' },
      { name: 'valor', type: 'DECIMAL' },
    ],
  },
];

const height = (t: Table) => HEAD + t.cols.length * ROW;

/** Desenho decorativo de um ER lógico, só para mostrar o estilo dos diagramas. */
export function HeroDiagram() {
  return (
    <svg viewBox="0 0 500 330" className={s.svg} role="img" aria-label="Exemplo de diagrama ER com as tabelas usuarios, habitos e registros">
      <path className={s.line} strokeWidth={1.4} d="M194 62 H296" />
      <path className={s.line} strokeWidth={1.4} d="M390 118 V166 H250 V214" />
      <text className={s.card} x={200} y={56}>1</text>
      <text className={s.card} x={281} y={56}>N</text>
      <text className={s.label} x={226} y={80}>possui</text>
      <text className={s.card} x={396} y={136}>1</text>
      <text className={s.card} x={256} y={206}>N</text>
      <text className={s.label} x={318} y={160}>gera</text>

      {tables.map((t) => (
        <g key={t.name}>
          <rect x={t.x} y={t.y} width={t.w} height={height(t)} rx={6} strokeWidth={t.focal ? 1.6 : 1.2} className={t.focal ? s.tableFocal : s.table} />
          <path d={`M${t.x} ${t.y + 6} a6 6 0 0 1 6 -6 h${t.w - 12} a6 6 0 0 1 6 6 v${HEAD - 6} h-${t.w} z`} className={t.focal ? s.headerFocal : s.header} />
          <text x={t.x + 12} y={t.y + 18} className={s.name}>
            {t.name}
          </text>
          {t.cols.map((c, i) => {
            const y = t.y + HEAD + i * ROW + 15;
            return (
              <g key={c.name}>
                {c.tag ? (
                  <text x={t.x + 10} y={y} className={c.tag === 'PK' ? s.tagPk : s.tagFk}>
                    {c.tag}
                  </text>
                ) : null}
                <text x={t.x + 30} y={y} className={s.col}>
                  {c.name}
                </text>
                <text x={t.x + t.w - 10} y={y} textAnchor="end" className={s.type}>
                  {c.type}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
