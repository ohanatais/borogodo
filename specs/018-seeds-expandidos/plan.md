# Implementation Plan: Seeds Expandidos de Post

**Branch**: `018-seeds-expandidos` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification de Seeds Expandidos — ângulos de estudo e opinião com lastro.

## Summary

A 018 amplia o motor de geração de post (013/015) com dois novos ângulos: **estudo/aprendizado** (US1, P1) e **opinião/tese com lastro** (US2, P2). Sem migration (o ângulo vive como `angle_kind` no `drafts.qa jsonb` já existente). O guardrail central da feature é a disciplina anti-opinião-vazia (US3, P1 transversal): novos termos banidos em `bannedTerms.ts` (assert 11), golden set com fixtures dos dois ângulos como gate de CI.

Todos os pontos de extensão já existem: `generateDraft` → `validateContentRuleset` → `bannedTerms` → prompts `post.ts`/`discipline.ts`. A UI estende `GenerateSheet` com um passo de seleção de ângulo antes da geração.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15 (App Router)

**Primary Dependencies**: Anthropic SDK (`claude-sonnet-4-6`), Supabase, Zod, next-intl, Radix UI, Tailwind CSS

**Storage**: `drafts.qa jsonb` (migration 009, já existe) — absorve `angle_kind`, `thesis`, `lastro_captured` sem migration

**Testing**: Vitest + Testing Library; golden set como gate de CI (padrão 015)

**Target Platform**: Web (Next.js SSR + client components mínimos)

**Performance Goals**: Latência de geração ≤ geração atual (mesma chamada, prompt ligeiramente maior)

**Constraints**: Sem migration; reusa orchestrador `generateDraft` (sem caminho paralelo); `evidence_refs` não-vazio é pré-condição de exibição de opinião

**Scale/Scope**: Extensão de funcionalidade existente; ~6–8 arquivos novos/modificados, 2–3 componentes novos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Security First | ✅ | `lastroText` validado e sanitizado antes do LLM; `seedRef` validado como do usuário; RLS de `drafts` preservada; contexto da IA nunca inclui dados de outro usuário |
| II. TypeScript Strict | ✅ | Novo tipo `AngleKind`; `ContentPromptInput` estendido com campos opcionais tipados; zero `any` |
| III. AI-First Architecture | ✅ | Reusa `claude-sonnet-4-6` via `generateDraft` existente; nenhum wrapper novo |
| IV. Server-First | ✅ | `GenerateSheet` já é `"use client"` (interatividade obrigatória); a lógica de evidência fica no servidor |
| V. Accessibility / WCAG AA | ✅ | Chips de ângulo com `role="group"` e `aria-label`; textarea do thesis com label associado; touch target ≥ 48px |
| VI. TDD | ✅ | Testes antes da implementação; golden set como gate de CI |
| VII. Design Identity | ✅ | Chips reusam padrão visual do seletor de formato atual; sem estilos novos fora do token system |
| VIII. Mobile-First | ✅ | Passo de seleção de ângulo no mesmo sheet (sem modal extra); Tailwind mobile-first |
| IX. i18n | ✅ | Zero string hardcoded; todas as chaves em `pt-BR.json` + stub `en.json` |

**Violações**: nenhuma.

## Project Structure

### Documentation (this feature)

```text
specs/018-seeds-expandidos/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0 (abaixo)
├── data-model.md        ← Phase 1 (abaixo)
├── contracts/
│   └── generate-api.md  ← Phase 1 (abaixo)
├── quickstart.md        ← Phase 1 (abaixo)
└── tasks.md             ← Phase 2 (/speckit-tasks — ainda não criado)
```

### Source Code (arquivos tocados pela 018)

