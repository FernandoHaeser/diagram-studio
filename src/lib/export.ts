import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Diagram } from '@/types/diagram';
import { ExportSvg, computeExportSize } from '@/components/ExportSvg';
import { REPO_URL } from './constants';
import { embeddedFontCss } from './fonts';

export interface BuiltSvg {
  svg: string;
  width: number;
  height: number;
}

export async function buildSvg(d: Diagram, transparent = false): Promise<BuiltSvg | null> {
  const size = computeExportSize(d);
  if (!size) return null;
  const fontCss = await embeddedFontCss();
  const svg = renderToStaticMarkup(createElement(ExportSvg, { diagram: d, fontCss, transparent }));
  return { svg, width: size.W, height: size.H };
}

export const fileBase = (d: Diagram) =>
  (d.name || 'diagrama')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'diagrama';

export function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function exportSvgFile(d: Diagram, transparent: boolean) {
  const built = await buildSvg(d, transparent);
  if (!built) return;
  download(`${fileBase(d)}.svg`, new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n<!-- Editável no Diagram Studio: ${REPO_URL} (Importar > este arquivo) -->\n${built.svg}`], { type: 'image/svg+xml' }));
}

export async function exportPngFile(d: Diagram, scale: number, transparent: boolean) {
  const built = await buildSvg(d, transparent);
  if (!built) return;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(built.svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = built.width * scale;
  canvas.height = built.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, built.width, built.height);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (blob) download(`${fileBase(d)}.png`, blob);
}

export function exportDiagramJson(d: Diagram) {
  download(`${fileBase(d)}.json`, new Blob([JSON.stringify({ app: 'diagram-studio', version: 1, diagrams: [d] }, null, 2)], { type: 'application/json' }));
}
