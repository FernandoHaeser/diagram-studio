# Diagram Studio

Editor visual de diagramas para documentação de software, no estilo do skill `/diagram-design`
(Geist, Instrument Serif, grade de 4px, conectores ortogonais arredondados, legenda em tira).
Tudo roda no navegador e fica salvo localmente.

**Repositório principal:** <https://github.com/FernandoHaeser/diagram-studio>

## O que dá para fazer

| Tipo | Serve para |
|---|---|
| Arquitetura | Caixas, zonas e setas (arquitetura, fluxo, processo). É o destino dos diagramas importados. |
| Casos de uso | Atores, fronteira do sistema, associação, `«include»`, `«extend»`, generalização. |
| Classes | Classe, interface, enum; herança, realização, agregação, composição, dependência, multiplicidade. |
| ER conceitual | Notação de Chen: entidade, relacionamento, atributo (chave, derivado, multivalorado), cardinalidade. |
| ER lógico | Tabelas com PK/FK/NN/UQ e pé-de-galinha; a FK é criada na tabela filha ao ligar. |
| Sequência | Participantes, mensagens síncronas/assíncronas/retorno, ativações automáticas, fragmentos. |

Exporta **PNG** (1x a 3x), **SVG** e **JSON**, com fontes embutidas, cabeçalho e legenda automáticos.
Importa diagramas gerados pelo Claude com o `/diagram-design`: veja [docs/importar-diagramas.md](docs/importar-diagramas.md).

## Como rodar

Requer **Node 20.19 ou superior** (o `.nvmrc` fixa o 22).

```bash
nvm use          # lê o .nvmrc
npm install
npm run dev      # http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Checagem de tipos + build de produção em `dist/`. |
| `npm run preview` | Serve o build. |
| `npm run typecheck` | Só a checagem de tipos. |

## Fluxo de trabalho com o Claude e ajustes manuais

1. Peça o diagrama ao Claude com `/diagram-design` e salve o `.html` (ou o `.svg`).
2. No Diagram Studio, clique em **Importar** (ou arraste o arquivo para a janela).
3. Ajuste na mão: mova peças, renomeie, mude o tipo visual (destaque, armazenamento, externo...), religue setas.
4. **Exportar** em PNG/SVG. O SVG exportado carrega o modelo embutido: importar esse mesmo SVG
   restaura tudo editável, sem perdas.

## Atalhos

`V` selecionar · `H` navegar · `1`–`9` escolher peça/relação · `Espaço`+arrastar mover o quadro ·
`⌘Z` / `⇧⌘Z` desfazer/refazer · `⌘D` duplicar · `Delete` excluir · setas ajustam a posição (`⇧` = 16px) ·
`0` ajustar à tela · `+` `-` zoom.

## Estrutura

```
src/
  components/   # um componente por pasta: index.tsx (lógica/markup) + styles.ts (classes)
  diagrams/     # um DiagramSpec por tipo (peças, relações, regras, legenda, exemplo)
  lib/          # store (Zustand), roteamento, layout, exportação, fontes, importador
  hooks/        # viewport (pan/zoom), atalhos, checkpoint de desfazer
  types/        # modelo de dados (Diagram, DiagramNode, DiagramEdge)
docs/           # documentação detalhada
```

Detalhes de arquitetura e como criar um novo tipo de diagrama: [docs/arquitetura.md](docs/arquitetura.md).

## Branches

| Branch | Ambiente |
|---|---|
| `develop` | Principal, onde o desenvolvimento acontece. |
| `release` | Pré-produção. |
| `master` | Produção. |

A promoção segue `develop` → `release` → `master`, sempre por pull request.