```text
src/
  types/
    content.ts                         ← add AngleKind = 'study' | 'opinion'
  lib/ai/content/
    bannedTerms.ts                     ← add EMPTY_OPINION_TERMS (assert 11)
    validateRuleset.ts                 ← add assert 11
    generateDraft.ts                   ← pass angleKind/thesis/lastroText; opinion post-gen check
    prompts/
      discipline.ts                    ← extend ContentPromptInput; add buildAngleBlock()
      post.ts                          ← incorporate buildAngleBlock() em buildPostUserPrompt
    __tests__/
      validateRuleset.test.ts          ← assert 11 unit tests
      generateDraft.test.ts            ← study + opinion + guardrail tests
      fixtures/
        goldenSet.ts                   ← add study + opinion goodCases; assert 11 badCases
      goldenSet.test.ts                ← add assert 11 test cases
  app/api/content/generate/
    route.ts                           ← extend Zod schema; opinion pre-check; inject lastroText
    __tests__/route.test.ts            ← test opinion_needs_lastro, lastroText injection
  components/features/content/
    GenerateSheet.tsx                  ← angle-select state; thesis/lastro inputs; capture offer
    AngleSelector.tsx                  ← novo: chips relato/estudo/opinião
    OpinionPanel.tsx                   ← novo: thesis input + lastro selector
    CaptureOffer.tsx                   ← novo: CTA para salvar vivência como entrada
    __tests__/
      AngleSelector.test.tsx           ← novo
      OpinionPanel.test.tsx            ← novo
      GenerateSheet.test.tsx           ← extensão do existente
  messages/
    pt-BR.json                         ← add presenca.angles.*, presenca.opinion.*, presenca.captureOffer.*
    en.json                            ← stub espelhado
```

## Complexity Tracking

Nenhuma violação da constituição exige justificativa.

---

## Phase 0: Research & Decisions

> **Resultado do audit do kickoff (2026-06-15)**: zero NEEDS CLARIFICATION. Todas as decisões técnicas foram tomadas na spec/clarify. Este documento as registra com a justificativa.

### research.md

**Decisão 1 — Modelagem do ângulo**

- **Decision**: `angle_kind: 'study' | 'opinion'` no `drafts.qa jsonb` existente; `seed_type` segue sendo a fonte de evidência (entry/theme/project)
- **Rationale**: sem migration (coordination cost zero); modelo mental único ("um post, um ângulo"); o `qa` já aceita chaves arbitrárias (schema `z.record(z.string(), z.unknown())` na rota de drafts)
- **Alternatives considered**: novo `seed_type` (`'study'`, `'opinion'`) — descartado porque misturaria fonte de evidência com intenção de post; nova coluna `angle_kind` com migration — descartado por coordination cost desnecessário com branches paralelas

**Decisão 2 — Guardrail de opinião-sem-lastro (dupla camada)**

- **Decision**: 
  1. **Route pre-check** (`/api/content/generate`): se `angleKind === 'opinion'` E `evidence` de `loadSeedEvidence` é vazia E `lastroText` é null → retorna `400 { error: 'opinion_needs_lastro' }` antes de chamar o LLM
  2. **Post-generation check** (`generateDraft`): após as tentativas, se `angleKind === 'opinion'` E TODOS os variants têm `evidence_refs.length === 0` → trata como `GenerationFailedError`
- **Rationale**: pré-check é o gate eficiente (não chama LLM desnecessariamente); pós-check é a rede de segurança (o modelo às vezes ignora a âncora mesmo com evidência presente)
- **Alternatives considered**: guardrail só no prompt — insuficiente (LLM pode ignorar); guardrail só no pré-check — cobre "sem lastro" mas não "LLM não ancou"

**Decisão 3 — Injeção de `lastroText` como evidência**

- **Decision**: na rota de generate, quando `lastroText` está presente, injeta como `{ label: 'Lastro', text: lastroText }` **antes** dos itens de `evidence` retornados por `loadSeedEvidence`; o LLM pode citar `[Lastro]` em `evidence_refs`
- **Rationale**: reusa o pipeline de evidência existente sem alterar `loadSeedEvidence`; o `label: 'Lastro'` é semântico e o pré-check de `evidence_refs` cobre qualquer rótulo
- **Alternatives considered**: campo separado no prompt para "vivência" — cria bifurcação desnecessária no fluxo de evidência

**Decisão 4 — UX do seletor de ângulo em `GenerateSheet`**

