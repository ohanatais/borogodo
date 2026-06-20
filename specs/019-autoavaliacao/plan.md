# Implementation Plan: Autoavaliação de Desempenho (modelo cockpit)

**Branch**: `019-autoavaliacao` | **Date**: 2026-06-19 (redesign) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-autoavaliacao/spec.md` (Clarifications 2026-06-19) +
direção `docs/estrategia-autoavaliacao-cockpit.md`. **Substitui** o plano de 2026-06-16 (modelo "gerar
2 variações"), agora superado.

## Summary

Quarto elo de retenção, redesenhado para o modelo **cockpit: lembrar → refletir → planejar**. A pessoa
escolhe um **período**; o sistema mostra **"o seu ano, em fatos"** (recap factual e com fonte, sem
adjetivo); a pessoa **escreve a própria autoavaliação** em primeira pessoa, com a **trilha de
evidências ao lado** e assistência **não-invasiva** da IA (reescreve com minhas palavras, destrava com
1 pergunta, nudge de impacto STAR — nunca gera bloco, nunca dá nota). Depois, **uma** oferta opcional
de **passo-pra-frente** (plano GROW+70-20-10 ou prep de 1:1) ancorada nas palavras dela. Tese dos
**dois modos**: "pra dentro" (autoavaliação) = pessoa escreve / IA ancora.

**Abordagem técnica (do audit do código + research do redesign):**
- **Sai do caminho:** o ramo `self_assessment` de `generateDraft`, o prompt de geração e a extensão da
  rota `/api/content/generate` (research D1). A autoavaliação não é gerada.
- **Recap (D2):** loader **determinístico** `loadPeriodRecap` sobre o `loadPeriodSeed` (já existe) —
  sem LLM, cada item com a fonte. Garante zero invenção/adjetivo por construção.
- **Escrita assistida (D3):** módulo novo `assist.ts` + rota `POST /api/autoavaliacao/assist` com 3
  modos (rephrase/unblock → Sonnet; star_nudge → heurística). Nunca insere bloco.
- **Passo-pra-frente (D5):** rota `POST /api/autoavaliacao/forward-step` (Sonnet, anti-invenção
  bloqueante), persistido em `drafts.qa.forwardStep`. Única IA geradora da feature.
- **Persistência (D4):** a autoavaliação escrita vive em `drafts` (`format='self_assessment'`,
  `status='draft'`, `body` = texto humano), isolada do espelho. Reuso de `POST/PATCH /api/content/drafts`.
- **Gatilho de calendário (D7):** `getReviewCycleSignal` paralelo ao `getReturnSignal` da 016; só painel.
- **Migration 013 (D9):** estende `format`/`seed_type`/`status` de `drafts` + recorrência em `profiles`.
  Renumerada de 012 → 013 para resolver a colisão com `012_entry_title.sql` (017, já em `main`).

**Fundação da PR 46 reaproveitada:** `loadPeriodSeed` + `period.ts` + `PeriodPicker`, persistência em
`drafts`, colunas de recorrência, entrypoint na nav, `SelfAssessmentHistory`. **Descartado:** prompt de
geração, ramo de `generateDraft`, e a tela `GenerateSheet`/`DraftCard` como superfície da autoavaliação.

## Technical Context

**Language/Version**: TypeScript estrito (sem `any`), Next.js 15 (App Router, RSC por padrão)

**Primary Dependencies**: Anthropic API (`claude-sonnet-4-6` p/ rephrase/unblock/forward-step;
**nenhum** LLM no recap e no star_nudge — determinísticos), Supabase (Postgres + Auth + RLS),
next-intl, Zod, Vitest + Testing Library

**Storage**: Supabase Postgres — reusa `drafts` (009/010) e `entries`; `profiles` ganha a recorrência

**Testing**: Vitest + Testing Library; TDD obrigatório (RED→GREEN), cobertura ≥ 80% nos caminhos novos

**Target Platform**: Web mobile-first (maioria do tráfego em mobile)

**Project Type**: Web application (Next.js full-stack — rotas API + RSC/Client components)

**Performance Goals**: recap sem custo de LLM (determinístico); assist com chamadas pequenas e pontuais
(1 frase por vez); forward-step com 1 regeneração máx; seed por período com `MAX_PERIOD_EVIDENCE` para
não estourar contexto nem UI

**Constraints**: a IA **nunca** gera o bloco da autoavaliação nem dá nota; o texto da pessoa **não**
passa pelo ruleset anti-IA (é humano) e **não** vaza pro espelho; o forward-step só usa o que a pessoa
escreveu (anti-invenção bloqueante); contexto de IA jamais inclui dado de outro usuário; RLS preservada

**Scale/Scope**: 1 loader determinístico (recap), 1 módulo de assist (3 modos), 1 rota de forward-step,
1 sinal de painel, 1 migration aditiva, 1 superfície de escrita (cockpit). Remoção do ramo de geração.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano atende |
|---|---|
| I. Security First | Auth-first nas rotas; período validado e escopado por `user_id` (RLS) antes do LLM; forward-step lê só o `body` do próprio usuário; sem ID interno vazado; input validado por Zod no boundary |
| II. TS Strict & Qualidade | Sem `any`; identificadores em inglês, UI em pt-BR via i18n; funções < 40 linhas; arquivos pequenos e coesos; `assist.ts`/recap separados de `generateDraft` (coesão) |
| III. AI-First | A IA é **âncora**, não geradora (exceto o forward-step, validado antes de persistir); `claude-sonnet-4-6` só onde há reescrita/voz; recap e star_nudge **sem** LLM (evita custo e invenção); wrappers em `src/lib/ai/` |
| IV. Server-First | Recap e histórico como RSC; `"use client"` só na superfície de escrita interativa; sem animação JS bloqueante |
| V. Acessibilidade | Labels em todos os controles (período, seções, chips de evidência); hierarquia de headings das seções; alvos ≥ 48px no mobile |
| VI. TDD | Testes primeiro (RED) p/ recap determinístico, cada modo do assist, forward-step (anti-invenção), sinal de ciclo; ≥ 80% |
| VII. Design Identity | Reusa o design system; `/impeccable shape` antes de codar a cabine de escrita (superfície nova) |
| VIII. Mobile-First | Tailwind mobile-first; escrita + trilha de evidências usáveis no toque (trilha colapsável no mobile) |
| IX. i18n | Toda string em `src/messages/pt-BR.json`, `en.json` espelhando; zero hardcode |

**Resultado: PASS.** Nenhuma violação. Complexidade adicional baixa: zero tabela nova; a IA geradora
fica restrita a um único ponto (forward-step) com guarda-corpo bloqueante. Seção de Complexity Tracking
vazia.

## Project Structure

### Documentation (this feature)

```text
specs/019-autoavaliacao/
├── plan.md              # Este arquivo (cockpit)
├── research.md          # Phase 0 — decisões do redesign (D1–D9)
├── data-model.md        # Phase 1 — entidades + migration 013
├── quickstart.md        # Phase 1 — guia de validação (cockpit)
├── contracts/
│   └── self-assessment.md  # Phase 1 — recap, assist, forward-step, sinal de painel
├── design-brief.md      # ⚠️ do modelo antigo — refazer no /impeccable shape
├── checklists/
│   └── requirements.md  # validado (reler à luz do redesign)
└── tasks.md             # ⚠️ do modelo antigo — REGERAR com /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [locale]/(app)/autoavaliacao/page.tsx   # cabine: período → recap → escrita → passo-pra-frente
│   └── api/
│       ├── autoavaliacao/assist/route.ts       # NOVO — rephrase/unblock/star_nudge (US1)
│       ├── autoavaliacao/forward-step/route.ts # NOVO — plano de ação / prep de 1:1 (US2)
│       ├── content/generate/route.ts           # REMOVER o ramo self_assessment (volta ao estado pré-46)
│       └── content/drafts/route.ts             # reuso: persiste self_assessment (status 'draft')
├── components/features/autoavaliacao/
│   ├── PeriodPicker.tsx                         # mantido (PR 46)
│   ├── YearInFactsRecap.tsx                     # NOVO — recap factual com chips de fonte (US1)
│   ├── AssessmentEditor.tsx                     # NOVO — escrita por seções + trilha de evidências (US1)
│   ├── ForwardStepOffer.tsx                     # NOVO — oferta única do passo-pra-frente (US2)
│   └── SelfAssessmentHistory.tsx                # mantido (US3)
├── lib/
│   ├── autoavaliacao/
│   │   ├── periodRecap.ts                       # NOVO — recap determinístico do loadPeriodSeed (D2)
│   │   └── sentenceStems.ts                     # NOVO — stems ancorados em fato (D6)
│   ├── ai/content/
│   │   ├── assist.ts                            # NOVO — rephrase/unblock (Sonnet) + star heurístico (D3)
│   │   ├── forwardStep.ts                       # NOVO — gera o passo-pra-frente, anti-invenção (D5)
│   │   ├── generateDraft.ts                     # REMOVER o ramo self_assessment do promptFor
│   │   ├── prompts/selfAssessment.ts            # REMOVER (era prompt de geração)
│   │   └── loadSeed.ts                          # mantido (loadPeriodSeed)
│   └── panel/
│       ├── getReviewCycleSignal.ts              # NOVO — sinal de calendário (US2)
│       └── getPanelData.ts                      # integra o sinal de ciclo ao painel
├── types/content.ts                             # +'self_assessment'/'period'/'draft'; +ForwardStep
└── messages/{pt-BR,en}.json                     # strings da feature (cockpit)

