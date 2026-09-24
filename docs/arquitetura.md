# Arquitetura

## Visão geral

```
Diagram (dados)  ──▶  DiagramSpec (regras do tipo)  ──▶  DiagramContent (SVG)
                                                        ├─ Canvas (edição interativa)
                                                        └─ ExportSvg (PNG / SVG)
```

- **Um único modelo de dados** (`src/types/diagram.ts`): `Diagram` tem `nodes`, `edges` e `meta`.
  Todo nó usa o canto superior esquerdo como origem.
- **Um `DiagramSpec` por tipo** (`src/diagrams/<tipo>/index.tsx`): descreve as peças, as
  relações, as regras de ligação, a legenda, os avisos e um exemplo. O motor não conhece nenhum
  tipo específico.
- **Uma renderização só**: `DiagramContent` desenha tanto o quadro quanto a exportação. Por isso
  o PNG sai idêntico ao que aparece na tela.

## Roteamento das setas

`src/lib/routing.ts`:

1. Cada nó expõe uma **forma** (retângulo, elipse ou losango) usada para achar o ponto de saída.
2. A face de saída é lateral, exceto quando os nós se sobrepõem na horizontal (aí é vertical).
3. Conexões que dividem a mesma face ganham **pontos de ancoragem próprios** (leque de 16px).
4. O cotovelo de cada conexão do grupo é **escalonado** para nenhuma cruzar outra.
5. O caminho é ortogonal com cantos arredondados (raio 8).

Diagramas com geometria própria (sequência) sobrescrevem `route`.

## Estado e persistência

`src/lib/store.ts` (Zustand com `persist`): diagramas, seleção, ferramenta ativa e histórico de
desfazer por diagrama. Salva em `localStorage` (`diagram-studio:v1`). O pan/zoom fica só em memória
para não regravar o storage a cada gesto.

## Exportação

`src/lib/export.ts` + `components/ExportSvg`: compõe cabeçalho, diagrama e legenda, embute as
fontes em base64 (funciona offline) e o modelo em `<metadata>`. O PNG rasteriza esse SVG num
canvas.

## Convenções de código

- Um componente por pasta, com `index.tsx` (lógica/markup) e `styles.ts` (classes Tailwind).
- Nada de emoji como ícone: todos os ícones são SVG no componente `Icon`.
- Cores e fontes do SVG vêm de `src/lib/tokens.ts` (hex literais, porque o SVG exportado não
  enxerga classes do Tailwind).
- Tudo alinhado à grade de 4px.

## Como criar um novo tipo de diagrama

1. Adicione o nome em `DiagramType` (`src/types/diagram.ts`).
2. Crie `src/diagrams/<tipo>/index.tsx` exportando um `DiagramSpec`:
   - `nodeKinds`: cada peça com `create`, `size`, `render` (e opcionalmente `shape`, `flags`,
     `resizable`, `members`...).
   - `edgeKinds`: cada relação com `markers`, `fields` e estilo (`dashed`, `color`, `labelMono`).
   - `canConnect`, `legend`, `warnings` e `example`.
3. Registre em `src/diagrams/index.ts` (`specs` e `specList`).
4. Se precisar de um ícone novo, adicione em `components/Icon`.

O restante (toolbar, inspector, atalhos, exportação, persistência) passa a funcionar sem mais nada.

## Ganchos opcionais do `DiagramSpec`

| Gancho | Uso |
|---|---|
| `route` | Rota própria das arestas (mensagens de sequência). |
| `renderUnder` / `renderOver` | Camadas extras (linhas de vida, barras de ativação). |
| `afterConnect` | Ajusta o diagrama ao criar uma aresta (ex.: cria a coluna FK). |
| `verticalEdges` | Arestas se movem só na vertical. |
| `extent` | Área extra ocupada por elementos que não são nós. |
