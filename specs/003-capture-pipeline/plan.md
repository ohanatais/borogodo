# Implementation Plan: Pipeline de Captura (Extração + Reflexo)

**Branch**: `003-capture-pipeline` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-capture-pipeline/spec.md`

**Fonte de referência (código + prompts)**: `docs/mvp/004-extraction-pipeline.md`; schema de `entries` em `docs/mvp/003-onboarding-linkedin.md`.

## Summary

Construir a espinha dorsal de dados: a tabela `entries`, os tipos compartilhados (`entry.ts`,
`capture.ts`), e o serviço de captura que, em **uma** chamada Haiku, extrai entrada(s)
estruturada(s) e gera um reflexo. Exposto via `POST /api/capture` (texto + arquivo PDF no MVP),
com `extractFromLinkedIn` para import em lote (reusado por 006) e `PATCH /api/entries/:id/enrich`
para enriquecimento sem IA. Áudio e imagem ficam como costuras (501 + stubs). Jobs assíncronos
(`triggerProactiveInsight`, `maybeRegenerateMirror`) entram como stubs no-op a serem preenchidos
por 005 e 004 respectivamente.

## Technical Context

**Language/Version**: TypeScript estrito (strict mode), Next.js 15 App Router

**Primary Dependencies**: `@anthropic-ai/sdk` (Haiku `claude-haiku-4-5`), `zod` (validação), `pdf-parse` (extração de texto de PDF), `@supabase/ssr` (server client, já no projeto via 002)

**Storage**: Supabase PostgreSQL com RLS; tabela `entries` (nova)

**Testing**: Vitest + Testing Library; mock do cliente Anthropic e do Supabase

**Target Platform**: Next.js server (route handlers) + libs server-side

**Project Type**: Web app (Next.js full-stack) — esta feature é **backend/serviço** (sem UI)

**Performance Goals**: captura de texto ≤ 3 s p95; system prompt estável p/ prompt caching

**Constraints**: uma chamada Haiku por captura; saída sempre validada por Zod antes de persistir; auth no topo de toda rota; zero dado de usuário em logs

**Scale/Scope**: ~3 rotas/handlers, ~8 módulos em `src/lib/ai/extraction` + `src/lib/pdf`, 1 migration

## Constitution Check

*GATE: avaliado antes do design e re-checado após.*

- **I. Security First**: ✅ auth no topo da rota; RLS por `user_id`; sem segredos no client; sem dados em log; validação de input antes de qualquer LLM. Sem violação.
- **II. TypeScript Strict & Code Quality**: ✅ sem `any` (saída do LLM tipada via Zod infer); funções ≤ 40 linhas (extrair helpers em `normalizeInput`, `buildFormData`); arquivos ≤ 800; sem catch vazio (jobs logam erro).
- **III. AI-First**: ✅ Haiku para extração/reflexo; saída validada (Zod) antes de persistir; wrappers só em `src/lib/ai/`; prompt caching via system estável; contexto nunca cruza usuários.
- **IV. Server-First & Performance**: ✅ tudo server-side; sem JS de cliente nesta feature.
- **V. Accessibility**: N/A (sem UI nesta feature).
- **VI. TDD**: ✅ testes antes da implementação; cobertura ≥ 80%; alvo = comportamento.
- **VII. Design Identity**: N/A (sem UI). Microcopy em pt-BR via constantes (a UI consome em 005).
- **VIII. Mobile-First**: N/A (sem UI).
- **IX. i18n**: mensagens de erro retornadas pela API ficam como constantes pt-BR; quando exibidas, a UI (005/006) as mapeia para chaves next-intl. Nenhuma string de UI é renderizada aqui.

**Resultado**: PASS. Sem violações a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-capture-pipeline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── capture-api.md
│   └── enrich-api.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       ├── capture/route.ts                  # POST /api/capture (texto + arquivo; 501 p/ audio/image)
│       └── entries/[id]/enrich/route.ts      # PATCH enrich (sem IA)
├── types/
│   ├── entry.ts                              # EntrySource, ExtractedEntry, Entry
│   └── capture.ts                            # CaptureInput, Reflection*, CaptureContext, CaptureResult
├── lib/
│   ├── ai/
│   │   ├── client.ts                         # instância Anthropic compartilhada
│   │   ├── transcribe.ts                     # STUB documentado (áudio futuro)
│   │   └── extraction/
│   │       ├── captureAndReflect.ts          # chamada Haiku (extração + reflexo)
│   │       ├── extractEntries.ts             # base de extração pura
│   │       ├── extractFromLinkedIn.ts        # wrapper LinkedIn (usado por 006)
│   │       ├── context.ts                    # buildCaptureContext
│   │       ├── schemas.ts                    # Zod: validateCaptureResult / validateEntries
│   │       ├── jobs.ts                        # triggerProactiveInsight / maybeRegenerateMirror (STUBS)
│   │       └── prompts/
│   │           ├── capture.ts                # CAPTURE_SYSTEM_PROMPT + buildCaptureUserPrompt
│   │           └── linkedin.ts               # LINKEDIN_SYSTEM_PROMPT + buildLinkedInUserPrompt
│   ├── pdf/
│   │   └── extractText.ts                     # pdf-parse wrapper
│   └── db/
│       └── entries.ts                         # saveEntries, getRecentEntries, enrichEntryField
└── lib/log.ts                                 # logger simples (sem dados de usuário)  [se ainda não existir]

supabase/migrations/
└── 00X_entries.sql                            # tabela entries + RLS + índice

tests/
├── unit/
│   ├── schemas.test.ts                        # validação Zod (US1/US2)
│   ├── context.test.ts                        # buildCaptureContext
│   └── prompts.test.ts                        # montagem do prompt
└── integration/
    ├── capture-route.test.ts                  # POST /api/capture (US1)
    ├── enrich-route.test.ts                   # PATCH enrich + RLS (US3)
    └── extract-linkedin.test.ts               # extractFromLinkedIn (US2)
```

**Structure Decision**: Web app full-stack Next.js. Esta feature entrega apenas backend/serviço
(route handlers + libs + migration), sem componentes de UI. Toda lógica de IA vive em
`src/lib/ai/` (Princípio III). A tabela `entries` e os tipos são propositalmente criados aqui
para serem reusados pelas features 004/005/006.

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.
