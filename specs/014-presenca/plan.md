# Implementation Plan: Presença (hub, gestão de rascunhos e sugestões)

**Branch**: `014-presenca` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-presenca/spec.md`; epic plan
`docs/conteudo-plano-de-acao.md`. **Depende da fundação da 013.**

## Summary

A Presença vira a casa e a central de gestão do conteúdo da pessoa. A 014 cria/consolida o hub
`/presenca` (lista paginada de `drafts`, com começar/retomar e os caminhos de entrada sempre com
evidência), adiciona o item de nav "Presença", e entrega a **gestão total do rascunho**: editar (via
retomar), copiar, **arquivar** (soft, reversível), **excluir definitivamente** (hard delete com
confirmação), **restaurar** e **organizar** (filtro por status/formato). Estende "Usar" para o
**projeto** da Linha do Tempo (`seed_type='project'`, evidência agregada) e liga as **sugestões de
conteúdo** nos dois lugares: o **nudge** `content_opportunity` no Painel (reuso de `proactive_insights`
+ `triggerProactiveInsight`) e a faixa **"Sugestões pra você"** na Presença (dado já existente, sem IA no
caminho de leitura). **Sem tabela nova, sem migration** — `status='discarded'` e a RLS de `delete` já
vêm da 013.

## Technical Context

**Language/Version**: TypeScript strict (Next.js 15 App Router, React 19)

**Primary Dependencies**: reuso de `src/lib/ai/content/` (013), `proactive_insights` + insights lib,
`getHistoricoData`, Supabase, next-intl, shadcn/ui, Framer Motion (entrada), Lucide.

**Storage**: **nenhuma alteração de schema** — lê/escreve `drafts` (013, incluindo `delete` via RLS já
existente) e `proactive_insights` (existente, novo `type='content_opportunity'`).

**Testing**: Vitest + Testing Library; testes de listagem (RLS, paginação, filtro de status), de gestão
(arquivar exclui da lista ativa; excluir remove de vez; restaurar; confirmação de exclusão), de "Usar
projeto" (seed agregado) e do disparo do nudge (precisão por sinal).

**Target Platform**: Web app, mobile-first.

**Project Type**: Web application (Next.js full-stack).

**Performance Goals**: lista do hub paginada/limitada (sem query ilimitada); filtros na query (não no
cliente); nudge no pipeline existente; **zero IA no caminho de leitura do hub** (sugestões são dado
existente).

**Constraints**: RLS em toda leitura/escrita; nenhum dado de usuário logado; reuso dos componentes da
013 (sem duplicar UI/motor); exclusão definitiva sempre com confirmação; toques ≥ 48px; contraste AA;
zero string hardcoded.

**Scale/Scope**: ~30–36 tasks; **0 migration**; 1 rota nova (`/presenca`) + 1 item de nav; gestão estende
`drafts.ts` e as rotas de drafts (GET paginado + DELETE); 2 pontos de entrada novos (projeto + nudge) +
faixa de sugestões na Presença; reuso pesado da 013.

## Constitution Check

*GATE: deve passar antes da Fase 0. Re-checar após o design da Fase 1.*

| Princípio | Como cumpre |
|---|---|
| **I. Security First** | RLS de `drafts` (incl. `delete`) e `proactive_insights` cobre toda leitura/escrita; auth-first nas rotas; gestão (editar/arquivar/excluir) escopada por `user_id` E `id`; exclusão definitiva pede confirmação; "Usar projeto" valida que as entradas são do usuário; nenhum conteúdo logado; IDs internos não vazam. |
| **II. TS Strict & Quality** | Sem `any`; 1 componente por arquivo; funções < 40 linhas; arquivos < 800 linhas; erros explícitos. |
| **III. AI-First** | Nenhuma chamada de IA nova no hub nem nas sugestões da Presença (leitura de dado existente). O nudge usa o pipeline de insights existente; geração só via motor da 013 (Sonnet, validado). |
| **IV. Server-First & Perf** | Hub como RSC (lista vem do servidor, paginada/filtrada); `"use client"` só nos controles (retomar/editar/arquivar/excluir/restaurar/filtrar). |
| **V. Acessibilidade AA** | Lista e ações navegáveis por teclado; confirmação de exclusão acessível (foco preso, ESC); "Usar"/nudge com label; foco visível; contraste AA. |
| **VI. TDD** | Testes primeiro para listagem (RLS/paginação/filtro), gestão (arquivar/excluir/restaurar), seed de projeto e precisão do nudge; cobertura ≥ 80%. |
| **VII. Design Identity** | Tokens; Fraunces; sem anti-padrões; **`/impeccable shape` antes de codar** ([shape.md](./shape.md)); reuso dos componentes da 013; `/impeccable audit` antes do PR. |
| **VIII. Mobile-First** | Hub e ações desenhados a 375px primeiro; gestão acessível na lista mobile; toques ≥ 48px. |
| **IX. i18n** | `presenca.*` em `pt-BR.json`; `en.json` espelha; chaves em inglês camelCase. |

**Veredito**: PASS. Sem violações; sem Complexity Tracking (reuso, zero schema novo).

> **Security gate**: a expansão adiciona **exclusão definitiva (DELETE)** e edição/arquivamento — nova
> superfície de **escrita** sobre dado do usuário. Por isso `/security-review` passa de opcional a
> **recomendado** antes do PR (além do `/pr-review`): conferir auth-first, escopo por `user_id` no
> DELETE/PATCH, e que a confirmação de exclusão é só UX (a barreira real é a RLS).

## Project Structure

### Documentation (this feature)
```text
specs/014-presenca/
├── spec.md · research.md · plan.md · data-model.md · quickstart.md · shape.md
├── contracts/presenca-api.md
└── tasks.md
```

### Source Code (repository root)
```text
src/
├── app/[locale]/(app)/presenca/
│   ├── page.tsx                      # RSC: hub (lista paginada/filtrada + sugestões)
│   └── PresencaHubClient.tsx         # controles (retomar/editar/arquivar/excluir/restaurar/filtrar)
├── app/api/content/drafts/
│   ├── route.ts                      # ESTENDE 013: GET (listagem paginada + filtro de status)
│   └── [id]/route.ts                 # ESTENDE 013: DELETE (exclusão definitiva); PATCH já cobre edição/arquivar/restaurar
├── components/
│   ├── layout/AppShellClient.tsx     # item "Presença" em NAV_ITEMS (já existe no working tree da 013)
│   └── features/
│       ├── presenca/
│       │   ├── PresencaHub.tsx        # lista + filtros + caminhos de entrada (nunca vazio)
│       │   ├── DraftListItem.tsx      # item (formato, status, evidência) + menu de ações
│       │   ├── DeleteConfirm.tsx      # confirmação de exclusão definitiva (Radix Dialog)
│       │   ├── StatusFilter.tsx       # filtro por status/formato
│       │   ├── EntryPaths.tsx         # caminhos de entrada quando não há rascunho (reusa PresencaCreate)
│       │   └── SuggestionsStrip.tsx   # "Sugestões pra você" (nudges pendentes + pontos de partida)
│       ├── content/                   # REUSO da 013 (GenerateSheet, DraftCard, UsarButton, PresencaCreate...)
│       └── historico/                 # ADICIONA UsarButton no projeto (ProjectDetailPanel)
├── lib/
│   ├── db/drafts.ts                   # ESTENDE 013: listDrafts (paginado, filtro de status, exclui arquivados) + deleteDraft
│   ├── presenca/getSuggestions.ts     # pontos de partida determinísticos (temas/entradas fortes sem rascunho)
│   └── ai/insights/
│       ├── triggerProactiveInsight.ts # LIGA o disparo de content_opportunity
│       └── prompts/                    # prompt do nudge content_opportunity
└── messages/pt-BR.json · en.json      # presenca.* (hub, gestão, sugestões, nudge)
```

**Structure Decision**: Web app full-stack. A 014 consolida a rota do hub, estende `drafts.ts` (listagem
com filtro + `deleteDraft`) e as rotas de drafts (GET + DELETE), adiciona a confirmação de exclusão, o
filtro e a faixa de sugestões, estende `triggerProactiveInsight` (nudge), e reusa todo o motor/UX de
geração da 013. **Nenhum arquivo de migration.**

## Phasing (resumo; detalhe em tasks.md)

1. **Setup** — i18n `presenca.*` (hub, gestão, sugestões, nudge); tipos de listagem/filtro/sugestão.
2. **Foundational** — `listDrafts` (paginado, filtro de status, **exclui arquivados por padrão**) +
   `deleteDraft`; `GET /api/content/drafts` + `DELETE /api/content/drafts/[id]`; item de nav (consolidar).
3. **US1 (P1)** — hub `/presenca`: lista, começar/retomar, caminhos de entrada (nunca vazio).
4. **US2 (P1)** — gestão total: editar (retomar), copiar, arquivar/restaurar, excluir (confirmação),
   filtrar por status/formato; conserto do filtro de arquivados.
5. **US3 (P1)** — "Usar projeto" no `/historico` (`seed_type='project'`, evidência agregada).
6. **US4 (P2)** — sugestões: nudge `content_opportunity` no Painel + faixa "Sugestões pra você" na
   Presença (pontos de partida determinísticos).
7. **Polish** — a11y, i18n, revalidar nav/barra vs. 012-chat, `/impeccable audit`, `/security-review`,
   `/pr-review`.

## Complexity Tracking

> Sem violações. Zero migration, zero tabela nova (a gestão usa colunas e a política RLS de `delete` já
> criadas na 013), reuso do motor da 013. Nada a justificar.
