---
description: "Task list — 016 Captura v2 (captura sem atrito)"
---

# Tasks: Captura v2 — Captura sem atrito

**Input**: Design documents from `/specs/016-captura-v2/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md). Reusa a
infraestrutura de captura (003), painel/insights (004/005) e mirror (004) já em `main`.

**Tests**: Incluídos (TDD, Princípio VI). Cobertura ≥ 80% nos módulos novos (parser de limite/lote,
delta do ressurgimento, enfileiramento da pergunta, wrapper de Web Speech).

**Organization**: agrupado por user story; cada uma é entregável e validável de forma independente
(ver [quickstart.md](./quickstart.md)).

> **Gate de UX**: rodar `/impeccable shape` para o **ressurgimento (US2)** e a **UI de gravação (US3)**
> — superfícies novas — **antes** de codar essas fases. US1 e US4 reusam superfícies existentes.

> **Decisão aberta (US2)**: marcador de "último retorno" — Opção A (`migration 011`) ou B (`localStorage`).
> Fechar em **T012** antes de implementar o delta. Ver [plan.md](./plan.md#decisão-pendente-a-fechar-nas-tasks-da-us2).

---

## Phase 1: Setup

- [x] T001 [SETUP] i18n: chaves novas em `src/messages/pt-BR.json` + espelho em `en.json` —
  `capture.*` (enquadramento de artefato, aviso de privacidade, microcopy de gravação/erros de áudio,
  resumo "criei N entradas"/desfazer) e `panel.*` (ressurgimento "tem novidade"/"vitória antiga"/convite).

## Phase 2: Foundational (Blocking)

- [x] T002 [FND] Escrever teste do limite máximo de texto no `/api/capture` (`__tests__`): texto acima
  do limite → 400 com mensagem de limite; no limite → passa. **Deve falhar.**
- [x] T003 [FND] Impor o **limite máximo** de tamanho do texto colado em `src/app/api/capture/route.ts`
  (constante nomeada; mensagem i18n; sem truncar) até T002 passar. (FR-005)
- [x] T004 [FND] Escrever teste de `DELETE /api/entries/batch` (`__tests__`): deleta só entradas do
  próprio usuário (RLS), ignora IDs alheios, valida `ids[]`. **Deve falhar.**
- [x] T005 [FND] Implementar `src/app/api/entries/batch/route.ts` (`DELETE`, recebe `ids[]`, auth-first,
  escopa por `user_id`) até T004 passar. (FR-003 — base do desfazer)
- [x] T006 [FND] **Decisão US2** registrada: escolher Opção A/B do marcador de retorno (ver T012). Se A:
  preparar `supabase/migrations/011_profiles_last_panel_seen.sql` (coluna `last_panel_seen_at timestamptz`
  nullable) — **não aplicar ainda**; aplicar no dev na fase da US2.

**Checkpoint**: limite e desfazer-de-lote prontos e testados; caminho do marcador de retorno escolhido.

## Phase 3: User Story 1 — Colar artefato vira entradas (P1) 🎯

- [x] T007 [P] [US1] Escrever teste do fluxo de lote no cliente (`BatchSummary` / `CaptureConversation`):
  ao receber N entradas, mostra "criei N entradas" + desfazer; desfazer chama `DELETE /api/entries/batch`
  com os IDs. **Deve falhar.**
- [x] T008 [US1] `src/components/features/capture/BatchSummary.tsx` (NOVO) — card "criei N entradas" com
  **desfazer** (toque único), reusando a estética dos cards existentes. (FR-003)
- [x] T009 [US1] Ligar `BatchSummary` ao `CaptureConversation.tsx` (ESTENDE): após salvar, exibir o
  resumo com os IDs do lote; desfazer remove o lote e dá `router.refresh()`.
- [x] T010 [US1] `CaptureComposer.tsx` (ESTENDE): **enquadramento de artefato** no placeholder ("cole uma
  transcrição, um e-mail, uma conversa") + **aviso leve de privacidade** ("cole só o que você pode
  guardar"). (FR-001/019) — sem detecção de PII (decisão de clarify).
- [x] T011 [US1] Conferir o estado honesto de "sem conquista" (já existe via `NoExtractableContentError`
  → 422 `noContent`): ajustar o texto para o convite "quer contar com suas palavras?" (FR-004).

**Checkpoint (validação manual, conta QA — [quickstart US1](./quickstart.md#us1--colar-artefato-vira-entradas-p1)):**
colar transcrição com 2–3 conquistas → entradas fiéis salvas na hora + desfazer + estados honestos.

## Phase 4: User Story 2 — Ressurgimento por delta (P1) 🎯

> Rodar `/impeccable shape` do ressurgimento antes de T013. Aplicar `011` **no dev** se Opção A (T006).

- [x] T012 [US2] **Fechar a decisão do marcador de retorno** (A: `last_panel_seen_at`; B: `localStorage`)
  e registrar no plan/research. Se A: aplicar `011` no `borogodo-dev`.
- [x] T013 [US2] Escrever teste de `getReturnSignal` (`src/lib/panel/__tests__`): ≥1 entrada nova desde o
  retorno → `tem-novidade`; aha de força só se `mirror_snapshots.generated_at` > último retorno; sem
  entrada nova → `ressurgir+convidar` com vitória antiga; banco vazio → boas-vindas; **nunca** fabrica
  análise. **Deve falhar.** (FR-006/007/008, SC-003)
- [x] T014 [US2] Implementar `src/lib/panel/getReturnSignal.ts` (NOVO) — delta a partir de `entries` +
  `mirror_snapshots` + marcador de retorno; escolhe vitória antiga (mais antiga / aniversário) no ramo
  sem novidade — até T013 passar.
- [x] T015 [US2] Integrar em `getPanelData.ts` (ESTENDE): incluir o `returnSignal` no `PanelData` e
  **atualizar o marcador de retorno** (now()) ao montar o painel. Placeholder por relógio permanece
  (aditivo).
- [x] T016 [US2] `src/components/features/painel/ReturnHighlight.tsx` (NOVO) — destaque no topo do painel
  para os dois ramos; **sem** linguagem de cobrança; convite cai direto na captura (FR-009).

**Checkpoint (validação manual — [quickstart US2](./quickstart.md#us2--ressurgimento-por-delta-p1)):**
os dois ramos do delta se comportam; nenhuma análise inventada; convite leva à captura.

## Phase 5: User Story 3 — Áudio in-app (P2)

> Rodar `/impeccable shape` da UI de gravação antes de T018.

- [x] T017 [US3] Escrever teste de `useSpeechRecognition` (`src/hooks/__tests__`, Web Speech **mockada**):
  start emite transcrição; stop encerra; cancel descarta tudo; rerecord limpa antes de iniciar; sem
  suporte → estado honesto. **Deve falhar.** (FR-011/012a/013)
- [x] T018 [US3] Implementar `src/hooks/useSpeechRecognition.ts` (NOVO) — wrapper de `SpeechRecognition`
  com `unknown`+narrow (sem `any`), detecção de suporte, ciclo start/stop/cancel/rerecord — até T017 passar.
- [x] T019 [US3] `src/components/features/capture/AudioRecorder.tsx` (NOVO) — UI de gravação com **botões
  explícitos** parar/cancelar/regravar, rotulados e por teclado/leitor de tela (FR-012b); transcrição
  ao vivo editável.
- [x] T020 [US3] `AudioButton.tsx` (ESTENDE) — deixa de ser stub `disabled`: abre o `AudioRecorder` onde
  há suporte; estado honesto (indisponível/limitado) onde não há (FR-013). O texto transcrito injeta
  `kind:'text'` no `CaptureComposer` (segue para a extração da US1). `transcribe.ts`/ramo `audio` da
  rota **continuam inertes**.

**Checkpoint (validação manual — [quickstart US3](./quickstart.md#us3--áudio-in-app-p2)):**
gravar/parar/cancelar/regravar em Chrome/desktop; degradação honesta em Safari/iPhone; texto sempre funciona.

## Phase 6: User Story 4 — Pergunta cirúrgica assíncrona (P3)

- [x] T021 [US3→US4] Adicionar `'enrichment_nudge'` ao union `ProactiveInsightType` (`src/types/insight.ts`)
  — **sem migration** (`type` é texto livre; precedente da 014 com `content_opportunity`).
- [x] T022 [US4] Escrever teste de `getEnrichmentNudge` (`src/lib/panel/__tests__`): entrada magra (sem
  `metric` e sem `impact`) sem nudge prévio → gera **um** `enrichment_nudge`; entrada já com nudge (visto
  ou não) → **não** gera outro; entrada cheia → nada. **Deve falhar.** (FR-014, SC-005)
- [x] T023 [US4] Implementar `src/lib/panel/getEnrichmentNudge.ts` (NOVO) — detecta entrada magra, evita
  duplicar nudge, insere via `insertProactiveInsight` (`type:'enrichment_nudge'`, `entry_ids:[id]`) — até
  T022 passar.
- [x] T024 [US4] Renderizar o nudge no painel com o **padrão de input do `ReflectionCard`** (campo +
  enviar) na superfície de insight existente; responder chama `PATCH /api/entries/[id]/enrich` (já
  existe); ao responder/dispensar, `markInsightSeen` (FR-015). Incorpora à entrada, não cria nova.

**Checkpoint (validação manual — [quickstart US4](./quickstart.md#us4--pergunta-cirúrgica-assíncrona-p3)):**
no máx. uma pergunta por vez fora da captura; responder enriquece e fecha; ignorar não quebra nada.

## Phase 7: Polish

- [x] T025 [POLISH] a11y: foco/labels/anúncios de gravação (`AudioRecorder`), foco no `ReturnHighlight`
  e no nudge; "nunca página em branco" no ressurgimento. `/impeccable audit` + `web-design-guidelines`.
- [x] T026 [POLISH] i18n: revisar `capture.*`/`panel.*`, garantir `en.json` espelhado, zero hardcoded.
- [x] T027 [POLISH] `npm run test` (≥ 80% nos módulos novos) + `lint` + `tsc`; `/security-review`
  (isolamento RLS do texto de terceiros, sanitização pré-LLM) + `/pr-review` antes do PR.
- [ ] T028 [POLISH] Se houver `011`: aplicar a migration **no prod** (`borogodo`) antes do deploy —
  mesmo padrão de `009`/`010`. Atualizar status no `CLAUDE.md`.

## Dependências

- **Setup (T001)** e **Foundational (T002–T006)** antes de qualquer US.
- **US1 (P1)** e **US2 (P1)** são o núcleo; US1 não depende de US2.
- **US3 (P2)** depende do caminho de texto da US1 (injeta `kind:'text'`).
- **US4 (P3)** depende de existir captura gerando entradas (US1) e reusa a trilha de insight.
- **T021** (union `enrichment_nudge`) é pré-requisito de T022–T024.
