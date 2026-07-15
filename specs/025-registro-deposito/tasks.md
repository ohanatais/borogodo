# Tasks: Registro como Depósito (fundação)

**Input**: Design documents de `/specs/025-registro-deposito/` (spec.md, plan.md, research.md,
data-model.md, contracts/capture.md, quickstart.md)

**Tests**: TDD é mandatório pela constituição do projeto (Princípio VI) — testes vêm ANTES da
implementação e devem falhar primeiro.

**Organization**: Tarefas agrupadas por user story (US1-US7, prioridades da spec.md) para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1-US7, mapeando pra spec.md
- Caminhos de arquivo exatos em cada descrição

---

## Phase 1: Setup

**Purpose**: dependências e scaffolding compartilhado antes de qualquer código de feature

- [X] T001 Adicionar dependência `next-themes` (`npm install next-themes`) e confirmar compatibilidade com Next.js 15 App Router
- [X] T002 [P] Criar namespace i18n `registro` em `src/messages/pt-BR.json` e `src/messages/en.json` (stub) com chaves vazias para: drawer (placeholder, botões Imagem/Link/Registrar), tiles de anexo, SavedPanel, DetailsFields
- [X] T003 [P] Estender namespace `appNav` em `src/messages/pt-BR.json`/`en.json` com chaves para grupos ("Meu espelho", "Usar") e novos itens (Perfil, Trajetória, Gerar conteúdo, Me preparar, Perguntar)
- [X] T004 [P] Estender namespace do Painel (`panel`/`painel`, conferir nome exato em `src/messages/pt-BR.json`) com chaves para saudação, "Suas forças", "Registros recentes", modo "novo" (progresso 0/3, botão Importar não-funcional)

**Checkpoint**: dependências instaladas, chaves i18n existem (mesmo vazias) — nenhum componente quebra por chave ausente

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura de salvamento direto que TODAS as user stories de captura (US1-US4, US7) dependem

**⚠️ CRITICAL**: nenhuma user story de captura pode ser implementada antes desta fase

- [X] T005 [P] Teste unitário para heurística de título em `tests/unit/lib/capture/buildEntryTitle.test.ts` (primeira linha, trim, truncagem em 80 chars com reticências) — DEVE falhar antes de T006
- [X] T006 Implementar `buildEntryTitle(rawText: string): string` em `src/lib/capture/buildEntryTitle.ts` (ver research.md §3)
- [X] T007 [P] Teste de integração para `POST /api/capture` (`kind: 'deposito'`) em `tests/integration/api/capture-deposito.test.ts` — cobre: texto curto salva (201), texto vazio retorna 422 `emptyContent`, texto de milhares de caracteres preservado verbatim, resposta não depende de nenhuma chamada de IA (mockar/spy em `captureAndReflect` e garantir zero chamadas) — DEVE falhar antes de T008/T009
- [X] T008 Implementar `saveDeposito(supabase, userId, { rawText, manualFields? })` em `src/lib/capture/saveDeposito.ts` — insere em `entries` com `source: 'deposito'`, `title` via `buildEntryTitle`, campos manuais verbatim, sem chamada de IA (ver contracts/capture.md e data-model.md)
- [X] T009 Adicionar handler `handleDepositoCapture` (`kind: 'deposito'`) em `src/app/api/capture/route.ts`, chamando `saveDeposito`, sem alterar os handlers existentes (`marco`, `text`, `file`, `audio`, `image`, `question`)
- [X] T010 Criar shell do `Drawer` em `src/components/features/capture/Drawer.tsx` — abre/fecha (estado local, sem persistência), desktop lateral, sem lógica de salvar ainda (placeholder de conteúdo)
- [X] T011 [P] Criar hook `useDrawerDraft` em `src/hooks/useDrawerDraft.ts` — mantém texto/anexos/campos manuais em memória durante a sessão do drawer, descarta ao fechar sem salvar (FR-015)

