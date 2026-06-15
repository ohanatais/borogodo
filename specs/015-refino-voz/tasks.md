---
description: "Task list — 015 Refino de Voz e Qualidade Contínua (+ mini-bio)"
---

# Tasks: Refino de Voz e Qualidade Contínua (+ mini-bio)

**Input**: Design documents from `/specs/015-refino-voz/`

**Prerequisites**: plan.md, spec.md, research.md, **e a fundação de 013 (motor, drafts, voice_profile,
golden set) e 014 (drafts acumulados com voice_feedback)**.

**Tests**: Incluídos (TDD, Princípio VI). Cobertura ≥ 80% na recalibração e no mini-bio.

**Organization**: agrupado por user story.

> **Ordem de batch**: a 015 é o **último** elo. Aplicar a migration `009` (013) antes da `010` (015).

---

## Phase 1: Setup
- [ ] T001 [SETUP] i18n `presenca.*` (sugestão de recalibrar, opção mini-bio, microcopy de
  consentimento) em `pt-BR.json` + espelho em `en.json`.

## Phase 2: Foundational (Blocking)
- [ ] T002 [FND] `supabase/migrations/010_drafts_mini_bio.sql` — `ALTER` no CHECK de `drafts.format`
  para aceitar `'mini_bio'`. Conferir que `010` é o próximo número livre após `009`.
- [ ] T003 [FND] Escrever testes do ruleset anti-clichê de bio (`__tests__/validateRuleset.test.ts`):
  clichês de bio ("apaixonado por tecnologia" etc.) disparam o novo `assert`. **Devem falhar.**
- [ ] T004 [FND] Estender `bannedTerms.ts` (clichês de bio) e `validateRuleset.ts` (novo assert) até
  T003 passar.
- [ ] T005 [FND] Ampliar o golden set (`__tests__/fixtures/` + `goldenSet.test.ts`) para cobrir os 3
  formatos (post, resumo, mini-bio) e o novo assert; manter asserções determinísticas (sem IA).

**Checkpoint**: ruleset e golden set cobrem mini-bio; migration aplicável.

## Phase 3: User Story 1 — Recalibração de voz (P1) 🎯
- [ ] T006 [US1] Escrever teste de `recalibrateVoice` (`__tests__/recalibrateVoice.test.ts`): só sugere
  com sinal acumulado; ao aplicar, funde feedback + amostras e **preserva** `samples`; sem aceite, não
  muda. **Devem falhar.**
- [ ] T007 [US1] Implementar `src/lib/ai/content/recalibrateVoice.ts` (lê `voice_feedback` de `drafts`,
  recalibra `inferred_summary`/`tone`, preserva amostras, cacheia) até T006 passar.
- [ ] T008 [US1] `POST /api/content/voice/recalibrate` (`route.ts`): auth-first; modo "sugerir" (lê
  sinal, não muda nada) e modo "aplicar" (com consentimento explícito no payload); RLS.
- [ ] T009 [US1] `VoiceRecalibratePrompt.tsx` — sugestão discreta ("vi que alguns rascunhos não soaram
  como você; quer afinar?") com aceitar/dispensar, reusando a estética dos cards existentes.
- [ ] T010 [US1] Teste de integração: acumular feedback → sugestão aparece; aceitar → `voice_profile`
  evolui (amostras intactas); recusar → inalterado.

**Checkpoint**: a voz melhora com o uso, sempre com consentimento.

## Phase 4: User Story 2 — Golden set como guardrail de CI (P1)
- [ ] T011 [US2] Garantir que o golden set roda como **gate obrigatório** no `.github/workflows/ci.yml`
  (step dedicado ou dentro de `npm test`, mas bloqueante) em PRs para `main`/`develop`.
- [ ] T012 [US2] Teste de meta-regressão: um caso de fixture propositalmente degradado (travessão /
  antítese / clichê de bio) faz o golden set **falhar** por `assert`; revertido, passa.
- [ ] T013 [US2] Documentar no `docs/` (ou no README de testes) que mudança de prompt do bloco exige
  golden set verde; sem custo de IA no CI (determinístico + fixtures).

**Checkpoint**: regressão de voz é bloqueada no merge, automaticamente.

## Phase 5: User Story 3 — Mini-bio (P2)
- [ ] T014 [US3] Escrever teste de `miniBioDraftSchema` + prompt (forma + ruleset, sem clichê de bio).
  **Deve falhar.**
- [ ] T015 [US3] `prompts/miniBio.ts` (herda disciplina anti-IA + anti-clichê de bio) e
  `miniBioDraftSchema` em `schemas.ts` até T014 passar.
- [ ] T016 [US3] Estender `generateDraft` + `generate/route.ts` para `format='mini_bio'` (reuso do
  orquestrador e da validação).
- [ ] T017 [US3] Adicionar a opção "mini-bio" no seletor de formato do `GenerateSheet` (reuso da UI da
  013); persistir com `format='mini_bio'`.
- [ ] T018 [US3] Teste: mini-bio gera 2 versões factuais sem clichê, passa no ruleset, persiste com
  `format='mini_bio'`.

**Checkpoint**: 3 formatos no mesmo motor; fundação provada de ponta a ponta.

## Phase 6: Polish & Cross-Cutting
- [ ] T019 [P] [POLISH] a11y da sugestão de recalibrar e do seletor de mini-bio (label, foco, teclado,
  48px, 375px).
- [ ] T020 [P] [POLISH] Zero string hardcoded; `en.json` espelha.
- [ ] T021 [POLISH] `/impeccable audit` (UI leve) + `web-design-guidelines`.
- [ ] T022 [POLISH] `/security-review` (voz do usuário, geração) + `/code-review high` + `/pr-review`;
  cobertura ≥ 80%; CI verde (com o golden set como gate).
- [ ] T023 [POLISH] Atualizar marcadores SPECKIT do `CLAUDE.md`; fechar o bloco de Geração de Conteúdo;
  `docs/aprendizados.md` se houver algo não-óbvio (decisão de Ohana).

---

## Dependencies & Execution Order
- **013 → 014 → 015**. Migration `009` (013) antes de `010` (015).
- Dentro da 015: Setup → Foundational (migration + ruleset + golden set) → US1 (recalibração) → US2
  (CI gate) → US3 (mini-bio) → Polish.
- US1 e US3 dependem do motor da 013; US2 depende do golden set da 013 ampliado aqui.
- `/code-review low` por fase; `/code-review high` + `/security-review` + `/pr-review` antes do PR.

## Notes
- ~23 tasks. Migration mínima (`010`). UI leve — reusa as superfícies de 013/014.
