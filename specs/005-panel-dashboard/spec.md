# Feature Specification: Painel Principal (Espelho Vivo + Composer)

**Feature Branch**: `005-panel-dashboard`

**Created**: 2026-06-07

**Status**: Draft

**Input**: A tela principal após o login. É ao mesmo tempo o artefato (o espelho que se lê) e a superfície de captura (o composer onde se alimenta). Captura resolve pra cima — vira reflexo que atualiza os indicadores e o espelho; nunca um log de chat. Fonte: `docs/mvp/002-panel-skeleton.md` (+ schema `proactive_insights`).

## Clarifications

### Session 2026-06-07

- Q: Quais modalidades de captura aparecem no composer do MVP? → A: **Texto e arquivo (PDF)** ativos. Botões de **áudio e imagem renderizados mas desabilitados** com tooltip "em breve" (não removidos do JSX) — ativar depois é trocar o `disabled` e preencher o ramo da rota (003).
- Q: A superfície de captura (`CaptureComposer`/`CaptureConversation`) é definida aqui? → A: Sim. Vive em `src/components/features/capture/` e é a **superfície canônica**, reusada pelo onboarding (006).
- Q: Quem implementa `triggerProactiveInsight`? → A: Esta feature. Preenche o stub no-op de 003 e cria a tabela `proactive_insights` + o card.
- Q: O painel depende de quê? → A: De 003 (`/api/capture`, `/enrich`, tipos, `entries`) e 004 (`mirror_snapshots` para headline/indicadores). Implementar após ambas mergeadas (rebase em `main`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Capturar pelo composer e ver o painel reagir (Priority: P1)

A pessoa digita (ou anexa um PDF) no composer ancorado no rodapé. Abre a `CaptureConversation` (sheet focado em tela), aparece "Lendo o que você me contou...", o reflexo (diagnóstico) é mostrado, e ao resolver o sheet colapsa e o painel atrás **sobe os indicadores** (entradas +1, "capturou hoje ✓") e pode mostrar nova pílula de força. A captura resolve pra cima — nunca vira bolha de chat.

**Why this priority**: É o gesto central do produto vivendo na sua casa permanente. Sem ele o painel é estático.

**Independent Test**: No `/painel`, digitar no composer → ver o sheet, o reflexo (de `/api/capture`), e após resolver, os indicadores atualizados via `router.refresh()`.

**Acceptance Scenarios**:

1. **Given** usuária no `/painel`, **When** digita e envia no composer, **Then** abre a `CaptureConversation` com estado "lendo", depois o reflexo, e ao resolver os indicadores sobem
2. **Given** o reflexo tem um movimento "pergunta", **When** ela responde, **Then** chama `/enrich` e o campo é enriquecido; ao "salvar assim", apenas resolve
3. **Given** ela anexa um PDF no composer, **When** envia, **Then** o fluxo de captura por arquivo (003) roda e as entradas entram
4. **Given** clica no botão de áudio ou imagem, **When** o MVP, **Then** o botão está desabilitado com tooltip "em breve" (sem erro)
5. **Given** `/api/capture` falha, **When** ocorre, **Then** a `CaptureConversation` mostra estado de erro com retry; nada quebra o painel

---

### User Story 2 — Ler o espelho e os indicadores ao chegar (Priority: P1)

Ao abrir o painel, a primeira coisa é um **insight** (a headline do espelho), não navegação. Abaixo, um strip de indicadores que **prova que o produto trabalha** (N entradas · X meses · Y forças · há Z dias), com estado cromático conforme o volume (construindo/emergindo/ativo).

**Why this priority**: "O painel é o espelho" — o valor tem que ser visível em 1 segundo. Empata com US1 em prioridade.

**Independent Test**: Carregar `/painel` com dados e verificar headline do `mirror_snapshot` mais recente + indicadores corretos + pill de status conforme contagem.

**Acceptance Scenarios**:

1. **Given** existe `mirror_snapshot`, **When** abre o painel, **Then** vê a headline da força principal + link para `/espelho` + pill de status cromática
2. **Given** não há mirror ainda, **When** abre, **Then** vê "Seu espelho está se formando — continue capturando."
3. **Given** 1–3 entradas, **When** abre, **Then** pill "Em construção"; 4–9 → "Tomando forma"; 10+ → "Ativo"
4. **Given** capturou hoje, **When** vê o indicador de tempo, **Then** mostra "Capturou hoje ✓" (sem cobrança); 7+ dias → "Há 1 semana" (sem número exato)

---

### User Story 3 — Insight proativo e entradas recentes (Priority: P2)

O painel surfa **um** insight proativo não visto ("✦ Detectei algo novo esta semana"); se não há, o card **não renderiza** (nunca vazio). Abaixo da dobra, até 3 entradas recentes com ícone por fonte; clicar expande in-place.

**Why this priority**: Inteligência proativa (surfar algo novo a cada visita) reforça que o produto trabalha sozinho. Secundário ao gesto central.

**Independent Test**: Com um `proactive_insight` não visto, ver o card; sem nenhum, o card some. Entradas recentes (máx 3) renderizam com ícone por `source`.

**Acceptance Scenarios**:

1. **Given** há insight não visto, **When** abre o painel, **Then** o card aparece; ao ser visto, marca `seen`
2. **Given** não há insight, **When** abre, **Then** nenhum card de insight é renderizado
3. **Given** existem entradas, **When** abre, **Then** vê até 3 recentes com ícone por fonte e data; clicar expande
4. **Given** uma captura nova ocorreu, **When** o job roda, **Then** `triggerProactiveInsight` pode gerar um novo insight (background)

---

### Edge Cases

- Painel sem nenhuma entrada → estado "Construindo" + placeholder do composer convidativo (`getCapturePrompt(null)`).
- Regeneração do espelho em andamento → headline pode exibir "atualizando seu espelho..." (estado sutil).
- Erro de captura → sheet mostra erro/retry; painel intacto.
- Insight proativo ausente → card omitido (nunca placeholder vazio).
- Mobile (375px) → composer ancorado e utilizável; toques ≥ 48px.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O `/painel` MUST ser um Server Component que carrega em paralelo: contagem de entradas, 3 entradas recentes, último `mirror_snapshot`, 1 `proactive_insight` não visto.
- **FR-002**: O painel MUST renderizar a headline do espelho (ou o fallback "se formando"), o strip de indicadores, o card de insight (condicional) e as entradas recentes.
- **FR-003**: O composer (`CaptureComposer`) MUST ficar ancorado no rodapé (sticky), sempre visível, com placeholder contextual via `getCapturePrompt(daysSince, themes)`.
- **FR-004**: O composer MUST suportar **texto** e **arquivo (PDF)** ativos; botões de **áudio** e **imagem** renderizados mas **desabilitados** com tooltip "em breve".
- **FR-005**: Ao enviar, MUST abrir `CaptureConversation` (sheet em tela) com fases: `reading` → `reflecting` (reflexo) → resolução; estado `error` com retry.
- **FR-006**: A `CaptureConversation` MUST chamar `POST /api/capture` (003) e, ao resolver, chamar `router.refresh()` para os indicadores subirem.
- **FR-007**: O movimento "pergunta" do reflexo MUST permitir responder via `PATCH /api/entries/:id/enrich` (003); "salvar assim" apenas resolve.
- **FR-008**: O strip de indicadores MUST mostrar N entradas (sempre), X meses (≥2 entradas datadas), Y forças (se há mirror), há Z dias (sempre) com as variações de microcopy sem culpa.
- **FR-009**: O status do espelho MUST seguir `getMirrorStatus(entryCount)`: <4 building, <10 emerging, ≥10 active, com cor/label correspondentes.
- **FR-010**: O `ProactiveInsightCard` MUST renderizar só quando há insight não visto; nunca um card vazio.
- **FR-011**: `RecentEntries` MUST mostrar no máximo 3 entradas com ícone por `source` e expansão in-place.
- **FR-012**: Esta feature MUST criar a tabela `proactive_insights` (+ RLS + índice) e implementar `triggerProactiveInsight(userId)` — preenchendo o stub no-op de 003.
- **FR-013**: A coluna `mirror_snapshots.strength_themes` (criada em 004) MUST ser lida para os indicadores e o contexto.
- **FR-014**: Toda query MUST filtrar por `user_id` (RLS); auth verificada antes de renderizar dados (middleware do 002 + checagem na página).
- **FR-015**: Todas as strings de UI MUST vir de `next-intl` (`src/messages/pt-BR.json`); zero string hardcoded.
- **FR-016**: A UI MUST ser mobile-first (base → `md:`/`lg:`), toques ≥ 48px, micro-interações em CSS, Framer Motion só para entradas/transições do sheet.
- **FR-017**: O painel MUST seguir a identidade Borogodó (tokens de cor, Fraunces nos títulos) e nunca parecer SaaS genérico.

### Key Entities

- **ProactiveInsight** (`proactive_insights`): `type` (`invisible_skill|emerging_pattern|connection|evidence_gap`), `headline`, `body`, `entry_ids[]`, `seen`, `generated_at`, `user_id`.
- Lê: `entries` (003), `mirror_snapshots` (004).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O valor (headline ou estado do espelho) é visível acima da dobra em ≤ 1 s no carregamento.
- **SC-002**: Após uma captura, os indicadores atualizam (router.refresh) em ≤ 1 s percebido.
- **SC-003**: 100% das strings de UI via i18n; zero hardcode (verificado em revisão).
- **SC-004**: Acessibilidade WCAG AA: foco visível, contraste, hierarquia de headings, toques ≥ 48px.
- **SC-005**: Cobertura de testes ≥ 80% nos componentes e na lógica de status/placeholder.
- **SC-006**: Revisado em viewport 375px antes de concluído (mobile-first).

## Assumptions

- Features 003 e 004 mergeadas (capture API, enrich, mirror snapshots, tipos).
- Middleware de auth do 002 protege `/(app)/painel`.
- `/impeccable shape` roda antes de codar a UI; `/impeccable audit` antes do PR (constituição).
- Streaming token-a-token do reflexo está fora do MVP (animação fixa).
- Testes obrigatórios (TDD).
