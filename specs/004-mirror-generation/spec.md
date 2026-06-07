# Feature Specification: Geração do Espelho (Primeira + Atualização Viva)

**Feature Branch**: `004-mirror-generation`

**Created**: 2026-06-07

**Status**: Draft

**Input**: A síntese profunda do Borogodó — a leitura de quem a pessoa é profissionalmente, com evidência real. Primeira geração ao fim do onboarding; atualização viva por limiar conforme a pessoa captura. Usa `claude-sonnet-4-6`. Fonte: `docs/mvp/005-first-mirror.md`.

## Clarifications

### Session 2026-06-07

- Q: Esta feature inclui a UI de revelação (`/onboarding/espelho`)? → A: **Não**. A revelação progressiva (componente `MirrorReveal`) é UI e pertence à feature 006-onboarding. Esta feature entrega o **serviço** (geração, persistência, regeneração) + a rota `/api/mirror/generate`.
- Q: De onde vêm `entries` e os tipos? → A: Da feature **003-capture-pipeline** (tabela `entries`, tipos `Entry`). Esta feature deve ser implementada **após** 003 estar mergeada (rebase em `main`).
- Q: Onde o `maybeRegenerateMirror` é chamado? → A: No `/api/capture` (003), que já tem a costura (stub no-op). Esta feature **preenche** o corpo do stub — sem mudar a assinatura da rota.
- Q: Regeneração roda fora do request HTTP — como respeitar RLS? → A: Usa o client `service_role` server-side, **sempre filtrando `user_id`** explicitamente em toda query. Nunca mistura dados de usuários.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Primeira geração do espelho (Priority: P1)

Ao fim do onboarding, com as primeiras entradas capturadas, o sistema gera o **primeiro espelho**: força principal (com citação real), skill invisível, padrão de contexto, pergunta honesta, e 3–6 temas de força (`strength_themes`). É o momento "aha" do produto. A rota `/api/mirror/generate` produz e persiste o snapshot e marca `onboarding_completed = true`.

**Why this priority**: É o payoff que justifica o onboarding. Sem ele, a captura não vira revelação.

**Independent Test**: Com ≥ 1 entrada do usuário, chamar `/api/mirror/generate` e verificar que um `mirror_snapshots` é persistido com `mirror` (jsonb), `strength_themes` e `primary_strength`.

**Acceptance Scenarios**:

1. **Given** usuário autenticado com entradas, **When** chama `/api/mirror/generate`, **Then** um snapshot é criado (Sonnet), validado por Zod, e `onboarding_completed` vira `true`
2. **Given** usuário sem nenhuma entrada, **When** chama, **Then** erro claro "Sem entradas" (não gera snapshot vazio)
3. **Given** o Sonnet retorna JSON inválido, **When** valida, **Then** erro; nada parcial persistido
4. **Given** com 1 entrada só, **When** gera, **Then** ainda gera; a `intro` reconhece "primeiro vislumbre"

---

### User Story 2 — Atualização viva por limiar (Priority: P2)

Conforme a pessoa captura no painel, o espelho regenera **a cada 3 novas entradas** (em background, sem bloquear a captura). Os `strength_themes` atualizados voltam a alimentar o contexto da próxima captura (loop com 003/004).

**Why this priority**: Entrega a sensação de "ver o espelho evoluir" sem custo a cada frase. Fecha o loop captura↔espelho.

**Independent Test**: Simular `newTotal - lastCount ≥ 3` e verificar que `generateAndSaveMirror` é chamado; abaixo do limiar, não.

**Acceptance Scenarios**:

1. **Given** o último snapshot tem `entry_count = N`, **When** o total chega a `N+3`, **Then** `maybeRegenerateMirror` dispara `generateAndSaveMirror`
2. **Given** o total subiu só `+1` ou `+2`, **When** captura, **Then** **não** regenera (mantém snapshot atual)
3. **Given** a regeneração (background) falha, **When** ocorre o erro, **Then** o snapshot anterior é mantido e o erro é logado (sem dados do usuário); a captura não é afetada
4. **Given** uma regeneração em andamento, **When** o usuário lê o espelho, **Then** vê o snapshot atual (a UI pode indicar "atualizando" — implementado em 005/006)