**Checkpoint**: rota de salvamento direto funcional via teste de integração; drawer abre/fecha vazio — pronto para as user stories de captura

---

## Phase 3: User Story 1 - Registrar sem nunca ser rejeitada (Priority: P1) 🎯 MVP

**Goal**: qualquer texto não-vazio salva, sem rejeição por tamanho, sem reroteamento pro chat, sem IA bloqueante

**Independent Test**: abrir o drawer, digitar uma frase curta e salvar (aparece em Registros sem erro/redirecionamento); colar texto longo e confirmar que salva verbatim

### Tests for User Story 1 ⚠️

- [X] T012 [P] [US1] Teste de integração: digitar texto curto no `Drawer` e salvar → registro aparece, sem erro, sem abrir `ChatSheet`, em `tests/integration/capture/drawer-always-saves.test.tsx` — DEVE falhar antes da implementação
- [X] T013 [P] [US1] Teste de integração: colar texto de milhares de caracteres → salvo verbatim, sem truncar, em `tests/integration/capture/drawer-long-text.test.tsx`
- [X] T014 [P] [US1] Teste unitário: botão "Registrar" desabilitado quando texto vazio e sem anexo, em `tests/unit/components/capture/Drawer.disabled-state.test.tsx`

### Implementation for User Story 1

- [X] T015 [US1] Implementar `DrawerTextarea.tsx` em `src/components/features/capture/DrawerTextarea.tsx` — textarea "bloco de notas", controlado pelo `useDrawerDraft`
- [X] T016 [US1] Remover `ARTIFACT_THRESHOLD_CHARS` e a ramificação de reroteamento pro `ChatSheet` por tamanho de texto em `src/components/layout/AppShellClient.tsx` (blocos desktop e mobile) — ver research.md §6
- [X] T017 [US1] Conectar `Drawer` ao `saveDeposito` via `POST /api/capture` (`kind: 'deposito'`) no clique em "Registrar", com botão desabilitado quando `rawText.trim()` vazio e sem anexos pendentes (FR-001 a FR-004)
- [X] T018 [US1] Tratar erro de rede/servidor (não de conteúdo) preservando o texto digitado e oferecendo nova tentativa (FR-016), distinto de qualquer rejeição de conteúdo (que não deve mais existir)
- [X] T019 [US1] Sinal visível para textos colados acima de ~200 caracteres confirmando que a fonte completa foi preservada (FR-017), em `DrawerTextarea.tsx`

**Checkpoint**: User Story 1 funcional e testável de forma independente — salvar nunca rejeita, nunca reroteia, nunca espera IA

---

## Phase 4: User Story 2 - Anexar imagem e link na hora de registrar (Priority: P1)

**Goal**: anexar imagem (clique/colar/arrastar) e link (botão dedicado) no mesmo passo de escrever o texto

**Independent Test**: anexar via clique, colar (Cmd+V) e arrastar produzem o mesmo resultado (tile com miniatura real); link via botão "Link"; URL solta no texto livre não vira anexo

### Tests for User Story 2 ⚠️

- [X] T020 [P] [US2] Teste de integração: clicar "Imagem" e escolher arquivo → miniatura real antes de salvar, em `tests/integration/capture/attach-image-click.test.tsx`
- [X] T021 [P] [US2] Teste de integração: colar imagem da área de transferência com foco no textarea → vira anexo, sem lixo no texto, em `tests/integration/capture/attach-image-paste.test.tsx`
- [X] T022 [P] [US2] Teste de integração: arrastar arquivo de imagem sobre o drawer → destaque visual durante arraste, tile ao soltar, em `tests/integration/capture/attach-image-drag.test.tsx`
- [X] T023 [P] [US2] Teste de integração: botão "Link" cria tile com domínio/título; URL digitada dentro do texto livre permanece texto, em `tests/integration/capture/attach-link.test.tsx`
- [X] T024 [P] [US2] Teste de integração: remover anexo antes de salvar → não persiste, nenhuma chamada de rede para aquele anexo, em `tests/integration/capture/attach-remove-before-save.test.tsx`
- [X] T025 [P] [US2] Teste de integração: salvar com anexos, reabrir em `/registros`, anexos continuam visíveis, em `tests/integration/capture/attach-persist-and-reopen.test.tsx`

