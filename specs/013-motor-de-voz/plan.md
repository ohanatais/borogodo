# Implementation Plan: Motor de Voz + Geração (Presença)

**Branch**: `013-motor-de-voz` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-motor-de-voz/spec.md`; epic plan
`docs/conteudo-plano-de-acao.md`.

## Summary

Primeiro elo do bloco de Geração de Conteúdo (verbo **Usar**). Entrega a **fundação compartilhada**
(tabela `drafts`, `voice_profile` JSONB em `profiles`, módulo `src/lib/ai/content/`, golden set) e os
**dois formatos âncora** — post de LinkedIn e resumo de impacto — gerados por `claude-sonnet-4-6` a
partir de evidência real (entrada ou tema do espelho), na voz da pessoa (calibração híbrida:
inferida do `raw_content` + 1–2 amostras), herdando integralmente a disciplina anti-IA do
`MIRROR_SYSTEM_PROMPT` e validados por um ruleset determinístico. Pontos de entrada mínimos (botão
"Usar" numa entrada e num tema do espelho); o hub `/presenca`, a listagem e o nudge são da 014.

## Technical Context

**Language/Version**: TypeScript strict (Next.js 15 App Router, React 19)

**Primary Dependencies**: Anthropic SDK (`src/lib/ai/client.ts`, `claude-sonnet-4-6`), Zod, Supabase
(`@supabase/ssr`), next-intl, shadcn/ui, Tailwind v4, Framer Motion (entrada), Lucide.

**Storage**: Supabase Postgres — nova tabela `drafts` + coluna `profiles.voice_profile` (JSONB),
ambas com RLS `auth.uid() = user_id`.

**Testing**: Vitest + Testing Library; golden set em `src/lib/ai/content/__tests__/` com fixtures.

**Target Platform**: Web app (mobile-first; tráfego majoritário mobile).

**Project Type**: Web application (Next.js full-stack, App Router).

**Performance Goals**: geração interativa (2 variantes numa chamada quando possível); `inferred_summary`
de voz **cacheado** no JSONB para não reprocessar `raw_content` a cada geração.

**Constraints**: nenhum dado de usuário logado; contexto de IA só do próprio usuário; saída validada
(Zod + ruleset) antes de exibir/persistir; toques ≥ 48px; contraste AA; zero string hardcoded.

**Scale/Scope**: ~35–45 tasks, 4 user stories, 1 migration, 1 módulo de IA novo, 2 prompts, 1 ruleset,
2–3 telas/componentes de geração, 2 pontos de entrada.

## Constitution Check

*GATE: deve passar antes da Fase 0. Re-checar após o design da Fase 1.*

| Princípio | Como esta feature cumpre |
|---|---|
| **I. Security First** | RLS `auth.uid() = user_id` em `drafts` e na leitura/escrita do `voice_profile`; auth verificada no início de toda rota; `seedRef` validado como pertencente ao usuário antes do LLM; contexto de IA só do próprio usuário; **nenhum `raw_content`/draft logado**; IDs internos não vazam. |
| **II. TS Strict & Quality** | Sem `any`; identificadores em inglês, UI em pt-BR via i18n; 1 componente por arquivo; funções < 40 linhas; erros tratados explicitamente; arquivos < 800 linhas (módulo `content/` em muitos arquivos pequenos, espelhando `mirror/`). |
| **III. AI-First** | `claude-sonnet-4-6` para geração (não Haiku); **toda saída validada (Zod) antes de persistir**; `inferred_summary` cacheado (evita chamada redundante bilhável); wrappers sob `src/lib/ai/content/`; contexto nunca cruza usuários. |
| **IV. Server-First & Perf** | Rotas e geração no servidor (route handlers); telas de geração são RSC por padrão, `"use client"` só onde há interatividade (editor inline, chips, copiar); Framer Motion só na entrada; micro-interações em CSS. |
| **V. Acessibilidade AA** | Labels acessíveis nos botões "Usar"/chips/copiar; hierarquia de headings correta; foco visível; contraste AA; toasts de cópia anunciados. |
| **VI. TDD** | Testes primeiro (RED) para ruleset, schemas, `generateDraft` (mock do LLM) e golden set; cobertura ≥ 80% no módulo; testes de comportamento, não de implementação. |
| **VII. Design Identity** | Tokens de cor (sem hex cru); Fraunces em títulos; ritmo cromático; sem anti-padrões; **`/impeccable shape` rodado antes de codar** (ver [shape.md](./shape.md)); `/impeccable audit` antes do PR. |
| **VIII. Mobile-First** | Telas de geração desenhadas a 375px primeiro; toques ≥ 48px; base unprefixed → `md:`/`lg:` só expande. |
| **IX. i18n** | Strings em `pt-BR.json` (`presenca.*`), `en.json` espelha; infra de i18n já existe (sem retrofit); chaves em inglês camelCase. |

**Veredito**: PASS. Nenhuma violação que exija Complexity Tracking. (A tabela nova `drafts` é
justificada pelo lifecycle de rascunho; `voice_profile` evita tabela extra usando JSONB — ambos
decididos no epic plan e no kickoff.)

> **Security gate**: esta feature toca dado do usuário, cria tabela nova e chama IA → `/security-review`
> obrigatório antes do PR (além do `/pr-review`), conforme o epic plan.

## Project Structure

### Documentation (this feature)

```text
specs/013-motor-de-voz/
├── spec.md
├── research.md
├── plan.md              # Este arquivo
├── data-model.md
├── quickstart.md
├── shape.md             # /impeccable shape (UX antes de codar)
├── contracts/
│   ├── content-api.md
│   └── content-output.md
└── tasks.md             # /speckit-tasks (gerado a partir deste plano)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── ai/
│   │   └── content/                  # NOVO módulo (espelha mirror/ e chat/)
│   │       ├── client usa src/lib/ai/client.ts  (sem novo provider)
│   │       ├── schemas.ts            # Zod: postDraftSchema, impactSummaryDraftSchema, validateDraftOutput
│   │       ├── generateDraft.ts      # orquestrador (Sonnet): seed + voice + evidência → 2 variantes
│   │       ├── buildVoiceProfile.ts  # infere voz do raw_content + funde amostras
│   │       ├── validateRuleset.ts    # validateContentRuleset (determinístico, sem IA)
│   │       ├── bannedTerms.ts        # lista compartilhada de termos anti-IA (ou reuso do espelho)
│   │       ├── prompts/
│   │       │   ├── post.ts           # herda MIRROR_SYSTEM_PROMPT (anti-IA)
│   │       │   └── impactSummary.ts  # herda MIRROR_SYSTEM_PROMPT (anti-IA)
│   │       └── __tests__/
│   │           ├── validateRuleset.test.ts
│   │           ├── schemas.test.ts
│   │           ├── generateDraft.test.ts   # mock do LLM
│   │           └── goldenSet.test.ts + fixtures/
│   └── db/
│       └── drafts.ts                 # queries tipadas de drafts + voice_profile (RLS)
├── types/
│   └── content.ts                    # Draft, VoiceProfile, DraftVariant, ContentRulesetViolation
├── app/
│   └── api/
│       └── content/
│           ├── generate/route.ts     # POST gerar (efêmero, validado)
│           ├── drafts/route.ts       # POST persistir
│           ├── drafts/[id]/route.ts  # PATCH editar/status/feedback
│           └── voice/route.ts        # PUT atualizar voice_profile + re-inferir
├── components/
│   └── features/
│       └── content/                  # componentes de geração (reusados por 014/015)
│           ├── GenerateSheet.tsx     # tela de geração (ângulo, 2 rascunhos, chips, "soa?")
│           ├── DraftCard.tsx         # card de rascunho (editar inline, copiar)
│           ├── AdjustChips.tsx       # "mais curto" / "menos formal" / "tira o jargão"
│           ├── VoiceCalibration.tsx  # colar 1–2 amostras
│           └── UsarButton.tsx        # ponto de entrada reusável ("Usar")
└── messages/
    ├── pt-BR.json                    # presenca.* (autoritativo)
    └── en.json                       # stub espelhando
