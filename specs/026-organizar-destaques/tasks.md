# Tasks: Organizar + Destaques

**Input**: Design documents de `/specs/026-organizar-destaques/` (spec.md, plan.md, research.md,
data-model.md, contracts/organize.md, contracts/feed.md, quickstart.md)

**Tests**: TDD é mandatório pela constituição do projeto (Princípio VI) — testes vêm ANTES da
implementação e devem falhar primeiro.

**Organization**: Tarefas agrupadas por user story (prioridades da spec.md — US1/US2/US3/US4/US6
são P1, US5/US7 são P2), na ordem de prioridade.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1-US7, mapeando pra spec.md
- Caminhos de arquivo exatos em cada descrição

---

## Phase 1: Setup

**Purpose**: chaves i18n e scaffolding compartilhado antes de qualquer código de feature — sem
dependência de pacote nova (ver plan.md, Technical Context)

- [x] T001 [P] Criar/estender namespace i18n `registro` (ou `organize`, decidir no `/impeccable
      shape`) em `src/messages/pt-BR.json` e `src/messages/en.json` (stub) com chaves vazias
      para: botão "Organizar", estado "organizando…", selo "+N destaques", "+ adicionar
      destaque", pílulas de contexto ("Projeto pessoal", "Outro"), sinalização "contexto não
      identificado"
- [x] T002 [P] Confirmar em ambiente de dev que `ANTHROPIC_API_KEY`/config de `claude-haiku-4-5`
      já usados pela extração legada (`src/lib/ai/client.ts`) cobrem o novo prompt sem
      configuração adicional

**Checkpoint**: chaves i18n existem (mesmo vazias) — nenhum componente novo quebra por chave
ausente

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema novo + tipos + infraestrutura de IA que TODAS as user stories dependem

**⚠️ CRITICAL**: nenhuma user story pode ser implementada antes desta fase

- [x] T003 Criar migration `supabase/migrations/016_entry_highlights.sql` — tabela
      `entry_highlights` (FK `entries`, RLS própria por comando) + colunas aditivas em `entries`
      (`organized_at`, `organizing_started_at`, `is_personal_project`) + índices
      `(entry_id, position)` e `(user_id)`, conforme `data-model.md`
- [ ] T004 [P] Aplicar migration `016` no ambiente de dev local (`supabase db reset` ou
      `migration up`) e confirmar RLS via teste manual (usuário A não lê destaque de usuário B) —
      **BLOQUEADO**: a MCP Supabase `apply_migration` foi negada pelo classificador automático de
      segurança do ambiente ("Protected-Scope IaC Apply" — não há como o agente confirmar de forma
      verificável que `tsxvlxszlynwmmlskugg`/"borogodo-dev" é o projeto de dev autorizado, mesmo
      batendo com a URL do `.env.local`). Requer a Ohana rodar manualmente (ela pode confirmar o
      projeto) ou conceder a permissão explicitamente. Arquivo da migration pronto e revisado em
      `supabase/migrations/016_entry_highlights.sql`.
- [x] T005 [P] Estender `src/types/entry.ts` com `EntryHighlight`, `SourceOrganizationStatus`
      ('not_organized' | 'organizing' | 'organized'), `ContextStatus` ('unresolved' | 'company' |
      'personal_project') — ver `data-model.md`
- [x] T006 [P] Teste unitário para `organizeResultSchema` (Zod) em
      `src/lib/ai/extraction/__tests__/schemas.test.ts` — valida shape `{ highlights: [{title,
      metric, impact, tags}], company?, entry_date? }`, rejeita highlight sem `title`/`tags`
      ausentes tratados como opcionais, tolera `tags` vazio — DEVE falhar antes de T007
- [x] T007 Implementar `organizeResultSchema` em `src/lib/ai/extraction/schemas.ts` +
      `validateOrganizeResult(raw): { highlights: OrganizeHighlight[]; company: string | null;
      entry_date: string | null }`
- [x] T008 [P] Criar `CAPTURE_ORGANIZE_SYSTEM_PROMPT` em
      `src/lib/ai/extraction/prompts/organize.ts` — instruções: múltiplos destaques por fonte
      (FR-014), título substantivo-primeiro/outcome-first com número quando presente (FR-019),
      anti-nominalização vaga (FR-019/US5), tags reaproveitando vocabulário existente
      (FR-022/FR-023), nenhuma tag adjetivo genérico (FR-024), empresa/período só por sinal
      textual explícito e nunca por associação estatística (FR-006), pré-seleção de empresa
      central quando o texto menciona mais de uma (FR-007) — reusa o anti-padrão de formatação já
      documentado em `capture.ts` (sem travessão/seta/barra, sem jargão corporativo)
