# Implementation Plan: Autoavaliação de Desempenho

**Branch**: `019-autoavaliacao` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-autoavaliacao/spec.md`

## Summary

Quarto elo de retenção: o **segundo payoff episódico**. A pessoa escolhe um **período** e o motor
**colhe todas as entradas do intervalo** e gera uma **autoavaliação estruturada por seções**
(entregas, impacto, evolução, pontos a desenvolver), em 2 variações, cada afirmação ancorada em
evidência real. Reusa o motor da 013 (`generateDraft`) como **novo formato** (`self_assessment`),
sem motor paralelo (constituição III). O gatilho de calendário (US2) reusa o ressurgimento da 016
(já em `main`), ressurgindo a autoavaliação **só no painel** no ritmo do ciclo de avaliação.

**Abordagem técnica (do audit do código):**
- **US1** = novo formato (`self_assessment`) no `promptFor` de `generateDraft` + novo schema + novo
  **seed por período** (`loadPeriodSeed`, espelhando `loadProjectSeed`, mas por intervalo de datas).
- **US2** = nova fonte de sinal no painel (`getReviewCycleSignal`) ao lado do `getReturnSignal` da
  016, lendo uma **recorrência configurável** persistida em `profiles`.
- **US3** = **zero código novo de motor**: edição/chips/cópia já funcionam para qualquer `format`
  via `/api/content/generate` + `/api/content/drafts`. Só o front escolhe o formato.
- **Migration 012** (próximo número livre; 011 é da 016): estende o CHECK de `drafts.format` para
  aceitar `self_assessment` **e** adiciona a recorrência do ciclo em `profiles` (aditivo, nullable).

## Technical Context

**Language/Version**: TypeScript estrito (sem `any`), Next.js 15 (App Router, RSC por padrão)

**Primary Dependencies**: Anthropic API (`claude-sonnet-4-6` p/ geração via role `synthesis`),
Supabase (Postgres + Auth + RLS), next-intl, Zod, Vitest + Testing Library

**Storage**: Supabase Postgres — reusa `drafts` (009/010) e `entries`; `profiles` ganha a recorrência

**Testing**: Vitest + Testing Library; TDD obrigatório (RED→GREEN), cobertura ≥ 80% nos caminhos novos

**Target Platform**: Web mobile-first (maioria do tráfego em mobile)

**Project Type**: Web application (Next.js full-stack — rotas API + RSC/Client components)

**Performance Goals**: geração dentro do envelope do motor atual (2 variações, 1 regeneração máx);
seed por período com **limite seguro de evidência** para não estourar contexto do LLM

**Constraints**: anti-IA ruleset obrigatório antes de exibir; nunca inventar número/entrega; contexto
de IA jamais inclui dado de outro usuário; RLS de `drafts` e `entries` preservada

**Scale/Scope**: 1 novo formato, 1 novo seed (período), 1 migration aditiva, 1 sinal de painel novo,
1 nova tela/fluxo de geração da autoavaliação. Reuso pesado da 013/014/015/016.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano atende |
|---|---|
| I. Security First | Auth-first na rota; período validado e escopado por `user_id` (RLS) antes do LLM; contexto de IA só do próprio usuário; sem ID interno vazado; input do range validado por Zod |
| II. TS Strict & Qualidade | Sem `any`; identificadores em inglês, UI em pt-BR via i18n; funções < 40 linhas; arquivos pequenos e coesos |
| III. AI-First | **Reusa `generateDraft`** (novo `format`, não motor novo); `claude-sonnet-4-6` p/ geração; saída validada (Zod + ruleset) antes de persistir; sem chamada redundante |
| IV. Server-First | Tela como RSC por padrão; `"use client"` só no fluxo interativo (seleção de período/edição); sem animação JS bloqueante |
| V. Acessibilidade | Labels em todos os controles (preset/range); hierarquia de headings das seções correta; alvos ≥ 48px no mobile |
| VI. TDD | Testes primeiro (RED) p/ seed por período, schema/prompt do formato, pontos a desenvolver, sinal de ciclo; ≥ 80% |
| VII. Design Identity | Reusa o design system existente (tokens, tipografia); `/impeccable shape` antes de codar a tela |
| VIII. Mobile-First | Tailwind mobile-first; seletor de período usável no toque |
| IX. i18n | Toda string em `src/messages/pt-BR.json`, `en.json` espelhando; zero hardcode |

**Resultado: PASS.** Nenhuma violação. Complexidade adicional zero (sem motor paralelo, sem nova
tabela — só extensão de CHECK + coluna aditiva). Seção de Complexity Tracking vazia por isso.

## Project Structure

### Documentation (this feature)

```text
specs/019-autoavaliacao/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões resolvidas
├── data-model.md        # Phase 1 — entidades e migration
├── quickstart.md        # Phase 1 — guia de validação
├── contracts/           # Phase 1 — contrato da geração + sinal de painel
│   └── self-assessment.md
├── checklists/
│   └── requirements.md  # ✅ validado
└── tasks.md             # Phase 2 — gerado pelo /speckit-tasks (NÃO neste comando)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/content/generate/route.ts        # estende enums (format + seedType 'period')
│   └── (área autenticada)/<tela autoavaliação>/  # nova tela US1 (RSC + client no fluxo)
├── components/features/<autoavaliacao>/      # seletor de período, render por seções (US1/US3 reuso)
├── lib/
│   ├── ai/content/
│   │   ├── generateDraft.ts                  # +ramo 'self_assessment' no promptFor
│   │   ├── schemas.ts                        # +selfAssessmentDraftSchema
│   │   ├── loadSeed.ts                       # +loadPeriodSeed (intervalo de datas)
│   │   └── prompts/selfAssessment.ts         # NOVO prompt do formato (seções + pontos a desenvolver)
│   ├── content/period.ts                     # NOVO: presets + parse/validação de range
│   └── panel/
│       ├── getReviewCycleSignal.ts           # NOVO sinal de calendário (US2)
│       └── getPanelData.ts                   # integra o sinal de ciclo ao painel
├── types/content.ts                          # +'self_assessment' em DraftFormat, +'period' em SeedType
└── messages/{pt-BR,en}.json                  # strings da feature

supabase/migrations/
└── 012_self_assessment_and_review_cycle.sql  # CHECK de format + recorrência em profiles
```

**Structure Decision**: Web application full-stack Next.js — mantém a estrutura existente da 013–016.
O peso da feature está em `src/lib/ai/content` (motor) e `src/lib/panel` (gatilho), reusando rota e
fluxo de edição/cópia. A tela nova vive na área autenticada; o número da migration (`012`) é
confirmado: `011` já está em `main` pela 016.

## Complexity Tracking

> Sem violações da constituição. Nada a justificar.
