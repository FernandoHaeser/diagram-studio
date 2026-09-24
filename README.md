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
| `npm run docker:up` / `docker:down` / `docker:logs` | Sobe, derruba e acompanha o container. |

## Docker

A imagem compila o front e serve só o `dist/` com nginx **sem privilégios** (usuário não-root,
sistema de arquivos somente leitura, sem capabilities). A porta é publicada em `0.0.0.0`, então
o app fica acessível por todas as interfaces do host: `localhost`, a LAN e as redes bridge
(`docker0` e as customizadas).

```bash
docker compose up -d --build     # ou: npm run docker:up
# abre http://localhost:8080
docker compose down              # ou: npm run docker:down
```

| Item | Detalhe |
|---|---|
| Porta | `8080` por padrão; troque com `PORT=9000 docker compose up -d`. |
| Dentro do container | nginx escuta em `8080` (IPv4 e IPv6). |
| Outros containers | Alcançam pelo host: `http://host.docker.internal:8080`. Para falar direto pelo nome do serviço, conecte a rede: `docker network connect <rede> diagram-studio` e use `http://diagram-studio:8080`. |
| Saúde | `HEALTHCHECK` embutido; veja com `docker ps` ou `docker inspect diagram-studio`. |
| Segurança | CSP restritiva e cabeçalhos de proteção definidos em `nginx.conf`. |

Como o app publica em todas as interfaces, use rede confiável ou coloque um proxy com
autenticação na frente se for expor fora da sua máquina: o app em si não tem login.

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
