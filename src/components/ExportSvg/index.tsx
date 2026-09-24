import type { Diagram } from '@/types/diagram';
import { getSpec } from '@/diagrams';
import { boundsOf, routesOf, shapesOf } from '@/lib/layout';
import { MODEL_METADATA_ID, REPO_URL } from '@/lib/constants';
import { snapUp } from '@/lib/geometry';
import { C } from '@/lib/tokens';
import { DiagramContent } from '../DiagramContent';
import { MarkerDefs } from '../MarkerDefs';
import { SvgText } from '../SvgText';
import { exportStyles as s } from './styles';

interface ExportSvgProps {
  diagram: Diagram;
  fontCss: string;
  transparent?: boolean;
}

/** SVG final: cabeçalho editorial, diagrama e legenda em tira horizontal na base. */
export function computeExportSize(diagram: Diagram) {
  const spec = getSpec(diagram.type);
  const routes = routesOf(diagram, shapesOf(diagram));
  const b = boundsOf(diagram, routes);
  if (!b) return null;
  const { meta } = diagram;
  const headH = meta.header && (meta.title || meta.eyebrow) ? (meta.subtitle ? s.headerWithSubtitle : s.headerBase) : 0;
  const items = meta.legend ? spec.legend(diagram) : [];
  const W = Math.max(s.minWidth, snapUp(b.w + s.pad * 2, 8));

  const placed: { x: number; row: number; item: (typeof items)[number] }[] = [];
  let x = s.pad + 96;
  let row = 0;
  for (const item of items) {
    if (x + item.width > W - s.pad && x > s.pad + 96) {
      row += 1;
      x = s.pad + 96;
    }
    placed.push({ x, row, item });
    x += item.width;
  }
  const legendH = items.length ? s.legendBase + (row + 1) * s.legendRow : 0;
  const H = snapUp(headH + b.h + s.pad * 2 + legendH, 8);
  return { W, H, b, headH, placed, legendH };
}

export function ExportSvg({ diagram, fontCss, transparent }: ExportSvgProps) {
  const size = computeExportSize(diagram);
  if (!size) return null;
  const { W, H, b, headH, placed, legendH } = size;
  const { meta } = diagram;
  const ox = (W - b.w) / 2 - b.x;
  const oy = headH + s.pad - b.y;
  const legendTop = H - legendH;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <metadata id={MODEL_METADATA_ID} data-editor={REPO_URL}>
        {JSON.stringify(diagram)}
      </metadata>
      <style>{fontCss}</style>
      <MarkerDefs />
      {transparent ? null : <rect width={W} height={H} fill={C.paper} />}
      {headH ? (
        <g>
          {meta.eyebrow ? (
            <SvgText x={s.pad} y={36} size={8} family="mono" weight={500} fill={C.muted} anchor="start" spacing="0.18em">
              {meta.eyebrow.toUpperCase()}
            </SvgText>
          ) : null}
          {meta.title ? (
            <SvgText x={s.pad} y={68} size={28} family="serif" anchor="start">
              {meta.title}
            </SvgText>
          ) : null}
          {meta.subtitle ? (
            <SvgText x={s.pad} y={92} size={12} fill={C.muted} anchor="start">
              {meta.subtitle}
            </SvgText>
          ) : null}
        </g>
      ) : null}
      <g transform={`translate(${ox} ${oy})`}>
        <DiagramContent diagram={diagram} />
      </g>
      {placed.length ? (
        <g>
          <line x1={s.pad} y1={legendTop + 4} x2={W - s.pad} y2={legendTop + 4} stroke="rgba(45,49,66,0.10)" strokeWidth={0.8} />
          <SvgText x={s.pad} y={legendTop + 30} size={8} family="mono" fill={C.muted} anchor="start" spacing="0.14em">
            LEGENDA
          </SvgText>
          {placed.map(({ x, row, item }, i) => {
            const y = legendTop + 26 + row * s.legendRow;
            return (
              <g key={i}>
                <g transform={`translate(${x} ${y})`}>{item.swatch()}</g>
                <SvgText x={x + 40} y={y + 4} size={10} fill={C.muted} anchor="start">
                  {item.label}
                </SvgText>
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}