- [x] T009 [P] Teste unitário para `buildOrganizeUserPrompt` em
      `src/lib/ai/extraction/prompts/__tests__/organize.test.ts` — confirma que company/entry_date
      são OMITIDOS do prompt quando a fonte já tem contexto/período resolvido (reforça FR-004/
      FR-006 na origem) — DEVE falhar antes de T010
- [x] T010 Implementar `buildOrganizeUserPrompt(rawContent, { company, entryDate, tagVocabulary,
      existingHighlights })` em `src/lib/ai/extraction/prompts/organize.ts`
- [x] T011 [P] Criar `src/lib/entries/` (novo diretório, ver plan.md "Structure Decision")
- [x] T012 [P] Teste unitário para vocabulário de tags em
      `src/lib/entries/__tests__/highlightVocabulary.test.ts` — `DISTINCT unnest(tags)` por
      `user_id`, ordenado — DEVE falhar antes de T013
- [x] T013 Implementar `getTagVocabulary(supabase, userId): Promise<string[]>` em
      `src/lib/entries/highlightVocabulary.ts`
- [x] T014 [P] Teste unitário para vocabulário de contextos em
      `src/lib/entries/__tests__/contextVocabulary.test.ts` — `DISTINCT company` por `user_id`,
      `company IS NOT NULL`, ordenado — DEVE falhar antes de T015
- [x] T015 Implementar `getContextVocabulary(supabase, userId): Promise<string[]>` em
      `src/lib/entries/contextVocabulary.ts`
- [x] T016 [P] Teste unitário para o rollup de tags em
      `src/lib/entries/__tests__/rollupEntryTags.test.ts` — união das tags de todos os
      `entry_highlights` de uma fonte, ordenada e sem duplicatas — DEVE falhar antes de T017
- [x] T017 Implementar `rollupEntryTags(supabase, entryId): Promise<string[]>` (recalcula e
      persiste `entries.tags`) em `src/lib/entries/rollupEntryTags.ts`

**Checkpoint**: schema, tipos, prompt e utilitários de vocabulário prontos — user stories podem
começar

---

## Phase 3: User Story 1 - Organizar sob demanda (Priority: P1) 🎯 MVP

**Goal**: botão "Organizar" infere métrica/impacto/tags/título (e empresa/período quando ainda
vazios) a partir do texto cru e anexos, preenchendo só campos vazios

**Independent Test**: salvar registro cru com anexo de imagem sem campos preenchidos, clicar
"Organizar", ver métrica/impacto/tags preenchidos e editáveis; repetir preenchendo "impacto"
manualmente antes — valor manual intacto após organizar

### Tests for User Story 1 ⚠️

- [ ] T018 [P] [US1] Teste de integração para `organizeEntry()` — fonte sem nenhum campo
      preenchido → cria `entry_highlights` com métrica/impacto/tags/título inferidos, em
      `src/lib/entries/__tests__/organizeEntry.test.ts` — DEVE falhar antes de T021
- [ ] T019 [P] [US1] Teste de integração: fonte com "impacto" já preenchido manualmente em um
      destaque existente → organização não sobrescreve esse campo (FR-002), mesmo arquivo de T018
