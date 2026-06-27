# Phase 1 — Contrato de rotas e redirects

> Interface "exposta" desta feature = o **mapa de rotas** e o comportamento de navegação.
> `localePrefix: 'never'` → URLs planas (sem `/pt-BR`). Nenhuma rota de API nova.

## Destinos de topo (menu)

| Destino | Rota | Estado antes | Estado depois |
|---|---|---|---|
| Painel | `/painel` | item de topo | item de topo (Home; ganha porta de conversa) |
| Espelho | `/espelho` | item de topo (só Forças) | item de topo, 2 vistas (`?vista=`) |
| Registros | `/registros` | item de topo | item de topo (inalterado) |
| Usar | `/usar` | — | **novo** item de topo (landing de intenção) |
| ~~Linha do Tempo~~ | `/historico` | item de topo | **redirect** → `/espelho?vista=trajetoria` |
| ~~Repertório~~ | `/presenca` | item de topo | sob "Usar" (rota viva; sai do topo) |
| ~~Autoavaliação~~ | `/autoavaliacao` | item de topo | sob "Usar" (rota viva; sai do topo) |
| Configurações | `/configuracoes` | rodapé | rodapé (inalterado) |

## Contrato de cada rota

### `/usar` (NOVO — Fase 1)
- **GET** RSC. Renderiza dois caminhos: "mostrar pra fora" → `/presenca`; "me preparar" →
  `/autoavaliacao`. Sem busca pesada. Textos via i18n `usar.*`.
- **Ativo no menu**: destino "Usar".

### `/espelho` (Fase 3)
- **GET `?vista=forcas`** (default): busca `getLatestSnapshot`, renderiza `MirrorContent`.
- **GET `?vista=trajetoria`**: busca `getHistoricoData`, renderiza a Trajetória reusando
  `HistoricoPageClient` (com `ProjectDetailPanel` intacto).
- **Invariante**: a página busca **só** a query da vista ativa (FR-010).
- **Ativo no menu**: "Espelho" em ambas as vistas.

### `/historico` (Fase 3)
- **GET**: `redirect('/espelho?vista=trajetoria')`. Nunca 404 (FR-006/007). Os componentes
  permanecem em `historico/` e são importados pela vista de Trajetória.

### `/presenca`, `/autoavaliacao` (Fases 1)
- Rotas **inalteradas** no comportamento; apenas deixam de ser itens de topo. Acendem o destino
  "Usar" no menu (`activePrefixes`).

### `/painel` (Fase 4)
- **GET** RSC (inalterado nos dados). Acrescenta `PainelChatDoor` no topo, que dispara
  `openChatSheet` (modo pergunta). Cards atuais **não** mudam (clarify).

## Contrato de não-regressão

- `/historico` direto e qualquer deep link antigo → destino válido, zero 404.
- Os testes existentes em `historico/__tests__/*` e `painel/__tests__/page.test.tsx` permanecem
  verdes após o re-parent (a Trajetória usa os mesmos componentes).
- A barra global "Registrar | Perguntar" permanece em todas as páginas, inclusive Painel.