supabase/
└── migrations/
    └── 009_drafts.sql                # drafts + profiles.voice_profile + RLS + índice
```

**Structure Decision**: Web app full-stack Next.js. O módulo de IA novo vive sob `src/lib/ai/content/`
espelhando `src/lib/ai/mirror/` (mesma separação: schemas, orquestrador, prompts, validador, testes).
Os componentes de geração ficam em `src/components/features/content/` e são desenhados para **reuso
por 014/015** (definidos no shape). A persistência usa `src/lib/db/drafts.ts` com queries tipadas e RLS.

## Phasing (resumo; detalhe em tasks.md)

1. **Setup** — i18n keys (`presenca.*`), tipos base, scaffolding do módulo.
2. **Foundational (bloqueante)** — migration `009` (`drafts` + `voice_profile` + RLS + índice);
   `src/lib/ai/content/` skeleton (schemas, ruleset, banned terms, `generateDraft` shell);
   **golden set** + fixtures. Nenhuma user story começa antes disto.
3. **US1 (P1)** — voz híbrida + geração de **post** a partir de tema do espelho + ponto de entrada
   "Usar" no tema.
4. **US2 (P1)** — geração de **resumo de impacto** a partir de entrada + ponto de entrada "Usar" na
   entrada (mesmo motor, schema/prompt próprios).
5. **US3 (P2)** — edição inline, chips de ajuste, copiar.
6. **US4 (P2)** — persistência em `drafts` + feedback "soa como você?".
7. **Polish** — a11y, anti-IA audit, i18n completo, `/impeccable audit`, `/security-review`.

## Complexity Tracking

> Sem violações de constituição que exijam justificativa. A única tabela nova (`drafts`) e a única
> coluna nova (`profiles.voice_profile`) já estão justificadas no epic plan e no kickoff (lifecycle de
> rascunho exige tabela; perfil 1:1 cabe em JSONB). Nada a registrar aqui.
