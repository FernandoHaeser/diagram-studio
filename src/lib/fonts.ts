import sans400 from '@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2?url';
import sans500 from '@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2?url';
import sans600 from '@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2?url';
import mono400 from '@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2?url';
import mono500 from '@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2?url';
import mono600 from '@fontsource/geist-mono/files/geist-mono-latin-600-normal.woff2?url';
import serif400 from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2?url';
import { resetTextCache } from './geometry';

interface FontFile {
  family: string;
  weight: number;
  url: string;
}

const FILES: FontFile[] = [
  { family: 'Geist Sans', weight: 400, url: sans400 },
  { family: 'Geist Sans', weight: 500, url: sans500 },
  { family: 'Geist Sans', weight: 600, url: sans600 },
  { family: 'Geist Mono', weight: 400, url: mono400 },
  { family: 'Geist Mono', weight: 500, url: mono500 },
  { family: 'Geist Mono', weight: 600, url: mono600 },
  { family: 'Instrument Serif', weight: 400, url: serif400 },
];

/** Carrega as fontes antes de medir texto, para que larguras de nós e rótulos sejam as reais. */
export async function preloadFonts(): Promise<void> {
  try {
    await Promise.all(FILES.map((f) => document.fonts.load(`${f.weight} 12px "${f.family}"`)));
  } finally {
    resetTextCache();
  }
}

let cached: Promise<string> | null = null;

/** CSS @font-face com as fontes em base64, para o SVG/PNG exportado ser autossuficiente. */
export function embeddedFontCss(): Promise<string> {
  cached ??= Promise.all(
    FILES.map(async (f) => {
      const buf = await (await fetch(f.url)).arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
    }),
  )
    .then((parts) => parts.join(''))
    .catch(() => '');
  return cached;
}
