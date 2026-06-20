# Implementation Plan: Repertório — camada "Usar" por intenção

**Branch**: `017-repertorio-intencao` | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-repertorio-intencao/spec.md`

## Summary

Reorganizar a camada "Usar" (hoje `/presenca`, lista plana por formato) num **launchpad de dois
hubs por intenção** — MOSTRAR (Post, Bio) e PREPARAR (Entrevista, Review, Salário) — com a
bifurcação "pronto" vs. "conversar" nos momentos de preparação; renomear a seção para
**Repertório**; adicionar um **convite central no Painel** e uma **entrada de Bio no Espelho**.
Princípio: **reorganização de pontos de entrada e contexto de IA, não motor novo**. Os motores
(`post`, `impact_summary`, `mini_bio`, chat) já existem. **Zero migration**: o "momento" é um
ângulo sobre o motor `impact_summary` (vai como `angle` na geração) e um rótulo livre em
`drafts.qa.moment` (coluna jsonb já existente).

Descoberta-chave da exploração: a API e o motor (`/api/content/generate`, `generateDraft`) já
aceitam `angle`, mas o `GenerateSheet` **nunca o envia** — esse é o gap real de fiação. E
`theme + impact_summary` já roda ponta a ponta no motor; só a constante de UI `THEME_FORMATS` o
limita, e os cards de PREPARAR a contornam chamando `openPresenca` direto.

## Technical Context

**Language/Version**: TypeScript estrito (sem `any`), Next.js 15 (App Router, RSC por padrão)

**Primary Dependencies**: React, next-intl (i18n, pt-BR fallback), Radix Dialog, Framer Motion,
Lucide, Anthropic SDK (chat/geração já existentes)

**Storage**: Supabase (PostgreSQL + RLS). **Sem mudança de schema** — reusa colunas `drafts.angle`
(text) e `drafts.qa` (jsonb), e `profiles.voice_profile`.

**Testing**: Vitest + Testing Library. TDD RED→GREEN, cobertura ≥80%.

**Target Platform**: Web (mobile-first; desktop sidebar + mobile bottom bar)

**Project Type**: Web app (Next.js monorepo único, `src/`)

**Performance Goals**: Sem geração nova no caminho crítico além das já existentes; do Painel a um
conteúdo pronto em ≤3 cliques.

**Constraints**: Zero migration; reuso dos motores existentes; teto de 3–4 cards por hub, 2 hubs;
escopo por `user_id` reforçado por RLS (constituição I); identificadores em inglês (constituição II).

**Scale/Scope**: 3 componentes novos + 1 módulo de dados; ~10 arquivos modificados; nenhuma rota
nova (só extensão do schema de contexto do `/api/chat`).

## Constitution Check

*GATE: deve passar antes do design e ser re-checado depois.*

- **I — Privacidade e escopo por usuário**: nenhuma query nova fora do padrão; reusa `loadSeed`
  (valida seedRef como do usuário antes do LLM) e `POST /api/content/drafts` (user_id da sessão,
  RLS). `qa.moment` é rótulo livre já aceito. ✅
- **II — Identificadores em inglês**: tipos `Hub`, `PrepMoment`, `moment`, `preparacao` em inglês;
  cópia visível em pt-BR via i18n. ✅
- **III — TS estrito, sem `any`**: contexto de chat estendido com unions tipadas e zod. ✅
- **IV — TDD ≥80% + ruleset anti-IA**: cada fase tem testes RED primeiro; geração reusa
  `validateContentRuleset` intacto. ✅
- **V — Sem motor/ formato/ migration novos**: o momento é ângulo + rótulo `qa`. ✅

Sem violações. Nenhuma entrada na Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/017-repertorio-intencao/
├── plan.md              # Este arquivo
├── spec.md              # Especificação
├── research.md          # Decisões de design e achados da exploração
├── data-model.md        # Entidades e mapeamento (sem schema novo)
├── quickstart.md        # Verificação manual end-to-end
└── checklists/
    └── requirements.md  # Checklist de qualidade da spec
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── content/
│       └── intentions.ts                 # NOVO — fonte única de hubs/momentos
├── components/
│   ├── features/
│   │   ├── painel/
│   │   │   └── UsarInvite.tsx             # NOVO — convite central no Painel
│   │   ├── presenca/
│   │   │   ├── UsarLaunchpad.tsx          # NOVO — dois hubs
│   │   │   └── PrepararMomento.tsx        # NOVO — bifurcação pronto/conversar
│   │   ├── content/
│   │   │   ├── presencaEvents.ts          # +angle?/+moment? em PresencaOpenDetail
│   │   │   ├── GenerateSheet.tsx          # envia angle (gap real); passa moment
│   │   │   └── DraftCard.tsx              # grava qa.moment
│   │   ├── chat/
│   │   │   ├── ChatSheet.tsx              # contexto 'preparacao' + título
│   │   │   └── StarterPrompts.tsx         # starters por momento (client-side)
│   │   └── espelho/
│   │       └── MirrorContent.tsx          # entrada "Criar minha bio"
│   ├── layout/
│   │   └── AppShellClient.tsx             # label nav "Presença"→"Repertório"
│   └── ...
├── lib/ai/chat/
│   ├── answerCareerQuestion.ts            # ChatContext +preparacao/+moment
│   └── prompts/careerChat.ts              # enquadramento prepMoment
├── app/
│   ├── [locale]/(app)/painel/page.tsx     # monta UsarInvite (ramo populado)
│   ├── [locale]/(app)/presenca/page.tsx   # launchpad + "Meus rascunhos"; header Repertório
│   └── api/chat/route.ts                  # zod context +preparacao/+moment
└── messages/
    ├── pt-BR.json                         # chaves novas (Repertório, hubs, momentos, convite)
    └── en.json                            # stub
```

