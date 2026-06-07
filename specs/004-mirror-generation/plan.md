# Implementation Plan: Geração do Espelho

**Branch**: `004-mirror-generation` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: `/specs/004-mirror-generation/spec.md`

**Fonte de referência (código + prompts)**: `docs/mvp/005-first-mirror.md`.

**Pré-requisito**: feature **003-capture-pipeline** mergeada (`git rebase main` antes de codar).

## Summary

Serviço de síntese do espelho com `claude-sonnet-4-6`: lê entradas do usuário, gera os quatro
blocos (força principal, skill invisível, padrão, pergunta) + `strength_themes`, valida (Zod) e
persiste em `mirror_snapshots`. Expõe `POST /api/mirror/generate` (primeira geração, marca
`onboarding_completed`) e `maybeRegenerateMirror` (limiar a cada 3 entradas) que **preenche o
stub** já chamado por `/api/capture` (003). Sem UI — a revelação progressiva fica em 006.

## Technical Context

**Language/Version**: TypeScript estrito, Next.js 15 App Router

**Primary Dependencies**: a costura de provider de IA de 003 (`getProvider()`; default Anthropic → Sonnet `claude-sonnet-4-6` no papel `synthesis`), `zod`, `@supabase/ssr` + `@supabase/supabase-js` (service_role para jobs background)

**Storage**: Supabase PostgreSQL com RLS; nova tabela `mirror_snapshots`

**Testing**: Vitest; mock do Anthropic e do Supabase; teste de limiar (REGEN_EVERY)

**Target Platform**: Next.js route handler + libs server-side (algumas fora do ciclo de request)

**Project Type**: Web app full-stack — feature **backend/serviço** (sem UI)

**Performance Goals**: primeira geração ≤ 8 s p95; regeneração em background não bloqueia captura

**Constraints**: Sonnet só aqui; saída validada por Zod antes de persistir; queries sempre por `user_id`; jobs background com `service_role` + filtro explícito; erros logados sem dados do usuário

**Scale/Scope**: 1 rota, ~5 módulos em `src/lib/ai/mirror`, 1 migration, 1 ligação no stub de 003

## Constitution Check

- **I. Security First**: ✅ auth no topo da rota; RLS via request; jobs background com `service_role` filtrando `user_id`; sem dados em log; contexto nunca cruza usuários.
- **II. TS Strict & Quality**: ✅ sem `any` (Zod infer); funções ≤ 40 linhas; sem catch vazio (regen loga e preserva snapshot).
- **III. AI-First**: ✅ Sonnet para o espelho **(default do MVP, papel `synthesis`)**; saída validada antes de persistir; wrappers só em `src/lib/ai/mirror`; contexto isolado por usuário. Usa a costura de provider de 003 (`getProvider().complete({ role: 'synthesis', ... })`) — o default `anthropic` mapeia `synthesis → claude-sonnet-4-6`. Trocar o default para provider não-Anthropic exigiria emenda à constituição.
- **IV. Server-First**: ✅ tudo server-side.
- **V/VII/VIII**: N/A (sem UI).
- **VI. TDD**: ✅ testes antes; cobertura ≥ 80%, incluindo o teste do limiar.
- **IX. i18n**: mensagens de erro como constantes pt-BR; strings de UI ficam em 006.

**Resultado**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-mirror-generation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mirror-generate-api.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/api/mirror/generate/route.ts        # POST: primeira geração + onboarding_completed
├── types/mirror.ts                          # Mirror, MirrorSection
├── lib/ai/mirror/
│   ├── generateMirror.ts                    # generateAndSaveMirror (Sonnet)
│   ├── maybeRegenerate.ts                    # maybeRegenerateMirror (limiar REGEN_EVERY=3)
│   ├── schemas.ts                            # validateMirror (Zod)
│   └── prompts/
│       └── firstMirror.ts                    # MIRROR_SYSTEM_PROMPT + buildMirrorUserPrompt
├── lib/db/
│   ├── mirror.ts                             # insertMirrorSnapshot, getLatestSnapshot, saveMirrorFeedback
│   └── supabaseAdmin.ts                      # client service_role (jobs background)  [se não existir]

supabase/migrations/
└── 00X_mirror_snapshots.sql                  # tabela + RLS + índice + coluna strength_themes

tests/
├── unit/
│   ├── mirror-schemas.test.ts
│   └── maybe-regenerate.test.ts             # limiar
└── integration/
    └── mirror-generate-route.test.ts
```

**Structure Decision**: Backend/serviço. A integração-chave é **substituir o stub
`maybeRegenerateMirror` de 003** pelo corpo real, mantendo a chamada existente em `/api/capture`.
Jobs de background usam um client `service_role` dedicado (`supabaseAdmin.ts`) que SEMPRE filtra
por `user_id` — isolado dos clients de request.

## Complexity Tracking

> Único ponto de atenção: client `service_role` para jobs fora do request. Justificado porque a
> regeneração roda em background (após a resposta ao usuário), sem cookie de sessão. Mitigação:
> filtro `user_id` explícito e obrigatório em toda query desse client; nunca exposto ao browser.
