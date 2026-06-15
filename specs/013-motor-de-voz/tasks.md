---
description: "Task list — 013 Motor de Voz + Geração"
---

# Tasks: Motor de Voz + Geração (Presença)

**Input**: Design documents from `/specs/013-motor-de-voz/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, shape.md

**Tests**: Incluídos — TDD é constitucional (Princípio VI). Testes primeiro (RED), implementação
(GREEN), refatorar (IMPROVE). Cobertura ≥ 80% no módulo `src/lib/ai/content/`.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: a user story (US1–US4) ou fundação (FND/SETUP/POLISH)

---

## Phase 1: Setup

- [ ] T001 [SETUP] Criar tipos base em `src/types/content.ts` (`Draft`, `VoiceProfile`, `DraftVariant`,
  `DraftFormat`, `SeedType`, `DraftStatus`, `VoiceFeedback`, `ContentRulesetViolation`).
- [ ] T002 [P] [SETUP] Adicionar namespace `presenca.*` em `src/messages/pt-BR.json` (geração, chips,
  copiar, "soa como você?", estados de erro) e espelhar a estrutura em `src/messages/en.json`.
- [ ] T003 [P] [SETUP] Scaffolding do módulo: criar pastas `src/lib/ai/content/`,
  `src/lib/ai/content/prompts/`, `src/lib/ai/content/__tests__/fixtures/`,
  `src/components/features/content/`, `src/app/api/content/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase. É a fundação que 014/015 também reusam.

### Migration e persistência
- [ ] T004 [FND] Escrever `supabase/migrations/009_drafts.sql`: tabela `drafts` (colunas + `CHECK` de
  enums), índice `(user_id, created_at desc)`, RLS `auth.uid() = user_id` (select/insert/update/delete
  + `with check` no insert), e coluna `profiles.voice_profile jsonb`. Conferir que `009` é o próximo
  número livre na hora.
- [ ] T005 [FND] Queries tipadas em `src/lib/db/drafts.ts`: `insertDraft`, `updateDraft`,
  `getVoiceProfile`, `upsertVoiceProfile` — todas escopadas por `user_id` (RLS), sem logar conteúdo.

### Disciplina anti-IA (TDD: testes primeiro)
- [ ] T006 [FND] Escrever testes do ruleset em `__tests__/validateRuleset.test.ts`: um caso por
  `assert` (1–9), com fixtures boas (zero violações) e ruins (violação esperada). **Devem falhar.**
- [ ] T007 [FND] Implementar `src/lib/ai/content/bannedTerms.ts` (lista centralizada anti-IA) e
  `src/lib/ai/content/validateRuleset.ts` (`validateContentRuleset`, determinístico, sem IA) até os
  testes de T006 passarem. Avaliar reuso/extração da lista compartilhada com o ruleset do espelho.
- [ ] T008 [P] [FND] Escrever testes de schema em `__tests__/schemas.test.ts` (forma válida, exatamente
  2 variantes, rejeição de malformado). **Devem falhar.**
- [ ] T009 [FND] Implementar `src/lib/ai/content/schemas.ts` (`postDraftSchema`,
  `impactSummaryDraftSchema`, `validateDraftOutput(raw, format)`) até T008 passar.

### Prompts (herança literal do espelho)
- [ ] T010 [P] [FND] `src/lib/ai/content/prompts/post.ts` — system prompt do post herdando
  integralmente a disciplina anti-IA do `MIRROR_SYSTEM_PROMPT` (sem travessão, sem antítese, métrica
  como convite, brasilidade-substância, sem jargão de LinkedIn) + builder do user prompt (seed +
  voice_profile + evidência).
- [ ] T011 [P] [FND] `src/lib/ai/content/prompts/impactSummary.ts` — idem, com as instruções próprias
  do formato resumo de impacto (factual, primeira pessoa, sem inventar número).

### Orquestrador e voz (TDD)
- [ ] T012 [FND] Escrever testes de `generateDraft` em `__tests__/generateDraft.test.ts` com **mock do
  LLM**: valida Zod, roda ruleset, regenera **uma** vez em violação, lança `GenerationFailedError` na
  2ª falha. **Devem falhar.**
- [ ] T013 [FND] Implementar `src/lib/ai/content/generateDraft.ts` (orquestrador via
  `src/lib/ai/client.ts` + `claude-sonnet-4-6`, parametrizado por `format`) até T012 passar.
