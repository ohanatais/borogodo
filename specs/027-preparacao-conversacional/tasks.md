# Tasks: Preparação Conversacional

## Phase 1: Setup

- [ ] T001 Criar migration via Supabase CLI para `preparations`, `preparation_events` e `shared_chat_feedback` em `supabase/migrations/`
- [ ] T002 [P] Criar tipos e schemas do domínio em `src/types/preparation.ts`
- [ ] T003 [P] Adicionar chaves i18n espelhadas em `src/messages/pt-BR.json` e `src/messages/en.json`

## Phase 2: Foundational

- [ ] T004 Escrever testes RED dos helpers e validações de preparação em `src/lib/db/__tests__/preparations.test.ts`
- [ ] T005 Implementar queries privadas e mapeamento em `src/lib/db/preparations.ts`
- [ ] T006 Escrever testes RED dos contratos de API em `src/app/api/preparations/__tests__/route.test.ts`, `src/app/api/preparation-events/__tests__/route.test.ts` e `src/app/api/chat/share/__tests__/route.test.ts`
- [ ] T007 Implementar `GET/POST /api/preparations` em `src/app/api/preparations/route.ts`
- [ ] T008 Implementar `DELETE /api/preparations/[id]` em `src/app/api/preparations/[id]/route.ts`
- [ ] T009 Implementar telemetria com allowlist sem texto em `src/app/api/preparation-events/route.ts`
- [ ] T010 Implementar compartilhamento consentido em `src/app/api/chat/share/route.ts`

## Phase 3: User Story 1 — Conversa contextual direta (P1)

**Independent test**: escolher cada momento abre o chat ampliado com sua pergunta local e zero chamada de IA antes da resposta.

- [ ] T011 [P] [US1] Escrever testes RED do catálogo de intake em `src/lib/content/__tests__/intentions.test.ts`
- [ ] T012 [P] [US1] Escrever testes RED da abertura direta em `src/components/features/presenca/__tests__/UsarLaunchpad.test.tsx`
- [ ] T013 [P] [US1] Escrever testes RED do layout e intake em `src/components/features/chat/__tests__/ChatSheet.test.tsx`
- [ ] T014 [US1] Estender catálogo de perguntas por momento em `src/lib/content/intentions.ts`
- [ ] T015 [US1] Remover bifurcação e abrir chat diretamente em `src/components/features/presenca/UsarLaunchpad.tsx`
- [ ] T016 [US1] Remover componente órfão `src/components/features/presenca/PrepararMomento.tsx`
- [ ] T017 [US1] Criar intake local em `src/components/features/chat/PreparationIntake.tsx`
- [ ] T018 [US1] Ampliar ChatSheet por contexto, full-screen mobile e 760 px desktop em `src/components/features/chat/ChatSheet.tsx`
- [ ] T019 [US1] Ajustar prompt de preparação para perguntar antes de concluir em `src/lib/ai/chat/prompts/careerChat.ts`

## Phase 4: User Story 2 — Evidências reais e clicáveis (P1)

**Independent test**: resposta mostra somente refs declaradas, com métrica, impacto, link e imagem quando existentes.

- [ ] T020 [P] [US2] Escrever testes RED de `evidenceRefs` e interseção segura em `src/lib/ai/chat/__tests__/answerCareerQuestion.test.ts`
- [ ] T021 [P] [US2] Escrever testes RED dos cards em `src/components/features/chat/__tests__/ChatEvidenceList.test.tsx`
- [ ] T022 [US2] Enriquecer busca e Citation com provas e query contextual acumulada em `src/lib/ai/chat/answerCareerQuestion.ts`
- [ ] T023 [US2] Exigir `evidenceRefs` no bloco estruturado em `src/lib/ai/chat/prompts/careerChat.ts`
- [ ] T024 [US2] Atualizar SSE e schemas do chat em `src/app/api/chat/route.ts` e `src/components/features/chat/ChatSheet.tsx`
- [ ] T025 [US2] Criar lista de evidências em `src/components/features/chat/ChatEvidenceList.tsx`
- [ ] T026 [US2] Criar card com prova visual/link em `src/components/features/chat/ChatEvidenceCard.tsx`
- [ ] T027 [US2] Integrar evidências e abertura de registro em `src/components/features/chat/ChatMessage.tsx`

