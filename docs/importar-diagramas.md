# Importar diagramas

O botão **Importar** (ou arrastar o arquivo para a janela) aceita três origens. O formato é
detectado pelo conteúdo, não pela extensão.

| Origem | Arquivo | Resultado |
|---|---|---|
| Projeto do Diagram Studio | `.json` | Todos os diagramas do arquivo são adicionados. |
| SVG exportado pelo Diagram Studio | `.svg` | Restaura o diagrama **exatamente** (tipo, peças, relações, estilos). |
| Diagrama do `/diagram-design` | `.html` ou `.svg` | Reconstruído por heurística como diagrama de **Arquitetura**. |

Imagens (`.png`) não são importáveis: não carregam a estrutura do desenho.

## 1. SVG do Diagram Studio (sem perdas)

Todo SVG exportado embute o modelo completo num bloco `<metadata id="diagram-studio-model">`,
junto do link do repositório. Ao importar, esse bloco é lido e o diagrama volta idêntico,
incluindo diagramas de sequência, classes, ER etc.

## 2. HTML/SVG do `/diagram-design` (heurística)

Esses arquivos são só desenho: não dizem o que é caixa e o que é seta. O importador lê o `<svg>`
maior do arquivo e reconstrói a estrutura a partir das convenções do skill.

### O que é reconhecido

| No SVG do skill | Vira no Diagram Studio |
|---|---|
| `rect`/`ellipse` com traço visível, largura ≥ 56 e altura ≥ 28 | **Caixa** |
| `polygon` de 4 pontos com traço (losango) | Caixa com formato de **decisão** |
| Caixa que contém outras caixas | **Zona** (o texto mono junto ao topo vira o nome) |
| Retângulo pequeno (tag) + texto mono maiúsculo no canto da caixa | **Etiqueta de tipo** (`API`, `DB`...) |
| Texto sans em negrito dentro da caixa | Nome |
| Texto mono pequeno dentro da caixa | Detalhe (subtítulo) |
| `path`/`line`/`polyline` com `marker-start`/`marker-end` cujas pontas encostam em duas caixas | **Seta** (direção pelo marcador) |
| Texto perto de uma seta | **Rótulo** da seta |
| Texto grande e solto (sans, ≥ 10px) fora de caixas e setas | **Nota** |
| Título, eyebrow e subtítulo do HTML ao redor (`h1`, `.eyebrow`, `.subtitle`) | Cabeçalho da exportação |

### Tratamento visual por tipo de nó

O traço e o preenchimento da caixa definem o tipo, igual à tabela do skill:

| Traço / preenchimento | Tipo |
|---|---|
| Laranja sólido | Destaque (`focal`) |
| Laranja tracejado | Segurança / limite |
| Tracejado cinza | Opcional / assíncrono |
| Preenchimento de tinta ≤ 14% + traço `muted` | Armazenamento |
| Traço de tinta com opacidade ≤ 0,42 | Externo |
| Elipse | Formato elíptico |

### Tipos de seta

| Traço | Tipo |
|---|---|
| Laranja | Seta de destaque |
| Azul | Chamada externa (API) |
| Cinza tracejado | Seta tracejada |
| Cinza sólido com marcador | Seta |
| Sem marcador | Linha |

### CSS e variáveis

Estilos definidos por `class` no `<style>` (`.lane`, `.node`...) e por variáveis (`var(--ink)`) são
resolvidos. Regras dentro de `@media` são ignoradas. Transformações `translate`, `scale` e `matrix`
são aplicadas; rotações não.

### Limitações conhecidas

- O foco é **arquitetura, fluxograma, alto nível e diagramas parecidos** (caixas + setas).
  Testado com os exemplos de arquitetura, fluxograma e alto nível do skill (caixas, zonas, setas,
  losangos, cores e rótulos vieram corretos).
- Diagramas em **raias** (`process`, `data-flow`, swimlane) importam de forma aproximada: caixas e
  algumas setas vêm, mas textos das raias podem virar notas. Vale conferir e ajustar.
- **Gráficos e quadros** (barras, linhas, dispersão, radar, Gantt, linha do tempo, Venn, pirâmide)
  não têm estrutura de caixas/setas e não são suportados; o app avisa.
- Uma seta só é importada se as **duas pontas** encostarem (até 14px) em caixas. As que não
  encostam são contadas no aviso "N seta(s) ignorada(s)".
- Setas curvas são reduzidas a ponta inicial e final; o Diagram Studio recalcula o traçado
  ortogonal, então o desenho das linhas pode diferir do original.
- Elementos decorativos (números grandes de fundo, legenda, fundo pontilhado) são descartados.
  A legenda é regenerada automaticamente.

### Depois de importar

O aviso na base do quadro resume o que entrou e o que foi ignorado. Os elementos mantêm as
coordenadas do arquivo original (alinhadas à grade de 4px). Ajuste o que quiser e exporte.

## Adicionar suporte a outro tipo do skill

O importador vive em `src/lib/importer/`:

| Arquivo | Papel |
|---|---|
| `svgModel.ts` | Lê o SVG em primitivas (retângulos, textos, linhas) com transformações e CSS aplicados. |
| `heuristic.ts` | Decide o que é caixa, zona, seta e rótulo e monta o `Diagram`. |
| `color.ts` | Interpretação de cores (hex, rgb, `var()`) e classificação (laranja, azul, escuro). |
| `index.ts` | Detecta a origem do arquivo e grava no store. |

Para mapear outro tipo (por exemplo, sequência), crie uma segunda função no estilo de
`importHeuristic` que devolva um `Diagram` do tipo correspondente e escolha entre elas em `index.ts`.