- [ ] T014 [FND] Implementar `src/lib/ai/content/buildVoiceProfile.ts` (infere `inferred_summary` do
  `raw_content` das capturas; funde com `samples`; cacheia no JSONB) + teste com mock.

### Golden set (harness existencial)
- [ ] T015 [FND] Montar fixtures de 10–15 casos reais em `__tests__/fixtures/` (seed + voice_profile +
  saída mockada) cobrindo post e resumo, perfis variados (com/sem métrica, sênior/júnior).
- [ ] T016 [FND] Escrever `__tests__/goldenSet.test.ts`: cada caso passa no ruleset (zero violações) e
  tem `evidence_refs ⊆ seed`; fixtures ruins retornam a violação esperada por `assert`.

**Checkpoint**: fundação pronta — `npm run test -- src/lib/ai/content` verde; migration aplicável; as
user stories podem começar.

---

## Phase 3: User Story 1 — Post a partir de tema do espelho, na minha voz (P1) 🎯 MVP

**Goal**: gerar 2 posts ancorados em evidência de um tema, com calibração de voz híbrida.

**Independent Test**: `/espelho` → "Usar" num tema → 2 posts válidos citando evidência; colar amostra
e regerar reflete a voz.

- [ ] T017 [US1] Rota `POST /api/content/generate` em `src/app/api/content/generate/route.ts`: auth-first,
  valida payload (Zod), confere que `seedRef` (tema) é do usuário, chama `generateDraft('post')`,
  devolve 2 variantes validadas. Erros 401/400/404/422/500 conforme contrato.
- [ ] T018 [US1] Rota `PUT /api/content/voice` em `src/app/api/content/voice/route.ts`: atualiza
  `voice_profile` (samples/tone/lengthPref), dispara re-inferência, devolve o perfil. Valida ≤ 2 samples.
- [ ] T019 [P] [US1] `src/components/features/content/UsarButton.tsx` (ponto de entrada reusável) e
  integração no card de tema do espelho (`/espelho`), só quando há espelho.
- [ ] T020 [US1] `src/components/features/content/GenerateSheet.tsx` (client) — tela de geração que abre
  **com evidência carregada**: mostra ângulo, os 2 rascunhos, estado de geração (animação, não spinner).
- [ ] T021 [P] [US1] `src/components/features/content/VoiceCalibration.tsx` — colar 1–2 amostras +
  regerar; reflete `voice_profile` salvo.
- [ ] T022 [US1] Teste de integração da rota generate (mock do motor): 200 com 2 variantes válidas;
  404 para seed de outro usuário; 422 quando o motor falha no ruleset.
- [ ] T023 [US1] Teste de componente do `GenerateSheet` (Testing Library): renderiza 2 rascunhos, nunca
  estado de página em branco, estados de erro honestos.

**Checkpoint**: US1 funcional e testável de ponta a ponta (gerar post de um tema, calibrar voz).

---

## Phase 4: User Story 2 — Resumo de impacto a partir de uma entrada (P1)

**Goal**: mesmo motor, formato resumo de impacto, seed = entrada.

**Independent Test**: abrir entrada → "Usar" → "Resumo de impacto" → 2 versões factuais ancoradas.

- [ ] T024 [US2] Estender `generate/route.ts` e `GenerateSheet` para `format='impact_summary'` com
  `seedType='entry'` (reuso do orquestrador; só troca prompt/schema).
- [ ] T025 [P] [US2] Integrar `UsarButton` no item de entrada (histórico / card de entrada) com seletor
  de formato (post | resumo de impacto) quando o seed é uma entrada.
- [ ] T026 [US2] Teste de integração: resumo de impacto a partir de entrada passa Zod + ruleset; número
  ausente não é inventado (fixture sem métrica).
- [ ] T027 [US2] Atualizar golden set com casos de resumo de impacto (se não cobertos em T015).

**Checkpoint**: ambos os formatos âncora geram do mesmo motor; fundação provada para a 015 (mini-bio).

---

## Phase 5: User Story 3 — Editar, ajustar, copiar (P2)

**Goal**: refino e saída pronta pra publicar.

**Independent Test**: editar inline, aplicar chip "mais curto", copiar.