### Implementation for User Story 2

- [X] T026 [P] [US2] Criar `AttachTile.tsx` em `src/components/features/capture/AttachTile.tsx` — tile com miniatura real (imagem) ou domínio/título (link), botão de remover
- [X] T027 [US2] Implementar clique "Imagem" (`<input type="file">`) no `Drawer`, gerando preview local via `URL.createObjectURL` antes de salvar
- [X] T028 [US2] Implementar handler de paste (`onPaste`) no `DrawerTextarea` detectando imagem na área de transferência (`clipboardData.items`) e adicionando como anexo sem inserir no texto
- [X] T029 [US2] Implementar drag-and-drop no `Drawer` (`onDragOver`/`onDrop`) com destaque visual só durante arraste ativo (FR-005a)
- [X] T030 [US2] Implementar botão "Link" com input de URL dedicado, criando tile de link (sem detecção automática de URL dentro do texto livre — FR-006)
- [X] T031 [US2] Ao clicar "Registrar": após `saveDeposito` retornar `{ id }`, disparar `POST /api/entries/[id]/evidence` (rota existente, sem alteração) para cada anexo pendente — sequencial ou paralelo, ver research.md §2 — com tratamento de falha parcial por anexo (mantém entry salva, sinaliza qual anexo falhou, oferece retry)
- [X] T032 [US2] Remoção de anexo no estado local do `useDrawerDraft` antes do clique em Registrar (sem chamada de rede)

**Checkpoint**: User Story 2 funcional — anexos via 3 caminhos equivalentes, persistem, removíveis antes de salvar

---

## Phase 5: User Story 3 - Confirmação visível e editável após salvar (Priority: P1)

**Goal**: após salvar, título pré-preenchido editável e "salvo em Registros"

**Independent Test**: salvar e ver confirmação com título editável; editar e confirmar persistência; fechar sem editar mantém o título

### Tests for User Story 3 ⚠️

- [X] T033 [P] [US3] Teste de integração: salvar registro → `SavedPanel` aparece com título pré-preenchido editável e texto "salvo em Registros", em `tests/integration/capture/saved-panel-appears.test.tsx`
- [X] T034 [P] [US3] Teste de integração: editar título no `SavedPanel` e concluir → `/registros` reflete o novo título, em `tests/integration/capture/saved-panel-edit-title.test.tsx`
- [X] T035 [P] [US3] Teste de integração: fechar `SavedPanel` sem editar → título pré-preenchido mantido, em `tests/integration/capture/saved-panel-keep-title.test.tsx`

### Implementation for User Story 3

- [X] T036 [US3] Criar `SavedPanel.tsx` em `src/components/features/capture/SavedPanel.tsx` — título editável inline (usa o `title` retornado por `saveDeposito`), mensagem "salvo em Registros"
- [X] T037 [US3] Conectar edição de título do `SavedPanel` a um `PATCH`/`update` na entry salva (reusar query existente equivalente em `src/lib/db/entries.ts`, ou criar `updateEntryTitle` se não existir)
- [X] T038 [US3] Transição `Drawer` → `SavedPanel` no `Drawer.tsx` após resposta bem-sucedida de `saveDeposito` (antes mesmo dos anexos terminarem de subir — ver T031)

**Checkpoint**: User Story 3 funcional — loop de confiança fechado (nunca "registra às cegas")

---

## Phase 6: User Story 4 - Adicionar detalhes manualmente, sem esperar IA (Priority: P2)

**Goal**: seção opcional "+ adicionar detalhes" com campos manuais, sem qualquer chamada de IA

