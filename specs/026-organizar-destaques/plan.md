# Implementation Plan: Organizar + Destaques

**Branch**: `026-organizar-destaques` | **Date**: 2026-07-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-organizar-destaques/spec.md`

## Summary

Introduzir uma etapa de estruturação por IA opcional ("Organizar") sobre registros já salvos pelo
drawer (025) — manual (botão) ou assíncrona (fire-and-forget disparado pelo salvar) — que infere
métrica/impacto/tags/título por **destaque** (`claude-haiku-4-5`) e, quando não resolvidos
manualmente, empresa/contexto e período no nível da **fonte**. Contexto (empresa/projeto pessoal)
passa a ter um mecanismo determinístico e de custo zero — seletor de pílulas — em vez de depender
só de inferência de IA, por decisão explícita da Ohana (risco de misturar contexto em usos futuros
de alto risco: currículo, prep de entrevista). Um registro é uma FONTE que passa a agrupar um ou
mais DESTAQUES (nova tabela `entry_highlights`); a tela Registros é reestruturada para 1 card por
fonte (miniatura real, selo de contagem, timeline por mês, grade-faísca sem streak).

**Confirmação da Assumption da spec ("provavelmente sem migration")**: há sim **uma migration
nova** (`016_entry_highlights.sql`) — mínima, estritamente aditiva (1 tabela + 3 colunas
nullable/com default em `entries`), decidida em `research.md` §1-3 depois de avaliar a alternativa
JSONB e rejeitá-la (destaques precisam de edição/remoção independente por linha, não read-modify-
write de um blob).

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15/16 (App Router, React Server
Components por padrão)

**Primary Dependencies**: `@supabase/supabase-js` (client, já em uso), `@anthropic-ai/sdk`
(wrapper existente em `src/lib/ai/client.ts`), Zod (validação do output de IA — schema novo
`organizeResultSchema`), `next-intl` (i18n), Lucide React (ícones), Framer Motion (só se a
expansão/colapso de cartões de destaque precisar de uma transição que CSS não resolve — decisão
final cabe ao `/impeccable shape`). Nenhuma dependência nova de pacote.

**Storage**: Supabase PostgreSQL — tabela `entries` (estendida com 3 colunas aditivas) + tabela
nova `entry_highlights` (RLS própria, FK `entries`). **Uma migration nova** (`016`), ver Summary.

**Testing**: Vitest + Testing Library (unit + integration), TDD conforme constituição (Princípio
VI) — mínimo 80% de cobertura nas áreas novas (schema Zod, `organizeEntry`, rotas novas, rollup de
tags, derivação de `organizationStatus`/`contextStatus`).

**Target Platform**: Web — navegadores desktop e mobile (mesmo alcance da 025).

**Project Type**: Aplicação web única (Next.js App Router) — sem separação frontend/backend.

**Performance Goals**: organização manual responde em <15s (SC-001); disparo assíncrono não
bloqueia o salvamento (fire-and-forget, reusa `fireAndForget()` já existente — 0ms adicional
percebido no salvar); feed reestruturado sem regressão perceptível de carregamento frente à 025
(SC-005) — o rollup de `entries.tags` evita reescrever a paginação/filtro do feed para juntar
`entry_highlights` a cada leitura.

**Constraints**: `claude-haiku-4-5` mandatório para a extração (constituição III); inferência de
empresa/período MUST se basear só em sinal textual explícito, nunca em associação estatística
entre registros (FR-006); nenhum gate de uso em geração de alto risco é implementado aqui (fora de
escopo, ver Assumptions da spec); não pode reabrir escopo já fechado da 025 (drawer, anexos,
navegação, dark mode).

**Scale/Scope**: uso pessoal/dogfooding (Ohana + early users) — mesma característica de escala da
025; não é um caminho de alto volume, prioriza corretude sobre throughput.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Notas |
|---|---|---|
| I. Security First | ✅ Pass | `entry_highlights` replica o padrão RLS de `entries` (`auth.uid() = user_id`, denormalizado); toda rota nova (`organize`, `highlights`) autentica antes de qualquer lógica e filtra por `user_id`, como as rotas existentes de `entries`. |
| II. TypeScript Strict & Code Quality | ✅ Pass (orienta breakdown) | Prompt novo (`organize.ts`), schema novo (`organizeResultSchema`), função de aplicação (`organizeEntry`) e rotas novas ficam em arquivos próprios (<800 linhas, funções <40 linhas) — mesmo padrão de `src/lib/ai/extraction/`. |
| III. AI-First Architecture | ✅ Pass | `claude-haiku-4-5` mandatório e reusado (mesma family da extração legada); output validado por Zod antes de persistir; contexto de IA nunca inclui dado de outro usuário (query sempre por `user_id`). |
| IV. Server-First & Performance | ✅ Pass | Botão "Organizar" e cartões de destaque expansíveis são interatividade client-side justificada (`"use client"`); leitura do feed continua Server Component (`getFeedData`). |
| V. Accessibility & WCAG AA | ✅ Pass (orienta tasks) | Cartões colapsáveis de destaque precisam de `aria-expanded`/foco visível; pílulas de contexto precisam de label acessível e alvo de toque ≥48px (Princípio VIII). |
| VI. Test-First Development | ✅ Pass (orienta tasks) | TDD para: schema Zod, `organizeEntry` (incluindo regra "só preenche vazios"), rollup de tags, guarda de concorrência, rotas novas, derivação de `organizationStatus`/`contextStatus`, `getFeedData` estendido. |
| VII. Borogodó Design Identity | ⚠️ Requer `/impeccable shape` | Reestruturação de Registros (1 card por fonte, cartões de destaque, pílulas de contexto) é superfície de UI nova — obrigatório rodar `/impeccable shape` antes de implementar (constituição VII), fora do escopo deste plano técnico. |
| VIII. Mobile-First Architecture | ✅ Pass (orienta tasks) | Pílulas de contexto e cartões de destaque desenhados mobile-first; scroll/busca dentro do seletor de pílulas (edge case da spec) é decisão de interação do `/impeccable shape`. |
| IX. i18n Architecture | ✅ Pass (orienta tasks) | Todo texto novo (estados "organizando…", selo "+N destaques", pílulas, sinalização de contexto) via `next-intl`; namespace a definir nas tasks (extensão de `registros`/`capture` vs. namespace novo `organize`). |

Nenhuma violação bloqueante. A única nota (⚠️) é um lembrete de processo (passo 5 do fluxo
obrigatório, `/impeccable shape`), não uma exceção de arquitetura — não entra em Complexity
Tracking.

**Re-checagem pós-Fase 1** (após `research.md`/`data-model.md`/`contracts/`): gates continuam
passando. A decisão de schema (`research.md` §1) foi validada contra o Princípio I (RLS simétrica
a `entries`) e o Princípio II (tabela dedicada em vez de JSONB, mais fácil de manter <800
linhas/arquivo e função <40 linhas por operação CRUD isolada). Nenhuma nova violação introduzida.

## Project Structure

### Documentation (this feature)

```text
specs/026-organizar-destaques/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (schema, mecanismo assíncrono, prompt)
├── data-model.md         # Fase 1 — entidades, colunas novas, RLS, ciclo de vida
├── quickstart.md         # Fase 1 — roteiro de validação manual por user story
├── contracts/
│   ├── organize.md       # POST /organize, PATCH/POST/DELETE highlights, extensão de PATCH entry
│   └── feed.md           # Extensão de getFeedData/FeedItem para o card de fonte
└── tasks.md              # Fase 2 (/speckit-tasks) — não gerado por este comando
```

### Source Code (repository root)

Aplicação web única (Next.js App Router) — sem separação frontend/backend, mesma estrutura da
025. Caminhos concretos que esta feature toca ou cria:

```text
supabase/migrations/
└── 016_entry_highlights.sql                    # NOVO — tabela + colunas aditivas em entries

