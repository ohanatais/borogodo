---
description: "Task list — Repertório (017)"
---

# Tasks: Repertório — camada "Usar" por intenção

**Input**: `specs/017-repertorio-intencao/` (spec.md, plan.md, research.md, data-model.md, quickstart.md)

**Tests**: incluídos — a constituição exige TDD (RED→GREEN) e cobertura ≥80%. Escreva o teste
primeiro e veja-o falhar antes de implementar.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência).
- **[Story]**: US1..US4 conforme spec; FND = fundação compartilhada.

---

## Phase 1: Foundational (compartilhado — bloqueia as histórias)

- [x] T001 [P] [FND] Criar `src/lib/content/intentions.ts`: `type Hub = 'mostrar'|'preparar'`;
  `type PrepMoment = 'entrevista'|'review'|'salario'`;
  `PREP_MOMENTS: Record<PrepMoment, { angleHint: string; labelKey: string; starters: string[] }>`;
  `isPrepMoment(x): x is PrepMoment`. Testes em `src/lib/content/__tests__/intentions.test.ts`
  (mapa completo, narrowing). **TDD: teste primeiro.**
- [x] T002 [FND] i18n: adicionar chaves novas em `src/messages/pt-BR.json` (+ stub `en.json`):
  nome "Repertório" (nav + header), títulos+exemplos dos hubs, rótulos dos momentos, textos da
  bifurcação ("Quero algo pronto agora" / "Quero treinar conversando"), copy do convite do Painel,
  botão "Criar minha bio". Convenções da Ohana (sem travessão/barra/fragmentação).

**Checkpoint**: tipos e cópia disponíveis para as histórias.

---

## Phase 2: User Story 1 — Repertório por intenção (P1) 🎯 MVP

**Goal**: a seção vira "Repertório" com dois hubs + "Meus rascunhos" preservado.

- [x] T003 [US1] `src/components/layout/AppShellClient.tsx`: label do item `presenca` em
  `NAV_ITEMS` "Presença" → "Repertório" (path `/presenca` intacto).
- [x] T004 [P] [US1] Criar `src/components/features/presenca/UsarLaunchpad.tsx`: duas seções com
  título+exemplos — MOSTRAR (cards Post, Bio) e PREPARAR (cards Entrevista, Review, Salário; o
  clique abre a tela de momento da US2). Cards Mostrar disparam `openPresenca` (Post→`['post']`;
  Bio→`['mini_bio']`, reusando `PresencaCreate` p/ escolher tema quando houver +1). Âncoras
  `id="mostrar"`/`id="preparar"`. Máx. 3–4 cards/hub. Testes em `__tests__/UsarLaunchpad.test.tsx`
  (dois hubs; Post/Bio disparam evento certo). **TDD: teste primeiro.**
- [x] T005 [US1] `src/app/[locale]/(app)/presenca/page.tsx`: cabeçalho/`metadata.title` "Repertório";
  montar `UsarLaunchpad` acima do `PresencaHub` (sub-seção "Meus rascunhos") reusando
  `themes`/`entrySeeds` já carregados. Sem regressão no hub.

**Checkpoint US1**: Repertório abre com dois hubs + rascunhos antigos intactos; Post/Bio funcionam.

---

## Phase 3: User Story 2 — Preparar momento, pronto ou conversando (P1)

**Goal**: cada momento oferece "pronto" (resumo com ângulo) e "conversar" (chat enquadrado).

- [x] T006 [US2] `src/components/features/content/presencaEvents.ts`: `PresencaOpenDetail` ganha
  `angle?: string` e `moment?: PrepMoment`.
- [x] T007 [US2] `src/components/features/content/GenerateSheet.tsx`: `generate()` envia
  `angle: detail.angle` no body quando presente (preservado em troca de formato/regenerar/adjust);
  passa `moment={detail.moment}` a cada `DraftCard`. Teste: com `detail.angle`, o POST inclui
  `angle` (mock do fetch). **TDD: teste primeiro.**
- [x] T008 [US2] `src/components/features/content/DraftCard.tsx`: prop `moment?: PrepMoment`; em
  `ensureSaved`, `qa: { angle, evidenceRefs, ...(moment ? { moment } : {}) }`. Teste: `moment`
  inclui `qa.moment` no `createDraft`. **TDD: teste primeiro.**
- [x] T009 [US2] Contexto `preparacao` no chat (3 pontos): `ChatContext` (+`'preparacao'`,
  `moment?`) em `src/lib/ai/chat/answerCareerQuestion.ts`; zod `context` em
  `src/app/api/chat/route.ts` (+enum, `moment` opcional); `ChatOpenDetail` + branch de título em
  `src/components/features/chat/ChatSheet.tsx`. Teste: zod aceita `{type:'preparacao',moment}` e
  rejeita momento inválido. **TDD: teste primeiro.**
