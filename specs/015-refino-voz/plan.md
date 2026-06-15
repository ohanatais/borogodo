# Implementation Plan: Refino de Voz e Qualidade Contínua (+ mini-bio)

**Branch**: `015-refino-voz` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-refino-voz/spec.md`; epic plan
`docs/conteudo-plano-de-acao.md`. **Depende de 013 e 014.**

## Summary

Sobe a barra de qualidade ao longo do tempo. Três frentes: (1) **recalibração de voz** híbrida e com
consentimento, a partir do `voice_feedback` acumulado em `drafts`; (2) **golden set como gate de CI**,
determinístico, bloqueando regressão de voz em qualquer mudança de prompt; (3) **mini-bio** como
terceiro formato no mesmo motor (`format='mini_bio'`, migration `010` estende o CHECK). UI leve — reusa
as superfícies de 013/014.

## Technical Context

**Language/Version**: TypeScript strict (Next.js 15 App Router, React 19)

**Primary Dependencies**: reuso de `src/lib/ai/content/` (013), `voice_profile`/`drafts` (013),
golden set (013), GitHub Actions (`ci.yml`), Supabase, Vitest.

**Storage**: migration `010` — `ALTER` no CHECK de `drafts.format` para incluir `'mini_bio'`. Sem
tabela nova. `voice_profile` (JSONB, 013) evolui por recalibração.

**Testing**: Vitest; golden set ampliado (3 formatos) como gate de CI; teste de recalibração (sinal,
consentimento, preservação de amostras); schema/prompt de mini-bio.

**Target Platform**: Web app, mobile-first. **UI leve** (sem tela nova).

**Project Type**: Web application (Next.js full-stack).

**Performance Goals**: golden set roda no CI sem chamada de IA (determinístico + fixtures mockadas);
recalibração é pontual (uma chamada Sonnet ao aceitar), cacheada no `voice_profile`.

**Constraints**: voz nunca muda sem consentimento; amostras explícitas preservadas; RLS; saída validada
antes de persistir; zero string hardcoded.

**Scale/Scope**: ~22–28 tasks; 1 migration mínima (`010`); 1 prompt novo (mini-bio) + 1 schema; 1
fluxo de recalibração; ampliação do golden set + step de CI.

## Constitution Check

*GATE: deve passar antes da Fase 0. Re-checar após o design da Fase 1.*

| Princípio | Como cumpre |
|---|---|
| **I. Security First** | Recalibração e mini-bio sob RLS; contexto de IA só do próprio usuário; `voice_feedback`/`raw_content` nunca logados; sem vazar ID interno. |
| **II. TS Strict & Quality** | Sem `any`; funções < 40 linhas; arquivos < 800; erros explícitos; schema de mini-bio tipado por Zod. |
| **III. AI-First** | Recalibração e mini-bio via `claude-sonnet-4-6` (motor da 013), saída validada (Zod + ruleset) antes de persistir; `inferred_summary` recalibrado é cacheado. |
| **IV. Server-First & Perf** | Recalibração no servidor; golden set determinístico no CI (sem IA); mini-bio reusa o caminho server da 013. |
| **V. Acessibilidade AA** | A sugestão de recalibrar e o seletor de mini-bio reusam componentes acessíveis da 013/014; foco/label/contraste preservados. |
| **VI. TDD** | Testes primeiro: recalibração (sinal/consentimento/preservação), schema/ruleset de mini-bio, golden set ampliado; cobertura ≥ 80%. |
| **VII. Design Identity** | UI leve reusa as superfícies da 013/014; sem anti-padrões; `/impeccable audit` antes do PR (sem shape próprio — UI leve, conforme epic plan). |
| **VIII. Mobile-First** | A sugestão de recalibrar e a opção mini-bio revisadas a 375px; toques ≥ 48px. |
| **IX. i18n** | Strings novas em `presenca.*` (`pt-BR.json`); `en.json` espelha. |

**Veredito**: PASS. Única mudança de schema (`ALTER` no CHECK) justificada (formato novo no mesmo
motor). Sem Complexity Tracking.

> **Security gate**: a 015 toca voz do usuário (recalibração) e gera conteúdo — `/security-review`
> recomendado antes do PR, além de `/pr-review`.

## Project Structure

### Documentation (this feature)
```text
specs/015-refino-voz/
├── spec.md · research.md · plan.md · quickstart.md · tasks.md
```
(Sem `shape.md` próprio: UI leve, reusa as superfícies de 013/014; cobertura via `/impeccable audit`.)

### Source Code (repository root)
```text
src/
├── lib/ai/content/
│   ├── recalibrateVoice.ts            # NOVO: funde voice_feedback + amostras → voice_profile
│   ├── schemas.ts                     # ESTENDE: miniBioDraftSchema
│   ├── prompts/miniBio.ts             # NOVO: prompt mini-bio (anti-IA + anti-clichê de bio)
│   ├── bannedTerms.ts                 # ESTENDE: clichês de bio
│   ├── validateRuleset.ts             # ESTENDE: assert(s) anti-clichê de bio
│   └── __tests__/                      # ESTENDE: golden set 3 formatos + recalibração
├── app/api/content/
│   ├── voice/recalibrate/route.ts     # NOVO: sugere/aplica recalibração (com consentimento)
│   └── generate/route.ts              # ESTENDE: format='mini_bio'
├── components/features/content/
│   ├── GenerateSheet.tsx              # ESTENDE: opção 'mini-bio' no seletor de formato
│   └── VoiceRecalibratePrompt.tsx     # NOVO: sugestão "quer afinar sua voz?" (reusa estética)
└── messages/pt-BR.json · en.json      # presenca.* (recalibração, mini-bio)
supabase/migrations/
└── 010_drafts_mini_bio.sql            # ALTER: CHECK de drafts.format + 'mini_bio'
.github/workflows/ci.yml               # ESTENDE: golden set como gate (step dedicado/obrigatório)
```

**Structure Decision**: Web app full-stack. A 015 estende o módulo da 013 (recalibração + mini-bio),
amplia o golden set e o CI, e adiciona uma migration mínima. Sem tela nova; reusa as superfícies.

## Phasing (resumo; detalhe em tasks.md)

1. **Setup** — i18n (`presenca.*` recalibração/mini-bio).
2. **Foundational** — migration `010` (CHECK `mini_bio`); ampliar `bannedTerms`/ruleset (anti-clichê de
   bio); ampliar golden set (3 formatos) e ligar como gate no `ci.yml`.
3. **US1 (P1)** — recalibração de voz (sinal acumulado → sugestão → consentimento → atualiza
   `voice_profile`, preservando amostras).
4. **US2 (P1)** — golden set como guardrail de CI (gate obrigatório; teste de PR que degrada prompt
   falha).
5. **US3 (P2)** — mini-bio (schema + prompt + opção no `GenerateSheet`, persistir `format='mini_bio'`).
6. **Polish** — a11y, i18n, `/impeccable audit`, `/security-review`, `/pr-review`.

## Complexity Tracking

> Sem violações. A migration é um `ALTER` mínimo no CHECK (formato novo no mesmo motor). Nada a
> justificar.