**Structure Decision**: app único Next.js (`src/`). Componentes por feature em
`src/components/features/<feature>`; dados/tipos compartilhados em `src/lib/content`; i18n em
`src/messages`. Reusa o padrão de eventos (`window` CustomEvent) já usado por
`openPresenca`/`openChatSheet` para acoplar pontos de entrada às superfícies montadas no AppShell.

## Reuso (não tocar a lógica)

`generateDraft.ts`, `loadSeed.ts`, prompts (`post.ts`/`impactSummary.ts`/`miniBio.ts`),
`validateRuleset.ts`, `PresencaHub`, `DraftListItem`, `UsarButton`, `openPresenca`/`openChatSheet`,
`POST /api/content/generate` (já aceita `angle`), `POST /api/content/drafts` (já aceita `qa`),
`GET /api/chat/starters` (inalterado).

## Decisões de design (resumo; detalhe em research.md)

1. **Momento = ângulo + rótulo, não formato/coluna.** Evita migration e prompts duplicados.
2. **Gap do `angle`**: `GenerateSheet.generate()` passa a enviar `angle` (lido de `detail.angle`);
   preservado em troca de formato/regenerar/adjust.
3. **`qa.moment`** gravado pelo `DraftCard` quando presente; **badge no histórico fica fora da v1**
   (exigiria expor `qa`, hoje fora de `DRAFT_COLUMNS`).
4. **theme+impact_summary** já roda; `THEME_FORMATS` **não** é alterado (caminho crítico usa
   `openPresenca` direto).
5. **Starters por momento** como constantes client-side em `intentions.ts` (rota de starters
   inalterada).
6. **Bio no Espelho** usa `strength_themes[0]` como seedRef (oculto se não houver temas).
7. **Descoberta pelo Painel**: `UsarInvite` no ramo populado, abaixo do `BorogodoCard`, link →
   `/presenca` (âncoras `#mostrar`/`#preparar` opcionais).
8. **Rename**: label hard-coded em `NAV_ITEMS` + chave i18n do header; rota `/presenca` intacta.

## Complexity Tracking

Sem violações de constituição. N/A.