- [ ] T028 [US3] `src/components/features/content/DraftCard.tsx` — edição inline do `body` (marca
  `edited`) + botão copiar com fallback de clipboard e confirmação acessível.
- [ ] T029 [US3] `src/components/features/content/AdjustChips.tsx` — chips "mais curto" / "menos formal"
  / "tira o jargão" que chamam `generate` com `adjust` e regeram mantendo evidência.
- [ ] T030 [US3] Suportar `adjust` em `generate/route.ts` + `generateDraft` (injeta o ajuste no prompt;
  saída revalidada pelo ruleset).
- [ ] T031 [P] [US3] Testes: aplicar "tira o jargão" remove jargão e mantém evidência (ruleset verde);
  copiar coloca o texto no clipboard (mock) e marca `copied`.

**Checkpoint**: a pessoa sai com um texto pronto, editado e copiado.

---

## Phase 6: User Story 4 — Persistir + "soa como você?" (P2)

**Goal**: lifecycle do rascunho e sinal de voz para a 015.

**Independent Test**: gerar → recarregar → rascunho persistiu; "não soa" salva sem regerar.

- [ ] T032 [US4] Rota `POST /api/content/drafts` (`drafts/route.ts`): persiste o rascunho escolhido
  (status `generated`/`edited`, `seed`, `angle`, `qa`). Auth-first, Zod, RLS.
- [ ] T033 [US4] Rota `PATCH /api/content/drafts/[id]` (`drafts/[id]/route.ts`): atualiza
  `body`/`status`/`voiceFeedback`; 404 (não 403) para id de outro usuário; não regera no v1.
- [ ] T034 [US4] Ligar `DraftCard` à persistência: salvar ao copiar/editar; controle "soa como você?"
  (soa/não soa) chamando o PATCH.
- [ ] T035 [US4] Testes de integração das rotas drafts: insert escopado por usuário; PATCH respeita RLS;
  feedback salvo sem regeneração.

**Checkpoint**: todas as user stories independentes e funcionais; base de persistência pronta p/ 014.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T036 [P] [POLISH] Revisão de a11y nos componentes (`GenerateSheet`, `DraftCard`, chips, "Usar"):
  labels, foco visível, headings, toques ≥ 48px, 375px.
- [ ] T037 [P] [POLISH] Auditoria anti-IA manual: gerar post + resumo de evidência real e aplicar o
  critério "publicaria com orgulho?"; ajustar prompt se reprovar.
- [ ] T038 [P] [POLISH] Garantir zero string hardcoded (todas em `presenca.*`); `en.json` espelha.
- [ ] T039 [POLISH] Rodar `/impeccable audit` + `web-design-guidelines` (UI) e corrigir achados.
- [ ] T040 [POLISH] Rodar `/security-review` (tabela nova, dado de usuário, chamada de IA) e tratar
  CRITICAL/HIGH; conferir que nenhum `raw_content`/draft é logado e nenhum ID interno vaza.
- [ ] T041 [POLISH] `/pr-review` (6 subagentes) antes de abrir o PR; verificar cobertura ≥ 80% e CI verde.
- [ ] T042 [POLISH] Atualizar `docs/aprendizados.md` se algo não-óbvio surgir (decisão de Ohana);
  atualizar os marcadores SPECKIT do `CLAUDE.md`.

---

## Dependencies & Execution Order

- **Setup (1)** → **Foundational (2)** bloqueia tudo → **US1 (3)** e **US2 (4)** (P1) → **US3 (5)** e
  **US4 (6)** (P2) → **Polish (7)**.
- US2 depende do orquestrador de US1/fundação (reuso). US3 e US4 dependem de existir rascunho (US1/US2).
- Dentro de cada story: **testes primeiro (RED)** → modelos/serviços → rotas → UI → integração.

### Code review por fase (convenção do projeto)
- `/code-review low` ao fim de cada fase (US1, US2, US3, US4).
- `/code-review high` na fase de Polish, antes do PR.
- `/security-review` + `/pr-review` antes de abrir o PR (security gate do epic plan).

## Notes
- [P] = arquivos diferentes, sem dependência.
- Commit após cada task ou grupo lógico; parar em cada checkpoint para validar a story isolada.
- Estimativa: ~42 tasks, dentro do teto de um ciclo speckit (≈ 35–45).
