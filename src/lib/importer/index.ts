import type { Diagram } from '@/types/diagram';
import { specs } from '@/diagrams';
import { MODEL_METADATA_ID } from '../constants';
import { useStore } from '../store';
import { importHeuristic } from './heuristic';

export type ImportOutcome = { ok: true; message: string } | { ok: false; error: string };

const NO_SHAPES =
  'Não encontrei caixas e setas nesse arquivo. O importador entende diagramas de arquitetura, fluxo e processo do /diagram-design (caixas + setas). Gráficos, radar, linha do tempo e similares não são suportados.';

function findSvg(doc: Document): Element | null {
  const all = [...doc.querySelectorAll('svg')].filter((s) => !s.closest('defs'));
  const area = (s: Element) => {
    const vb = (s.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    return vb.length === 4 ? vb[2] * vb[3] : (parseFloat(s.getAttribute('width') ?? '0') || 0) * (parseFloat(s.getAttribute('height') ?? '0') || 0);
  };
  return all.sort((a, b) => area(b) - area(a))[0] ?? null;
}

function parseMarkup(text: string): Document {
  if (/^\s*(<\?xml|<svg)/i.test(text)) {
    const xml = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (!xml.querySelector('parsererror')) return xml;
  }
  return new DOMParser().parseFromString(text, 'text/html');
}

/** Lê um modelo embutido pelo próprio Diagram Studio em <metadata> (ida e volta sem perdas). */
function embeddedModel(doc: Document): Diagram | null {
  const raw = doc.querySelector(`#${MODEL_METADATA_ID}`)?.textContent;
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    return d && d.type in specs && Array.isArray(d.nodes) && Array.isArray(d.edges) ? (d as Diagram) : null;
  } catch {
    return null;
  }
}

export async function importFile(file: File): Promise<ImportOutcome> {
  const text = await file.text();
  const store = useStore.getState();

  if (/^\s*[[{]/.test(text)) {
    const res = store.importProject(text);
    return res.ok ? { ok: true, message: `${res.count} diagrama(s) importado(s).` } : res;
  }

  const doc = parseMarkup(text);
  const embedded = embeddedModel(doc);
  if (embedded) {
    store.addDiagrams([embedded]);
    return { ok: true, message: `"${embedded.name}" restaurado com todas as informações editáveis.` };
  }

  const svg = findSvg(doc);
  if (!svg) return { ok: false, error: 'Não achei nenhum <svg> nesse arquivo.' };
  const { diagram, report } = importHeuristic(svg, doc, file.name);
  if (!diagram.nodes.length) return { ok: false, error: NO_SHAPES };
  store.addDiagrams([diagram]);
  return { ok: true, message: `Importado como Arquitetura. ${report.join(' ')}` };
}

/** Importa e avisa o usuário (erro em alerta; sucesso na dica do quadro). */
export async function importAndNotify(file: File): Promise<void> {
  const res = await importFile(file);
  if (res.ok) useStore.getState().setNotice(res.message);
  else window.alert(res.error);
}