---

### Edge Cases

- < 2 entradas → gera mesmo assim; `intro` reconhece o início.
- Regeneração falha em background → mantém snapshot anterior; tenta na próxima captura.
- Feedback "nem tanto" do usuário (capturado pela UI 006) → salvo em `resonated/feedback_text`; **não** regera no v1.
- Concorrência: duas regenerações disparadas quase juntas → idempotência aceitável no MVP (último snapshot vence); não há lock.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor `POST /api/mirror/generate` que gera, valida e persiste um `mirror_snapshots` para o usuário autenticado.
- **FR-002**: A geração MUST usar `claude-sonnet-4-6` (Princípio III) — único uso de Sonnet no MVP.
- **FR-003**: O sistema MUST ler até 20 entradas recentes do usuário e montar o prompt com `what_i_did`, `company`, `role_title`, `tags`, `impact`, `metric`.
- **FR-004**: A saída do Sonnet MUST ser validada por Zod antes de persistir (intro, primary_strength, invisible_skill, context_pattern, closing_question, strength_themes 3–6).
- **FR-005**: `generateAndSaveMirror` MUST persistir `mirror` (jsonb), `primary_strength` (jsonb), `strength_themes` (text[]) e `entry_count`.
- **FR-006**: `/api/mirror/generate` MUST marcar `profiles.onboarding_completed = true` ao concluir.
- **FR-007**: `maybeRegenerateMirror(userId, newTotal)` MUST regenerar quando `newTotal - lastCount ≥ 3` (`REGEN_EVERY = 3`), senão não-op.
- **FR-008**: `maybeRegenerateMirror` MUST ser ligado no `/api/capture` (003) substituindo o stub no-op, sem alterar a assinatura/comportamento da rota.
- **FR-009**: Regeneração em background MUST tratar erro logando (sem dados do usuário) e preservando o snapshot anterior; nunca quebra a captura.
- **FR-010**: Toda query MUST filtrar por `user_id`; jobs fora do request usam `service_role` com filtro explícito; RLS ativa no acesso via request.
- **FR-011**: O sistema MUST permitir gravar feedback do espelho (`resonated`, `feedback_text`) — a UI vem em 006; aqui expõe a operação de update.
- **FR-012**: Nenhum dado de outro usuário MUST entrar no contexto do Sonnet.

### Key Entities

- **MirrorSnapshot** (`mirror_snapshots`): `mirror` (jsonb completo), `primary_strength` (jsonb), `strength_themes` (text[]), `entry_count` (int), `generated_at`, `resonated` (bool), `feedback_text`, `user_id`.
- **Mirror** (estrutura jsonb): `intro`, `primary_strength{headline,evidence}`, `invisible_skill{...}`, `context_pattern{...}`, `closing_question`, `strength_themes[]`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Primeira geração retorna snapshot válido em ≤ 8 s (p95) para 5–10 entradas.
- **SC-002**: 100% dos snapshots persistidos passaram por validação Zod.
- **SC-003**: Custo por geração ≈ US$ 0,012 (Sonnet, ~3k in + 700 out).
- **SC-004**: Regeneração dispara exatamente no limiar (a cada 3) — verificado por teste.
- **SC-005**: Cobertura de testes ≥ 80% nos módulos de geração/validação/limiar.
- **SC-006**: Zero vazamento entre usuários no contexto de geração (teste multiusuário).

## Assumptions

- Feature 003 está mergeada: tabela `entries`, tipos `Entry`, e o stub `maybeRegenerateMirror`.
- `profiles` (do 002) tem ou ganhará a coluna `onboarding_completed` (boolean). Confirmar; se ausente, migration mínima nesta feature.
- A UI de revelação e o estado "atualizando" são responsabilidade de 005/006.
- `ANTHROPIC_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` disponíveis server-side.
- Testes obrigatórios (TDD).