**Independent Test**: abrir a seção, preencher métrica/tags sem clicar em nada de IA, salvar, conferir persistência exata

### Tests for User Story 4 ⚠️

- [X] T039 [P] [US4] Teste de integração: abrir "+ adicionar detalhes" → campos vazios, zero chamadas de rede disparadas pela abertura, em `tests/integration/capture/details-fields-open.test.tsx`
- [X] T040 [P] [US4] Teste de integração: preencher métrica/impacto/tags/empresa/data e salvar → registro contém exatamente o digitado, em `tests/integration/capture/details-fields-save.test.tsx`
- [X] T041 [P] [US4] Teste de integração: não abrir a seção → registro salva normalmente só com texto/anexos, em `tests/integration/capture/details-fields-optional.test.tsx`

### Implementation for User Story 4

- [X] T042 [US4] Criar `DetailsFields.tsx` em `src/components/features/capture/DetailsFields.tsx` — campos de texto simples (métrica, impacto, tags, empresa, data), colapsável, sem nenhuma chamada de IA
- [X] T043 [US4] Integrar `DetailsFields` ao `useDrawerDraft` (estado `manualFields`) e ao payload de `saveDeposito` (`manualFields` do contrato, ver contracts/capture.md)

**Checkpoint**: User Story 4 funcional — atalho manual independente do botão Organizar (fora de escopo)

---

## Phase 7: User Story 5 - Painel novo: saudação, gatilho único e resumo rápido (Priority: P2)

**Goal**: Painel em coluna única — saudação, gatilho de Registro, "Suas forças", "Registros recentes" — sem barra fixa nem cartão de Espelho pesado

**Independent Test**: abrir Painel, confirmar ausência da barra fixa "Registrar|Perguntar" e presença de saudação/gatilho/forças/recentes

### Tests for User Story 5 ⚠️

- [X] T044 [P] [US5] Teste de integração: Painel com dados renderiza saudação, gatilho único, "Suas forças", "Registros recentes", sem barra fixa "Registrar|Perguntar", em `tests/integration/painel/painel-layout.test.tsx`
- [X] T045 [P] [US5] Teste de integração: clicar no gatilho de Registro abre o `Drawer`, em `tests/integration/painel/painel-trigger-opens-drawer.test.tsx`
- [X] T046 [P] [US5] Teste de integração: conta sem registros → modo "novo" com gatilho, botão "Importar currículo ou LinkedIn" visível e não-funcional (sem erro no console ao clicar), cartão de progresso 0/`FIRST_MIRROR_MIN_ENTRIES`, em `tests/integration/painel/painel-empty-state.test.tsx` (substitui/estende teste existente se houver)

### Implementation for User Story 5

- [X] T047 [P] [US5] Criar `HomeGreeting.tsx` em `src/components/features/painel/HomeGreeting.tsx` — saudação por horário (Bom dia/Boa tarde/Boa noite) + nome
- [X] T048 [P] [US5] Criar `RegistroTrigger.tsx` em `src/components/features/painel/RegistroTrigger.tsx` — gatilho único borda coral "Registrar o que você fez", abre `Drawer`; implementa FR-012a (digitar/colar direto no gatilho pré-preenche o drawer sem perder conteúdo)
- [X] T049 [P] [US5] Criar `SuasForcas.tsx` em `src/components/features/painel/SuasForcas.tsx` — resumo compacto em texto + link "Ver espelho" (reusa dados já calculados por `getPanelData`/lógica do `BorogodoCard` existente)
- [X] T050 [P] [US5] Criar `RegistrosRecentes.tsx` em `src/components/features/painel/RegistrosRecentes.tsx` — até 3 registros recentes + link "Ver todos" para `/registros`
- [X] T051 [US5] Criar `NewAccountPrompt.tsx` em `src/components/features/painel/NewAccountPrompt.tsx` — modo "novo": gatilho em destaque, botão "Importar currículo ou LinkedIn" visível sem ação (FR-021), cartão de progresso usando `FIRST_MIRROR_MIN_ENTRIES` (FR-022, sem número novo)
- [X] T052 [US5] Recompor `src/app/[locale]/(app)/painel/page.tsx` para o novo layout de coluna única, substituindo `PanelEmptyState` por `NewAccountPrompt` e reorganizando `ReviewCycleInvite`/demais componentes mantidos (ver research.md §8)
- [X] T053 [US5] Remover/decidir destino de `PainelChatDoor.tsx` — se absorvido pelo item "Perguntar" da navegação nova (avaliar durante `/impeccable shape`), remover import do Painel