- **Decision**: adicionar estado `'angle-select'` no início do fluxo do sheet (antes de `'generating'`). Ao abrir, o sheet **não gera imediatamente** — mostra primeiro os chips de ângulo (relato / estudo / opinião). Para "opinião", expande um painel com thesis input e lastro selector. Usuário clica "Gerar" → transition para `'generating'`
- **Rationale**: os ângulos "estudo" e "opinião" precisam de input adicional antes da chamada; não é possível gerar imediatamente como no fluxo original. A mudança é **opt-in**: para "relato" (o ângulo padrão, sem input extra), o usuário clica "Gerar" direto, sem atrito adicional
- **Alternatives considered**: pré-seleção de ângulo antes de abrir o sheet (no trigger "Usar") — toca em mais componentes e quebra o fluxo de navegação; geração imediata com ângulo "relato" padrão + botão de mudar depois — confunde porque trocar o ângulo regenera tudo

**Decisão 5 — Capture offer (sinergia 016)**

- **Decision**: após geração bem-sucedida com `lastroText`, exibe `CaptureOffer` (componente novo) como card dentro do `GenerateSheet`. Aceitar → `POST /api/capture` com `content = lastroText` (reusa pipeline existente). Recusar → dismisses o card, não bloqueia nada
- **Rationale**: reusa `/api/capture` sem modificação (o pipeline de extração já lida com texto curto); o `CaptureOffer` é um componente independente, não acopla ao `DraftCard`

**Decisão 6 — Assert 11 (termos de opinião-vazia)**

- **Decision**: assert 11 no `validateContentRuleset` detecta: `"hot take"`, `"impopular mas"`, `"ninguém fala sobre isso"`. Novo array `EMPTY_OPINION_TERMS` em `bannedTerms.ts`. Não relaxa nenhum dos 10 asserts existentes
- **Rationale**: os 3 termos são os padrões de opinião-vazia mais comuns no mercado (per discovery §5); o assert é simples (string match) e alta precisão/baixo falso-positivo; a lista pode crescer por PR futuro sem tocar na lógica de validação

---

## Phase 1: Design & Contracts

### data-model.md

#### Entidade: `drafts.qa` (extensão, sem migration)

```
Coluna existente: qa jsonb DEFAULT '{}'
Migration: nenhuma

Novos campos opcionais no payload qa quando salvar rascunho de ângulo:
{
  "angle_kind": "study" | "opinion",   -- presente apenas quando != relato
  "thesis": "string max 500",          -- apenas quando angle_kind = 'opinion'
  "lastro_captured": boolean           -- true quando a vivência foi salva como entrada
}
```

**Constraint conceptual** (não enforced no DB — enforced no motor):
- `angle_kind = 'opinion'` → pelo menos um variant com `evidence_refs` não-vazio (post-gen check)
- `thesis` presente apenas quando `angle_kind = 'opinion'`

#### Tipo TypeScript novo

```typescript
// src/types/content.ts
export type AngleKind = 'study' | 'opinion'
```

#### Extensão de `ContentPromptInput` (discipline.ts)

```typescript
export interface ContentPromptInput {
  seedSummary: string
  evidence: EvidenceItem[]
  voiceProfile: VoiceProfile | null
  angle?: string | null
  adjust?: AdjustKind | null
  // Novos (018):
  angleKind?: AngleKind | null
  thesis?: string | null  // só para opinion; texto da tese de 1 linha
}
```

Nota: `lastroText` **não entra** em `ContentPromptInput` — ele é injetado como `EvidenceItem` **antes** de chegar ao `generateDraft`, na rota.

#### `GenerateDraftInput` (generateDraft.ts)

```typescript
export interface GenerateDraftInput extends ContentPromptInput {
  format: DraftFormat
}
```

A interface `ContentPromptInput` estendida já carrega `angleKind` e `thesis`.

---

### contracts/generate-api.md

#### `POST /api/content/generate`

**Novos campos opcionais no request body**:

```json
{
  "format": "post | impact_summary | mini_bio",
  "seedType": "entry | theme | project",
  "seedRef": "string (min 1)",
  "angle": "string max 200 (opcional)",
  "adjust": "'mais_curto' | 'menos_formal' | 'tira_jargao' (opcional)",
  // NEW 018:
  "angleKind": "'study' | 'opinion' (opcional, default = relato quando ausente)",
  "thesis": "string max 500 (opcional; obrigatório quando angleKind = 'opinion')",
  "lastroText": "string max 2000 (opcional; vivência dita na hora para opinião)"
}
```