supabase/migrations/
└── 013_self_assessment_and_review_cycle.sql     # CHECK format/seed_type/status + recorrência
```

**Structure Decision**: Web application full-stack Next.js — mantém a estrutura da 013–017. O peso da
feature migra do "motor de geração" para a **superfície de escrita** (`components/features/autoavaliacao`)
+ um loader determinístico de recap e dois helpers de IA pequenos e isolados (`assist`, `forwardStep`),
fora de `generateDraft`. Migration **013** confirmada (012 ocupado pela 017).

## Complexity Tracking

> Sem violações da constituição. Nada a justificar. (A única IA geradora — forward-step — fica isolada
> e com guarda-corpo anti-invenção bloqueante.)

## Pontos a confirmar com a Ohana (não bloqueiam o plano)

1. **D5 — persistência do passo-pra-frente:** `drafts.qa.forwardStep` (jsonb, zero migration extra,
   recomendado no v1) vs. draft-irmão com lifecycle próprio (fast-follow). 
2. **SC da spec:** ainda usam o vocabulário do modelo antigo ("2 variações geradas"). Reconciliar no
   `/speckit-tasks` ou num clarify curto antes de codar.
3. **`tasks.md` e `design-brief.md` atuais** são do modelo antigo → regerar (`/speckit-tasks`) e refazer
   no `/impeccable shape` da cabine de escrita.