**Checkpoint**: User Story 5 funcional — hierarquia visual nova sem regressão de dados do Painel

---

## Phase 8: User Story 6 - Navegação em grupos + dark mode (Priority: P2)

**Goal**: sidebar com grupos "Meu espelho"/"Usar"; dark mode funcional nas superfícies tocadas

**Independent Test**: sidebar mostra os 2 grupos corretos; Perfil/Trajetória levam ao Espelho (toggle certo); Perguntar abre overlay; alternar tema mantém legibilidade

### Tests for User Story 6 ⚠️

- [X] T054 [P] [US6] Teste de integração: sidebar desktop renderiza "Painel"/"Registrar" no topo + grupos "Meu espelho" (Perfil, Trajetória, Registros) e "Usar" (Gerar conteúdo, Me preparar, Perguntar), em `tests/integration/nav/nav-groups.test.tsx`
- [X] T055 [P] [US6] Teste de integração: clicar "Perfil"/"Trajetória" abre `/espelho` com o toggle correto pré-selecionado; "Gerar conteúdo"/"Me preparar" abrem `/presenca?hub=mostrar`/`?hub=preparar` direto; "Perguntar" abre `ChatSheet` sem navegar, em `tests/integration/nav/nav-groups-targets.test.tsx`
- [X] T056 [P] [US6] Teste de integração: viewport mobile mantém 4 abas (Painel, Espelho, Registros, Usar) + FAB central, "Espelho" único, em `tests/integration/nav/nav-mobile-tabbar.test.tsx`
- [X] T057 [P] [US6] Teste de integração: alternar tema claro/escuro mantém contraste/legibilidade em Painel, drawer e navegação (snapshot ou verificação de classe `dark` aplicada), em `tests/integration/theme/dark-mode-toggle.test.tsx`

### Implementation for User Story 6

- [X] T058 [US6] Estender `src/components/layout/navModel.ts` com `NAV_GROUPS` (Meu espelho / Usar) mantendo `NAV_DESTINOS` para mobile intacto (ver data-model.md, research.md §9) — inclui campo `action: 'open-chat'` para o item Perguntar
- [X] T059 [US6] Adicionar itens Perfil/Trajetória apontando para `/espelho` com parâmetro que pré-seleciona o toggle interno existente (feature 007) — confirmar nome exato do query param na página do Espelho antes de implementar
- [X] T060 [US6] Atualizar sidebar desktop em `src/components/layout/AppShellClient.tsx` para iterar `NAV_GROUPS` (Painel/Registrar isolados no topo, depois os 2 grupos com headers)
- [X] T061 [US6] Remover o toggle `Segmented` "Registrar | Perguntar" de `AppShellClient.tsx` (footer sticky desktop e Row 0 mobile); item "Perguntar" da navegação nova chama `openChatSheet()` diretamente (FR-013)
- [X] T062 [P] [US6] Criar `src/components/providers/ThemeProvider.tsx` (wrapper `next-themes`) e integrar no layout raiz (`src/app/[locale]/layout.tsx` ou equivalente)
- [X] T063 [P] [US6] Criar `src/components/ui/ThemeToggle.tsx` e posicionar na navegação (local exato a definir em `/impeccable shape`)
- [X] T064 [US6] Auditar/ajustar tokens `.dark` existentes em `src/app/globals.css` para as superfícies tocadas (Painel, Drawer, navegação) sem introduzir nomes de token novos (research.md §10) — reconciliar com o vocabulário do protótipo durante `/impeccable shape`, não aqui