- [ ] T020 [P] [US1] Teste de integração: fonte sem nenhum anexo → ainda infere a partir só do
      texto cru (FR-001 acceptance #3), mesmo arquivo de T018
- [ ] T021 [P] [US1] Teste de integração para `POST /api/entries/[id]/organize` em
      `tests/integration/api/entries-organize.test.ts` — 401 sem auth, 404 fonte de outro
      usuário, 200 com highlights no sucesso, 200 `{status:'failed'}` em erro de IA (nunca 5xx só
      por falha de IA, FR-030) — DEVE falhar antes de T023

### Implementation for User Story 1

- [ ] T022 [US1] Implementar `organizeEntry(supabase, userId, entryId)` em
      `src/lib/entries/organizeEntry.ts` — carrega fonte, monta prompt (T010), chama Haiku,
      valida (T007), insere `entry_highlights` (nunca sobrescreve destaques existentes), aplica
      "só preenche vazios" em `company`/`entry_date`, recalcula rollup (T017), seta
      `organized_at`/limpa `organizing_started_at`; em falha, limpa `organizing_started_at` sem
      lançar (depende de T003, T007, T010, T013, T015, T017)
- [ ] T023 [US1] Implementar `POST /api/entries/[id]/organize` em
      `src/app/api/entries/[id]/organize/route.ts` — guarda de concorrência via
      `organizing_started_at` (timeout curto), chama `organizeEntry` (T022), resposta conforme
      `contracts/organize.md`
- [ ] T024 [US1] Botão "Organizar" no cartão de fonte (`src/components/features/feed/SourceCard.tsx`,
      criado em US7 — se ainda não existir nesta fase, criar versão mínima aqui) chamando
      `POST /organize`, com estado de carregamento local
- [ ] T025 [US1] Campos "+ adicionar detalhes" (herdados da 025) continuam vazios/editáveis
      independente de o Organizar já ter rodado (FR-001 acceptance #4) — confirmar via teste de
      integração que não há regressão nesse comportamento

**Checkpoint**: User Story 1 funcional e testável de forma independente

---

## Phase 4: User Story 2 - Contexto por pílulas (Priority: P1)

**Goal**: seletor de pílulas determinístico (empresas usadas + "Projeto pessoal" + "Outro") com
precedência sobre inferência de IA

**Independent Test**: abrir registro, ver pílulas com empresas + fixas; selecionar preenche
imediatamente sem IA; "Outro" abre texto livre; registro não classificado fica sinalizado

### Tests for User Story 2 ⚠️

- [ ] T026 [P] [US2] Teste de integração para `ContextPillPicker` — renderiza vocabulário (T015) +
      "Projeto pessoal" + "Outro"; selecionar pílula dispara `PATCH` imediato sem chamada de IA,
      em `src/components/features/feed/__tests__/ContextPillPicker.test.tsx` — DEVE falhar antes
      de T029
- [ ] T027 [P] [US2] Teste de integração: `PATCH /api/entries/[id]` aceita `is_personal_project`
      e `company`, e uma organização subsequente não sobrescreve o valor selecionado
      manualmente (FR-004), em `tests/integration/api/entries-context.test.ts`
- [ ] T028 [P] [US2] Teste unitário: derivação de `ContextStatus` a partir de
      `company`/`is_personal_project` (unresolved / company / personal_project), em
      `src/lib/entries/__tests__/contextStatus.test.ts` — DEVE falhar antes de T031

### Implementation for User Story 2

- [ ] T029 [US2] Estender `updateEntrySchema` em `src/app/api/entries/[id]/route.ts` para aceitar
      `is_personal_project` (boolean) além do `company` já aceito
- [ ] T030 [US2] Criar `ContextPillPicker.tsx` em
      `src/components/features/feed/ContextPillPicker.tsx` — pílulas de `getContextVocabulary`
      (T015) + "Projeto pessoal" + "Outro" (abre input de texto livre), seleção dispara `PATCH`
      direto (T029), toque ≥48px (Princípio VIII)
- [ ] T031 Implementar `deriveContextStatus(company, isPersonalProject): ContextStatus` em
      `src/lib/entries/contextStatus.ts`
- [ ] T032 [US2] Sinalização discreta de "contexto não identificado" (FR-008) no cartão de fonte,
      usando `deriveContextStatus` (T031) — estilo convite, não alerta/erro (constituição VII)
- [ ] T033 [US2] Garantir em `organizeEntry` (T022) que a pílula pré-selecionada por inferência
      (FR-007, empresa central quando o texto cita mais de uma) continua editável — teste de
      integração dedicado cobrindo esse cenário em `organizeEntry.test.ts` (T018)

**Checkpoint**: User Stories 1 e 2 funcionam juntas — contexto resolvido por pílula tem
precedência sobre organização automática

---

## Phase 5: User Story 3 - Organização silenciosa (Priority: P1)

**Goal**: ao salvar sem clicar em "Organizar", disparo automático em segundo plano
(fire-and-forget), sem bloquear nem exigir confirmação

**Independent Test**: salvar sem clicar em "Organizar", navegar e voltar — campos já preenchidos,
sem ação adicional

### Tests for User Story 3 ⚠️

- [ ] T034 [P] [US3] Teste de integração: `POST /api/capture` (`kind: 'deposito'`) dispara
      `triggerOrganizeEntry` via `dispatchAsyncJobs` sem bloquear a resposta (mock/spy em
      `organizeEntry`, resposta HTTP não espera a promise resolver), em
      `tests/integration/api/capture-deposito-organize.test.ts` — DEVE falhar antes de T036
- [ ] T035 [P] [US3] Teste de integração: falha na chamada de IA durante a organização assíncrona
      não afeta a entry salva (permanece visível, sem estado de erro bloqueante), mesmo arquivo
      de T034

### Implementation for User Story 3

- [ ] T036 [US3] Implementar `triggerOrganizeEntry(userId, entryId)` em
      `src/lib/ai/extraction/jobs.ts` — chama `organizeEntry` (T022) com o mesmo guard de
      concorrência de `organizing_started_at`
- [ ] T037 [US3] Estender `dispatchAsyncJobs()` em `src/app/api/capture/route.ts` para incluir
      `fireAndForget('triggerOrganizeEntry', triggerOrganizeEntry(userId, entryId))`
- [ ] T038 [US3] Chamar `dispatchAsyncJobs(userId, entryId)` a partir de `handleDepositoCapture`
      (hoje não a chama — ver `research.md` §5) sem alterar seu comportamento de resposta (201
      imediato, sem esperar os jobs)
- [ ] T039 [US3] Estado transitório "organizando…" no `SourceCard`, derivado de
      `organizing_started_at` (recente) — sem rótulo persistente nem CTA adicional após conclusão
      (FR-011)
- [ ] T040 [US3] Bloco "Organizando o resto em segundo plano" no `SavedPanel.tsx`
      (`src/components/features/capture/SavedPanel.tsx`) — explicitamente fora de escopo da 025,
      entregue aqui

**Checkpoint**: User Stories 1-3 funcionam juntas — todo registro ganha organização, manual ou
automaticamente

---

## Phase 6: User Story 4 - Múltiplos destaques por fonte (Priority: P1)

**Goal**: uma fonte rica gera vários destaques dentro do mesmo registro; edição/remoção/adição
manual por destaque

**Independent Test**: organizar fonte com 2 resultados distintos de uma mesma reunião → 2
cartões de destaque no mesmo registro, sem registros adicionais

### Tests for User Story 4 ⚠️

- [ ] T041 [P] [US4] Teste de integração: texto cru com 2 resultados distintos de mesmo contexto →
      `organizeEntry` cria 2 `entry_highlights`, nenhuma nova linha em `entries`, mesmo arquivo de
      T018 — DEVE falhar antes de nova asserção ser satisfeita por T022 (já implementado na fase
      3 — este teste cobre o caso multi-destaque especificamente)
- [ ] T042 [P] [US4] Teste de integração: texto sem métrica clara → ao menos 1 destaque criado
      sem métrica, tratado como válido (FR-018), mesmo arquivo
- [ ] T043 [P] [US4] Teste de integração: `POST /api/entries/[id]/highlights` cria destaque em
      branco (`position` = último + 1); `PATCH`/`DELETE
      /api/entries/[id]/highlights/[highlightId]` edita/remove afetando só aquele destaque, em
      `tests/integration/api/entries-highlights.test.ts` — DEVE falhar antes de T045-T047

### Implementation for User Story 4

- [ ] T044 [US4] Criar `HighlightCard.tsx` em `src/components/features/feed/HighlightCard.tsx` —
      aberto por padrão quando único (FR-017), colapsado quando múltiplo, campos editáveis
      (título/métrica/impacto/tags)
- [ ] T045 [US4] Implementar `POST /api/entries/[id]/highlights/route.ts` (criar destaque em
      branco, FR-016)
- [ ] T046 [US4] Implementar `PATCH /api/entries/[id]/highlights/[highlightId]/route.ts` (edita
      campos; recalcula rollup de tags via T017 se `tags` mudou)
- [ ] T047 [US4] Implementar `DELETE` no mesmo arquivo de T046 (remove destaque; recalcula
      rollup; nunca remove a fonte)
- [ ] T048 [US4] Botão "+ adicionar destaque" no `SourceCard`, chamando T045

**Checkpoint**: User Stories 1-4 funcionam juntas — destaques existem, são editáveis/removíveis, e
a organização automática os popula

---

## Phase 7: User Story 6 - Tags consistentes (Priority: P1)

**Goal**: tags novas reaproveitam o vocabulário já usado pela pessoa; formato consistente; nunca
adjetivo genérico isolado

**Independent Test**: organizar 2 registros com a mesma habilidade em palavras diferentes → mesma
tag nos dois; filtro por tag em Registros retorna ambos

### Tests for User Story 6 ⚠️

- [ ] T049 [P] [US6] Teste de integração: prompt de organização recebe o vocabulário de tags
      (T013) e o resultado reaproveita uma tag existente em vez de criar variação, em
      `organizeEntry.test.ts` (mesmo arquivo de T018) — DEVE falhar antes de T050
- [ ] T050 [US6] Ajustar `buildOrganizeUserPrompt` (T010) e `organizeEntry` (T022) para injetar
      `getTagVocabulary` no contexto de cada chamada
- [ ] T051 [P] [US6] Teste de integração: `getFeedData` filtra por tag usando o rollup de
      `entries.tags` e retorna as duas fontes organizadas com a tag reaproveitada, em
      `src/lib/feed/__tests__/getFeedData.test.ts` (estende suíte existente) — DEVE falhar antes
      de T052 (Phase 9)
- [ ] T052 [US6] Confirmar (via revisão do prompt T008 + teste) que nenhuma tag gerada é um
      adjetivo genérico isolado — lista de bloqueio reaproveitada da extração legada
      (`capture.ts`)

**Checkpoint**: filtro por tag em Registros permanece útil com o vocabulário reaproveitado

---

## Phase 8: User Story 5 - Título outcome-first (Priority: P2)

**Goal**: título de destaque substantivo-primeiro/outcome-first, com número quando presente,
editável e protegido de sobrescrita

**Independent Test**: organizar redução de tempo mensurável → título traz o número; editar e
confirmar que reorganização futura não sobrescreve

### Tests for User Story 5 ⚠️

- [ ] T053 [P] [US5] Teste de integração: destaque com métrica clara → título gerado inclui o
      número (ex. "Redução de 50% no tempo de investigação de bug crítico"), em
      `organizeEntry.test.ts` — DEVE falhar antes de ajuste no prompt (T008, já implementado —
      este teste valida o comportamento específico de título)
- [ ] T054 [P] [US5] Teste de integração: título editado manualmente não é sobrescrito em
      reorganização futura (FR-020, mesma regra "só preenche vazios" aplicada a `title`), mesmo
      arquivo

### Implementation for User Story 5

- [ ] T055 [US5] Ajustar `organizeEntry` (T022) para tratar `title` de um destaque existente com a
      mesma regra "só preenche vazios" de métrica/impacto/tags (se ainda não coberto pela
      implementação da Phase 3)
- [ ] T056 [US5] Campo de título editável inline em `HighlightCard.tsx` (T044)

**Checkpoint**: títulos gerados seguem o padrão outcome-first e respeitam edição manual

---

## Phase 9: User Story 7 - Registros mostra a fonte (Priority: P2)

**Goal**: 1 card por fonte no feed, com miniatura real, selo de contagem, timeline por mês,
grade-faísca sem streak

**Independent Test**: fonte com 3 destaques e fonte com 1 — primeira com selo "+3 destaques",
segunda sem selo; expandir revela destaques + fonte completa

### Tests for User Story 7 ⚠️

- [ ] T057 [P] [US7] Teste de integração: `getFeedData` retorna `FeedItem.highlights`,
      `organizationStatus`, `contextStatus`, `isPersonalProject` por fonte legada (sem
      `entry_highlights`, FR-032 → destaque sintético único) e por fonte organizada (N
      destaques), em `src/lib/feed/__tests__/getFeedData.test.ts` — DEVE falhar antes de T059
- [ ] T058 [P] [US7] Teste de componente: `SourceCard` mostra selo apenas quando
      `highlights.length > 1`; miniatura real quando há evidência de imagem; sinalização discreta
      quando `contextStatus === 'unresolved'`, em
      `src/components/features/feed/__tests__/SourceCard.test.tsx` — DEVE falhar antes de T060

### Implementation for User Story 7

- [ ] T059 [US7] Estender `getFeedData`/`FeedItem`/`RawEntry` em `src/lib/feed/getFeedData.ts` e
      `src/lib/feed/types.ts` — join com `entry_highlights` por página, fallback sintético para
      fontes legadas, derivação de `organizationStatus`/`contextStatus` (conforme `data-model.md`)
- [ ] T060 [US7] Criar `SourceCard.tsx` completo em `src/components/features/feed/SourceCard.tsx`
      — card único por fonte, miniatura real, selo de contagem, sinalização de contexto,
      renderiza `HighlightCard` (T044) para cada destaque ao expandir
- [ ] T061 [US7] Atualizar `FeedPage.tsx` (`src/components/features/feed/FeedPage.tsx`) para
      renderizar `SourceCard` no lugar do card atual por entrada
- [ ] T062 [US7] Confirmar/ajustar timeline por mês e grade-faísca (`src/app/api/feed/activity`)
      — sem streak gamificado nem emoji (FR-029), sem mudança de contrato além de remoção de
      qualquer resquício de streak se existir

**Checkpoint**: todas as user stories funcionam juntas — Registros reestruturado, fim a fim

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T063 [P] Rodar `/impeccable shape` para a reestruturação de Registros e o `ContextPillPicker`
      antes de finalizar qualquer decisão visual pendente (constituição VII) — se ainda não feito
      antes da Phase 9
- [ ] T064 [P] Rodar `/code-review medium` ao final de cada fase de user story (já indicado nos
      checkpoints acima); consolidar achados críticos/altos antes do PR
- [ ] T065 [P] Confirmar cobertura de teste ≥80% nas áreas novas (`src/lib/entries/`,
      `src/lib/ai/extraction/prompts/organize.ts`, rotas novas) via `npm run test -- --coverage`
- [ ] T066 Rodar `quickstart.md` (todos os roteiros US1-US7) manualmente antes do `/impeccable
      audit` e do PR
- [ ] T067 [P] `/impeccable audit` + `web-design-guidelines` — acessibilidade e identidade visual
      do feed reestruturado e das pílulas (Princípios V/VII/VIII)
- [ ] T068 Atualizar `CLAUDE.md` (marcador `<!-- SPECKIT START -->`/`<!-- SPECKIT END -->`) para
      status "implementada" e mover a entrada para a lista de features mergeadas, quando o PR for
      aberto/mergeado (fora do escopo deste plano — nota para a etapa `/speckit-implement`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories (migration,
  tipos, prompt, schema, vocabulários)
- **User Stories (Phase 3-9)**: todas dependem de Foundational
  - US1 (Phase 3) é a base de `organizeEntry`/rota `/organize` — US2, US3, US4, US6 estendem essa
    mesma função em vez de duplicá-la, então na prática **US1 deve vir primeiro**, apesar de
    todas serem P1
  - US2 (Phase 4) depende de US1 (usa `organizeEntry` para validar precedência de pílula, FR-007)
  - US3 (Phase 5) depende de US1 (reusa `organizeEntry` no disparo assíncrono)
  - US4 (Phase 6) depende de US1 (múltiplos destaques é o mesmo `organizeEntry`, teste adicional)
  - US6 (Phase 7) depende de US1 (vocabulário injetado na mesma função)
  - US5 (Phase 8) depende de US1/US4 (título é campo de um destaque já existente)
  - US7 (Phase 9) depende de US4 (feed mostra destaques que só existem a partir da Phase 6) e de
    US2 (sinalização de contexto)
- **Polish (Phase 10)**: depende de todas as user stories desejadas estarem completas

### Parallel Opportunities

- Todas as tasks `[P]` de Setup e Foundational rodam em paralelo entre si
- Testes `[P]` de uma mesma user story rodam em paralelo (arquivos diferentes)
- US6 e US5 podem ser trabalhadas em paralelo depois de US1/US4 completas (arquivos
  praticamente disjuntos: prompt/vocabulário vs. componente de título)

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1 (Setup) + Phase 2 (Foundational — migration, tipos, prompt, schema)
2. Completar Phase 3 (US1 — organizar sob demanda)
3. **PARAR e VALIDAR**: roteiro US1 do `quickstart.md`
4. Deploy/demo se pronto

### Entrega incremental

1. Setup + Foundational → fundação pronta
2. US1 → validar → (MVP: botão "Organizar" funciona)
3. US2 → validar → contexto por pílula com precedência sobre IA
4. US3 → validar → organização silenciosa (100% dos registros ganham destaque, SC-002)
5. US4 → validar → múltiplos destaques por fonte
6. US6 → validar → consistência de tags
7. US5 → validar → título outcome-first
8. US7 → validar → Registros reestruturado, fim a fim
9. Cada história soma valor sem quebrar as anteriores

---

## Notes

- [P] tasks = arquivos diferentes, sem dependência
- [Story] mapeia a task para a user story correspondente (rastreabilidade)
- Verificar que os testes falham antes de implementar
- Rodar `/code-review medium` ao fim de cada checkpoint de fase
- `/impeccable shape` é obrigatório antes de codar qualquer componente de UI novo
  (`ContextPillPicker`, `SourceCard`, `HighlightCard`) — não incluído como task numerada porque é
  um passo de processo (constituição VII), não uma unidade de trabalho de código