**Novo código de erro**:

| Código | Status | Quando |
|--------|--------|--------|
| `opinion_needs_lastro` | 400 | `angleKind = 'opinion'` + `evidence` vazia + `lastroText` ausente |

**Comportamento invariante** (sem alteração):

```
200 { variants: [{ angle, body, evidenceRefs }] }
422 generation_failed  (incluindo post-gen check de opinion sem anchor)
404 seed_not_found
401 unauthorized
400 invalid_request
500 internal_error
```

**Fluxo de `lastroText`** (server-side, invisível ao cliente):
1. Rota chama `loadSeedEvidence` → obtém `evidence` do banco
2. Se `lastroText` presente: prepend `{ label: 'Lastro', text: lastroText }` ao array `evidence`
3. Passa `evidence` enriquecida (+ `angleKind`, `thesis`) para `generateDraft`
4. `generateDraft` monta o user prompt via `buildPostUserPrompt` com `buildAngleBlock`

---

### quickstart.md

#### Pré-requisitos

1. Worktree `borogodo-018` rodando (`npm run dev` na porta 3001 ou a porta livre do sistema)
2. Conta QA com ao menos 2 entradas cadastradas (ver `borogodo-qa-test-user.md` em memory)
3. Vitest para o golden set: `npm run test`

#### Cenário US3 — Assert 11 (CI gate, sem UI)

```bash
npm run test src/lib/ai/content/__tests__/validateRuleset.test.ts
```

Esperado: os 3 novos badCases (`hot take`, `impopular mas`, `ninguém fala sobre isso`) falham no assert 11. Asserts 1–10 passam inalterados.

```bash
npm run test src/lib/ai/content/__tests__/goldenSet.test.ts
```

Esperado: goodCases de estudo e opinião passam; badCase de opinião-sem-lastro (evidence_refs vazia) detectado.

#### Cenário US1 — Ângulo de estudo (manual)

1. Entrar no `/presenca`, clicar "Gerar conteúdo"
2. Escolher uma entrada → clicar "Usar"
3. No `GenerateSheet`: selecionar ângulo **"Estudo"** → clicar "Gerar"
4. Verificar: 2 variantes; `evidence_refs` não-vazio em ambas; sem fato inventado além da evidência; ruleset passa (sem jargão)

#### Cenário US2a — Opinião com entrada registrada (manual)

1. No `GenerateSheet`: selecionar ângulo **"Opinião"**
2. Digitar tese: `"Times pequenos entregam mais porque a comunicação tem custo menor"`
3. Lastro: marcar uma entrada registrada (ex: E1)
4. Clicar "Gerar"
5. Verificar: 2 variantes; ao menos 1 `evidence_refs` não-vazio; a tese aparece como perspectiva, não como fato sobre ela

#### Cenário US2b — Opinião com vivência dita na hora (manual)

1. No `GenerateSheet`: ângulo "Opinião" → thesis → seção "Lastro" → opção "Escrever agora"
2. Digitar vivência: `"No meu último projeto reduzimos o time de 8 para 4 pessoas e a velocidade dobrou"`
3. Clicar "Gerar"
4. Verificar: 2 variantes ancoradas na vivência; `CaptureOffer` aparece abaixo dos cards
5. Aceitar o convite → entrada criada → verificar no histórico

#### Cenário US2c — Opinião sem lastro (manual)

1. No `GenerateSheet`: ângulo "Opinião" → thesis → NÃO selecionar entrada, NÃO digitar vivência → "Gerar"
2. Verificar: mensagem honesta de erro (`opinion_needs_lastro`), nenhum post gerado

#### Cenário US2d — Detect jargão de opinião-vazia (CI gate)

```bash
npm run test src/lib/ai/content/__tests__/goldenSet.test.ts -- --reporter=verbose
```

Esperado: badCase `"hot take"` dispara assert 11; goodCases de opinião passam.