**Checkpoint**: User Story 6 funcional — navegação reorganizada, dark mode ativo e legível nas superfícies da feature

---

## Phase 9: User Story 7 - Registrar no celular via bottom sheet (Priority: P2)

**Goal**: drawer mobile como bottom sheet, com alça de arrastar e rodapé de ação sempre acessível

**Independent Test**: tocar no FAB central em viewport mobile, drawer sobe como bottom sheet, fecha sem perder texto digitado

### Tests for User Story 7 ⚠️

- [X] T065 [P] [US7] Teste de integração: viewport mobile, tocar FAB → `Drawer` abre como bottom sheet (sobe da base), em `tests/integration/capture/drawer-mobile-bottom-sheet.test.tsx`
- [X] T066 [P] [US7] Teste de integração: fechar bottom sheet (toque fora/gesto) sem salvar → texto digitado preservado no rascunho da sessão, não persiste como registro, em `tests/integration/capture/drawer-mobile-close-preserves-draft.test.tsx`

### Implementation for User Story 7

- [X] T067 [US7] Implementar variante bottom sheet do `Drawer.tsx` para viewport mobile (media query/breakpoint já usado no projeto) — alça de arrastar no topo, fecha ao deslizar pra baixo ou tocar fora
- [X] T068 [US7] Garantir rodapé de ação (botão "Registrar") acessível mesmo com teclado virtual aberto (scroll interno do conteúdo, rodapé fixo)
- [X] T069 [US7] Conectar FAB central da tab bar mobile (`AppShellClient.tsx`) ao `Drawer` em modo bottom sheet

**Checkpoint**: todas as 7 user stories funcionais de forma independente

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: remoção seguro do caminho antigo, regressão e validação final