- [x] T010 [US2] `src/lib/ai/chat/prompts/careerChat.ts`: `CareerChatContext` +`prepMoment?`;
  injeta enquadramento do momento. `answerCareerQuestion` repassa `prepMoment` quando
  `type==='preparacao'`. Teste: prompt contém o enquadramento do momento. **TDD: teste primeiro.**
- [x] T011 [US2] `src/components/features/chat/StarterPrompts.tsx`: aceitar `context`/`moment`; em
  `preparacao` usar `PREP_MOMENTS[m].starters` (sem fetch). Teste: starters do momento sem chamar a
  rota. **TDD: teste primeiro.**
- [x] T012 [US2] Criar `src/components/features/presenca/PrepararMomento.tsx`: ao escolher um
  momento, dois caminhos (default em destaque = "Quero algo pronto agora" →
  `openPresenca({seedType:'theme',seedRef:<tema>,formats:['impact_summary'],angle:angleHint,moment})`;
  "Quero treinar conversando" → `openChatSheet({context:{type:'preparacao',moment}})`). Ligar ao
  `UsarLaunchpad`. Testes em `__tests__/PrepararMomento.test.tsx` (cada caminho dispara o evento
  certo). **TDD: teste primeiro.**

**Checkpoint US2**: os 3 momentos entregam ambos os caminhos; rascunho de preparação grava
`qa.moment`.

---

## Phase 4: User Story 3 — Convite no Painel (P2)

- [x] T013 [P] [US3] Criar `src/components/features/painel/UsarInvite.tsx`: dois cards (frase +
  exemplos) com `Link` p/ `/presenca` (âncoras opcionais). Segue o idioma visual do Painel. Testes
  em `__tests__/UsarInvite.test.tsx` (renderiza dois cards com link correto). **TDD: teste primeiro.**
- [x] T014 [US3] `src/app/[locale]/(app)/painel/page.tsx`: montar `UsarInvite` no ramo populado
  (`entryCount > 0`), logo após `<BorogodoCard />`. Ramo vazio inalterado. Ajustar/extender
  `__tests__/page.test.tsx` (convite só com entradas).

**Checkpoint US3**: Painel com histórico mostra o convite; sem histórico, não.

---

## Phase 5: User Story 4 — Bio no Espelho (P3)

- [x] T015 [US4] `src/components/features/espelho/MirrorContent.tsx`: botão "Criar minha bio" perto
  do resumo/temas → `openPresenca({seedType:'theme',seedRef:strength_themes[0],formats:['mini_bio']})`;
  oculto se sem temas. Teste em `__tests__/MirrorContent.test.tsx` (dispara evento certo; ausente
  sem temas). **TDD: teste primeiro.**

**Checkpoint US4**: bio gerável a partir do Espelho.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T016 [P] Revisão de i18n (pt-BR/en) e a11y dos componentes novos (alvos ≥48px, aria-labels,
  foco em Dialog) conforme padrões existentes.
- [ ] T017 `npm test` (suites novas + regressão, ≥80%), `npm run build`, `npx tsc --noEmit`.
- [ ] T018 `/impeccable audit` + web-design-guidelines nos componentes novos antes do PR.
- [ ] T019 Atualizar bloco de status no `CLAUDE.md`; propor entrada em `docs/aprendizados.md`
  (reorganizar IA por intenção sem tocar motor nem schema) — decisão de incluir é da Ohana.

---

## Dependencies & Execution Order

- **Phase 1 (FND)** bloqueia tudo. T001 e T002 podem ir em paralelo? T002 (messages) é independente
  de T001 — ambos [P] entre si.
- **US1 (P1)** depois da FND. T004 [P]; T003/T005 tocam arquivos próprios.
- **US2 (P1)** depois da FND; T006→T007/T008 (mesma cadeia de evento); T009/T010 (chat) podem ir em
  paralelo a T007/T008; T012 depende de T006 e do `UsarLaunchpad` (US1).
- **US3 (P2)** e **US4 (P3)** independentes entre si; só dependem da FND (e US3 referencia o
  destino `/presenca` da US1).
- **Polish** por último.

## Notas
- Marcar `[x]` aqui ao concluir cada task (hook Stop exige tasks.md atualizado quando `src/` muda).
- Commit por task ou grupo lógico; `/code-review` ao fim de cada fase.