## Phase 5: User Story 3 — Preparação salva (P2)

**Independent test**: salvar uma resposta cria item recuperável; fechar chat perde mensagens; excluir remove somente o próprio item.

- [ ] T028 [P] [US3] Escrever testes RED do botão de salvar em `src/components/features/chat/__tests__/SavePreparationButton.test.tsx`
- [ ] T029 [P] [US3] Escrever testes RED da lista em `src/components/features/presenca/__tests__/SavedPreparations.test.tsx`
- [ ] T030 [US3] Criar `SavePreparationButton` em `src/components/features/chat/SavePreparationButton.tsx`
- [ ] T031 [US3] Integrar salvamento somente no modo preparação em `src/components/features/chat/ChatMessage.tsx` e `src/components/features/chat/ChatSheet.tsx`
- [ ] T032 [US3] Criar lista/abertura/exclusão em `src/components/features/presenca/SavedPreparations.tsx`
- [ ] T033 [US3] Carregar preparações no servidor em `src/app/[locale]/(app)/presenca/page.tsx` e `src/components/features/presenca/RepertorioContent.tsx`

## Phase 6: User Story 4 — Navegação coerente (P2)

**Independent test**: Autoavaliação está no grupo Usar desktop/mobile e não aparece entre momentos.

- [ ] T034 [P] [US4] Escrever testes RED de desktop/mobile em `src/components/layout/__tests__/navModel.test.ts` e `src/components/layout/__tests__/AppShellClient.test.tsx`
- [ ] T035 [US4] Adicionar Autoavaliação ao grupo Usar em `src/components/layout/navModel.ts` e `src/components/layout/AppShellClient.tsx`
- [ ] T036 [US4] Confirmar remoção da Autoavaliação do launchpad em `src/components/features/presenca/UsarLaunchpad.tsx`

## Phase 7: User Story 5 — Aprendizado com privacidade (P3)

**Independent test**: eventos rejeitam texto e share só persiste após confirmação explícita.

- [ ] T037 [P] [US5] Escrever testes RED do cliente de eventos em `src/lib/preparation/__tests__/trackPreparationEvent.test.ts`
- [ ] T038 [P] [US5] Escrever testes RED do consentimento em `src/components/features/chat/__tests__/ShareConversationDialog.test.tsx`
- [ ] T039 [US5] Implementar cliente best-effort sem texto em `src/lib/preparation/trackPreparationEvent.ts`
- [ ] T040 [US5] Integrar eventos de seleção, contexto, evidência e salvamento nos componentes da jornada
- [ ] T041 [US5] Criar confirmação opt-in em `src/components/features/chat/ShareConversationDialog.tsx`
- [ ] T042 [US5] Integrar compartilhamento explícito ao feedback do chat em `src/components/features/chat/ChatSheet.tsx`

## Phase 8: Polish & Cross-Cutting

- [ ] T043 Atualizar termos/privacidade sobre preparação salva, telemetria e share em `src/messages/pt-BR.json`, `src/messages/en.json` e superfícies da feature 024
- [ ] T044 Validar RLS e migration com Supabase local ou análise SQL documentada
- [ ] T045 Rodar testes direcionados, suíte completa, lint e typecheck; corrigir regressões
- [ ] T046 Executar auditoria Impeccable em 375 px e desktop, incluindo teclado, foco, dark mode, overflow e provas visuais
- [ ] T047 Executar quickstart ponta a ponta e registrar resultados em `specs/027-preparacao-conversacional/quickstart.md`

## Dependencies

`Setup → Foundational → US1 → US2 → US3`; US4 pode ocorrer após Foundational; US5 depende de US1/US2/US3 para instrumentar ações reais. Polish depende de todas.

## Parallel Opportunities

- T002 e T003; testes T011–T013; testes T020–T021; testes T028–T029; testes T037–T038.
- US4 pode avançar em paralelo a US2/US3 por tocar principalmente navegação.

## Implementation Strategy

MVP operacional é US1 + US2: conversa contextual e evidências honestas. US3 adiciona continuidade
sem histórico; US4 corrige IA; US5 dá observabilidade segura. Cada fase mantém o app utilizável e
é validada antes da seguinte.