src/types/
└── entry.ts                                     # estendido — EntryHighlight, SourceStatus, ContextStatus

src/lib/ai/extraction/
├── prompts/organize.ts                          # NOVO — prompt de "Organizar" (Haiku)
├── schemas.ts                                    # estendido — organizeResultSchema
└── jobs.ts                                       # estendido — triggerOrganizeEntry (fireAndForget já existe)

src/lib/entries/                                  # NOVO diretório (paralelo a src/lib/capture/)
├── organizeEntry.ts                              # chamada de IA + persistência + guarda de concorrência
├── highlightVocabulary.ts                        # vocabulário de tags (DISTINCT unnest)
└── contextVocabulary.ts                          # vocabulário de contextos (DISTINCT company)

src/app/api/entries/[id]/
├── organize/route.ts                             # NOVO — POST /organize
├── route.ts                                       # estendido — aceita is_personal_project no PATCH
└── highlights/
    ├── route.ts                                   # NOVO — POST (criar destaque em branco)
    └── [highlightId]/route.ts                     # NOVO — PATCH/DELETE de um destaque

src/app/api/capture/route.ts                       # estendido — dispatchAsyncJobs chama triggerOrganizeEntry;
                                                    # handleDepositoCapture passa a chamar dispatchAsyncJobs

src/lib/feed/
├── getFeedData.ts                                 # estendido — join/rollup com entry_highlights
└── types.ts                                        # estendido — FeedItem.highlights/organizationStatus/contextStatus

src/components/features/feed/                      # reestruturação de Registros (FR-025/026/027/028/029)
├── FeedPage.tsx                                    # existente — card por fonte em vez de por entrada
├── SourceCard.tsx                                  # NOVO — card de fonte (miniatura, selo, sinalização de contexto)
├── HighlightCard.tsx                               # NOVO — cartão de destaque (colapsável, editável)
└── ContextPillPicker.tsx                           # NOVO — seletor de pílulas de contexto (Story 2)

src/components/features/capture/
└── SavedPanel.tsx                                  # estendido — bloco "Organizando o resto em segundo plano"
```

**Structure Decision**: aplicação web única, sem novo projeto/pacote. Novo diretório
`src/lib/entries/` (paralelo a `src/lib/capture/` e `src/lib/feed/`) concentra a lógica de
domínio de "organizar" e os dois vocabulários — mantém `src/lib/ai/extraction/` focado em
prompts/schemas/chamadas de IA (padrão já existente), sem misturar lógica de persistência/regras
de negócio ali.

## Complexity Tracking

Nenhuma violação de constituição a justificar — tabela omitida (nenhuma linha aplicável).
