# Implementation Plan: Presença (hub e costura)

**Branch**: `014-presenca` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-presenca/spec.md`; epic plan
`docs/conteudo-plano-de-acao.md`. **Depende da fundação da 013.**

## Summary

Tira a geração do silo: cria o hub `/presenca` (lista de rascunhos persistidos de `drafts`, com
retomar/copiar/descartar e caminhos de entrada sempre com evidência), adiciona o item de nav
"Presença", estende "Usar" para o **projeto** da Linha do Tempo (`seed_type='project'`, evidência
agregada), e liga o **nudge proativo** `content_opportunity` (reuso de `proactive_insights` +
`triggerProactiveInsight`). Sem tabela nova, sem migration. Reusa o motor e os componentes de geração
da 013.

## Technical Context

**Language/Version**: TypeScript strict (Next.js 15 App Router, React 19)

**Primary Dependencies**: reuso de `src/lib/ai/content/` (013), `proactive_insights` + insights lib,
`getHistoricoData`, Supabase, next-intl, shadcn/ui, Framer Motion (entrada), Lucide.

**Storage**: **nenhuma alteração de schema** — lê `drafts` (013) e `proactive_insights` (existente);
escreve `proactive_insights` com novo `type='content_opportunity'`.

**Testing**: Vitest + Testing Library; testes de listagem (RLS, paginação), de "Usar projeto" (seed
agregado) e do disparo do nudge (precisão por sinal).

**Target Platform**: Web app, mobile-first.

**Project Type**: Web application (Next.js full-stack).

**Performance Goals**: lista do hub paginada/limitada (sem query ilimitada); nudge disparado no
pipeline existente, sem custo extra de IA no caminho de leitura do hub.

**Constraints**: RLS em toda leitura; nenhum dado de usuário logado; reuso dos componentes da 013 (sem
duplicar UI/motor); toques ≥ 48px; contraste AA; zero string hardcoded.

**Scale/Scope**: ~25–32 tasks; 0 migration; 1 rota nova (`/presenca`) + 1 item de nav; 2 pontos de
entrada novos (projeto + nudge); reuso pesado da 013.

## Constitution Check

*GATE: deve passar antes da Fase 0. Re-checar após o design da Fase 1.*

| Princípio | Como cumpre |
|---|---|
| **I. Security First** | RLS de `drafts` e `proactive_insights` (já existentes) cobre toda leitura/escrita; auth-first nas rotas; "Usar projeto" valida que as entradas são do usuário; nenhum conteúdo logado; IDs internos não vazam. |
| **II. TS Strict & Quality** | Sem `any`; 1 componente por arquivo; funções < 40 linhas; arquivos < 800 linhas; erros explícitos. |
| **III. AI-First** | Nenhuma chamada de IA nova no hub (leitura). O nudge usa o pipeline de insights existente; geração só via motor da 013 (Sonnet, validado). |
| **IV. Server-First & Perf** | Hub como RSC (lista vem do servidor, paginada); `"use client"` só nos controles (retomar/copiar/descartar). |
| **V. Acessibilidade AA** | Lista navegável por teclado; "Usar"/nudge com label; foco visível; contraste AA. |
| **VI. TDD** | Testes primeiro para listagem (RLS/paginação), seed de projeto e precisão do nudge; cobertura ≥ 80%. |
| **VII. Design Identity** | Tokens; Fraunces; sem anti-padrões; **`/impeccable shape` antes de codar** ([shape.md](./shape.md)); reuso dos componentes da 013; `/impeccable audit` antes do PR. |
| **VIII. Mobile-First** | Hub desenhado a 375px primeiro; item de nav coerente com a barra mobile; toques ≥ 48px. |
| **IX. i18n** | `presenca.*` em `pt-BR.json`; `en.json` espelha; chaves em inglês camelCase. |

**Veredito**: PASS. Sem violações; sem Complexity Tracking (reuso, zero schema novo).

> **Security gate**: a 014 não cria tabela nem chamada de IA nova, mas toca dado do usuário (listagem)
> e nav. `/pr-review` antes do PR; `/security-review` é opcional (sem nova superfície de dado), a
> critério no PR.

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
│   ├── page.tsx                      # RSC: hub (lista paginada de drafts)
│   └── PresencaHubClient.tsx         # controles (retomar/copiar/descartar)
├── app/api/content/drafts/route.ts   # ESTENDE 013: GET (listagem paginada)
├── components/
│   ├── layout/AppShellClient.tsx     # ADICIONA item "Presença" em NAV_ITEMS
│   └── features/
│       ├── presenca/
│       │   ├── PresencaHub.tsx        # lista + caminhos de entrada (nunca vazio)
│       │   ├── DraftListItem.tsx      # item da lista (formato, status, evidência)
│       │   └── EntryPaths.tsx         # caminhos de entrada quando não há rascunho
│       ├── content/                   # REUSO da 013 (GenerateSheet, DraftCard, UsarButton...)
│       └── historico/                 # ADICIONA UsarButton no projeto (ProjectDetailPanel)
├── lib/
│   ├── db/drafts.ts                   # ESTENDE 013: listDrafts (paginado, RLS)
│   └── ai/insights/
│       ├── triggerProactiveInsight.ts # LIGA o disparo de content_opportunity
│       └── prompts/                    # prompt do nudge content_opportunity
└── messages/pt-BR.json · en.json      # presenca.* (hub, nudge)
```

**Structure Decision**: Web app full-stack. A 014 adiciona uma rota e componentes de listagem, estende
`drafts.ts` (listagem) e `triggerProactiveInsight` (nudge), e reusa todo o motor/UX de geração da 013.
Nenhum arquivo de migration.

## Phasing (resumo; detalhe em tasks.md)

1. **Setup** — i18n `presenca.*` (hub/nudge), tipos de listagem.
2. **Foundational** — `listDrafts` (paginado, RLS) + `GET /api/content/drafts`; item de nav "Presença".
3. **US1 (P1)** — hub `/presenca`: lista, retomar/copiar/descartar, caminhos de entrada (nunca vazio).
4. **US2 (P1)** — "Usar projeto" no `/historico` (`seed_type='project'`, evidência agregada).
5. **US3 (P2)** — nudge `content_opportunity` (disparo no pipeline + card no painel + CTA).
6. **Polish** — a11y, i18n, revalidar nav/barra vs. 012-chat, `/impeccable audit`, `/pr-review`.

## Complexity Tracking

> Sem violações. Zero migration, zero tabela nova, reuso do motor da 013. Nada a justificar.
