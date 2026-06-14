# Implementation Plan: Espelho Honesto

**Branch**: `006-espelho-honesto` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-espelho-honesto/spec.md`

**Note**: Plano retroativo (regularização do PR #13). Descreve a arquitetura **já implementada**, não um trabalho a fazer.

## Summary

O espelho honesto eleva a síntese de carreira de "saída de LLM com boa intenção" para "saída com qualidade verificável". A abordagem combina (1) um prompt do Sonnet reescrito com princípios anti-bajulação e (2) um **validador determinístico** que aplica 9 regras objetivas sobre o JSON de saída, sem chamar IA — tornando "honesto" uma propriedade testável contra fixtures. A leitura acontece em `/espelho` (Server Component) com cards de evidência e captura de feedback de ressonância.

## Technical Context

**Language/Version**: TypeScript estrito (sem `any`), Next.js 15 (App Router)

**Primary Dependencies**: Anthropic SDK (`claude-sonnet-4-6`), next-intl, Framer Motion, shadcn/ui

**Storage**: Supabase Postgres — tabela `mirror_snapshots` (com RLS por `user_id`)

**Testing**: Vitest + Testing Library; fixtures determinísticas em `tests/fixtures/mirror/`

**Target Platform**: Web (Next.js, Server Components por padrão)

**Project Type**: Web application (Next.js full-stack, único projeto)

**Performance Goals**: Validação de qualidade roda sem custo/latência de IA (puro string/regex). Geração do espelho via Sonnet ~3–8s (assíncrona no fluxo de captura).

**Constraints**: Funções ≤ 40 linhas; arquivos ≤ 800 linhas; saída do LLM validada antes de persistir; contexto de IA nunca mistura dados de outro usuário.

**Scale/Scope**: Considera as 20 entradas mais recentes por usuário; 9 regras de validação; 4 fixtures de perfis de PM.

## Constitution Check

*GATE: avaliado contra `.specify/memory/constitution.md`.*

| Princípio | Status | Como a feature atende |
|---|---|---|
| I. Security First | ✅ | `mirror_snapshots` com RLS por `user_id`; nenhuma entrada de usuário logada; sem segredos no código; contexto de IA isolado por usuário |
| II. TypeScript Strict & Code Quality | ✅ | Sem `any` (usa `unknown` + narrowing defensivo em `validateRuleset.ts`); identificadores em inglês, UI em pt-BR; funções pequenas; `validateRuleset.ts` ~190 linhas |
| III. AI-First Architecture | ✅ | `claude-sonnet-4-6` para o espelho; wrappers sob `src/lib/ai/mirror/`; **saída validada antes de persistir** (validador determinístico + Zod) |
| IV. Server-First & Performance | ✅ | `/espelho` é Server Component; feedback via Server Action; validação sem trabalho de IA |
| V. Accessibility & WCAG AA | ✅ | Botões de feedback com label acessível; hierarquia de headings dos cards |
| VI. Test-First (TDD) | ⚠️ Parcial | Esta foi entregue como regularização; os testes do ruleset existem e passam, mas a ordem RED→GREEN não pode ser comprovada retroativamente (ver Complexity Tracking) |
| VII. Design Identity | ✅ | Tom brasileiro, honesto, anti-clichê — é literalmente o objeto da feature (lista de buzzwords/gírias banidas) |

**Resultado**: passa. A única ressalva (VI) é inerente a regularizar feature já construída e está justificada abaixo.

## Project Structure

### Documentation (this feature)

```text
specs/006-espelho-honesto/
├── spec.md              # spec retroativa
├── plan.md              # este arquivo
├── research.md          # decisões técnicas (validador determinístico, contrato de saída)
├── data-model.md        # Mirror, RulesetViolation, mirror_snapshots
├── quickstart.md        # como validar a feature end-to-end
├── contracts/           # contrato da saída do espelho + do validador
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/[locale]/espelho/
│   ├── page.tsx                      # leitura do espelho (Server Component)
│   └── actions.ts                    # Server Action de feedback
├── components/features/espelho/
│   ├── MirrorContent.tsx             # render dos cards (intro, 3 cards, closing)
│   ├── MirrorFeedback.tsx            # "Sim, faz sentido" / "Nem tanto"
│   └── __tests__/                    # testes de componente
├── lib/ai/mirror/
│   ├── prompts/firstMirror.ts        # prompt reescrito (anti-bajulação)
│   ├── validateRuleset.ts            # validador determinístico (9 asserts)
│   ├── generateMirror.ts             # geração + persistência (Sonnet)
│   └── schemas.ts                    # validação Zod da saída
├── lib/panel/getMirrorStatus.ts      # status do espelho para o painel
└── types/mirror.ts                   # Mirror (closing substituiu closing_question)

tests/
├── fixtures/mirror/                  # 4 fixtures de PM (boas/ruins)
├── unit/mirror-ruleset.test.ts       # cobertura dos 9 asserts
├── unit/mirror-schemas.test.ts
├── unit/generate-mirror.test.ts
├── integration/mirror-generate-route.test.ts
└── smoke/mirror-generation.smoke.test.ts
```

**Structure Decision**: Web app Next.js single-project. A lógica de IA fica isolada em `src/lib/ai/mirror/` (princípio III), a UI em `src/app` + `src/components/features/espelho`, e a qualidade do espelho é garantida por um módulo determinístico testável (`validateRuleset.ts`) separado da chamada de IA.

## Complexity Tracking

| Violação | Por que necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| VI. TDD não comprovável retroativamente | A feature foi construída antes desta spec (regularização do PR #13). Os testes do ruleset existem, passam e cobrem os 9 asserts. | Reescrever a feature em ordem RED→GREEN só para satisfazer o processo seria retrabalho puro, sem ganho de qualidade. A regularização documenta a realidade e instala a rede de segurança (spec/plan/tasks) daqui pra frente. |
| Validador determinístico além do Zod | Zod valida *forma*; o ruleset valida *qualidade de conteúdo* (clichê, antítese, tom) — coisa que schema não pega. | Confiar só no prompt deixaria "honesto" dependente do humor do LLM a cada chamada, sem verificação. |