- [X] T070 [P] Remover `src/components/features/capture/CaptureConversation.tsx` (substituído por `Drawer`+`SavedPanel`) e seus imports/usos remanescentes
- [X] T071 [P] Remover `src/components/features/capture/CaptureComposer.tsx` (órfão confirmado em research.md §5) e `tests/integration/capture-flow.test.tsx` se ele só testava o componente removido (avaliar antes de apagar — pode ter cobertura útil a portar)
- [X] T072 Confirmar que `CaptureInput.tsx` permanece só para o modo "Perguntar" (`kind: 'question'`) e não é mais usado como gatilho de registro em `AppShellClient.tsx`
- [X] T073 [P] Teste de regressão: `/historico`/`EvidenceSection.tsx` continuam funcionando com registros antigos (`kind: 'text'`/`'marco'` pré-existentes) convivendo com novos `kind: 'deposito'`, em `tests/integration/historico/evidence-regression.test.tsx`
- [X] T074 [P] Teste de regressão: modo "Perguntar" (chat) continua funcional após reposicionamento no menu, em `tests/integration/chat/chat-still-works.test.tsx`
- [X] T075 Sincronizar `src/messages/en.json` com todas as chaves novas usadas (stub, mesmo que não traduzido) — conferir contra `pt-BR.json`
- [X] T076 Rodar `quickstart.md` (specs/025-registro-deposito/quickstart.md) ponta a ponta manualmente e registrar resultado — feito por leitura de código + suíte automatizada (sem browser); ver relatório da Phase 10 (itens confirmados via teste automatizado vs. pendentes de verificação manual humana listados no relatório final do agente)
- [~] T077 Rodar cobertura (`npm run test:coverage`) — **NÃO bate 80%** (Princípio VI): 74.57% statements / 66.58% branches / 73.38% functions / 76.71% lines. Gap é pré-existente (várias features anteriores a 025 — CorrectionConfirmCard, MarcoPreviewCard, aiUsage.ts, lib/db/mirror.ts, providers/anthropic.ts, draftsClient.ts — nunca tiveram cobertura, esta foi a primeira vez que `--coverage` rodou no projeto). Não preenchido com testes triviais (instrução explícita do agente orquestrador). Requer decisão da Ohana: aceitar a dívida documentada ou abrir uma frente dedicada de cobertura fora do escopo de polish da 025.
- [X] T078 (gap encontrado após o polish, sem task original) Wire `AudioButton`/`AudioRecorder` no `Drawer.tsx` (FR-018, tinha ficado de fora do breakdown inicial de `/speckit-tasks`) — transcrição cai no bloco-de-notas, não vira anexo; teste em `tests/integration/capture/drawer-audio-transcript.test.tsx`. Removidos os componentes de captura genuinamente órfãos (`FileButton.tsx`, `ReadingState.tsx`, `ReflectionCard.tsx`, `BatchSummary.tsx`, `CaptureInput.tsx` + testes dedicados) — confirmado via grep que nada mais os importa.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA US1-US4 e US7 (todas tocam o `Drawer`/rota de salvamento)
- **US1 (Phase 3)**: depende só de Foundational — é o MVP
- **US2 (Phase 4)**: depende de Foundational + `Drawer`/`useDrawerDraft` de US1 (mesmo componente); pode ser desenvolvida logo após T015/T017
- **US3 (Phase 5)**: depende de Foundational + US1 (precisa do `saveDeposito` retornando `{ id, title }`)
- **US4 (Phase 6)**: depende de Foundational + US1 (mesmo `Drawer`); independente de US2/US3
- **US5 (Phase 7)**: depende de US1-US3 existirem (gatilho abre um drawer funcional) — não depende de US4/US6/US7
- **US6 (Phase 8)**: independente de US1-US5 no código (navegação/tema são superfícies separadas), mas faz mais sentido demonstrável depois do Painel novo (US5) existir
- **US7 (Phase 9)**: depende de Foundational + US1 (variante do mesmo `Drawer`)
- **Polish (Phase 10)**: depende de todas as stories desejadas estarem completas

### Parallel Opportunities

- Todas as tarefas [P] de Setup (T002-T004) em paralelo
- T005 e T007 (testes) em paralelo entre si antes de T006/T008-T009
- Dentro de cada Phase de user story, todos os testes marcados [P] em paralelo antes da implementação
- US2, US4 podem ser desenvolvidas em paralelo por pessoas diferentes depois que US1 fecha o `Drawer` básico (T015-T017), já que tocam arquivos majoritariamente distintos (`AttachTile.tsx` vs `DetailsFields.tsx`)
- US6 (navegação/tema) pode ser desenvolvida em paralelo a US1-US5 por tocar arquivos diferentes (`navModel.ts`, `ThemeProvider.tsx`) — só a remoção do `Segmented` em `AppShellClient.tsx` (T061) precisa coordenar com quem mexe nesse arquivo em US1 (T016)

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1)
2. **PARAR E VALIDAR**: US1 sozinha já mata o bug crítico (rejeição/reroteamento) — testável isoladamente via quickstart.md §1
3. A partir daí, US2 e US3 fecham o "não registra às cegas" (P1 completo)

### Entrega incremental

1. Setup + Foundational → base pronta
2. US1 → MVP: salvar nunca falha
3. US2 → anexos de primeira classe
4. US3 → confirmação editável (fecha os 3 P1)
5. US4 → campos manuais (complemento P2)
6. US5 → Painel novo
7. US6 → navegação + dark mode
8. US7 → bottom sheet mobile
9. Polish → remove código antigo, regressão, cobertura

Cada story soma valor sem quebrar a anterior — a ordem de prioridade da spec (P1 antes de P2) é a
ordem de implementação recomendada.
