# Quickstart / Validação — Autoavaliação de Desempenho (019, modelo cockpit)

**Reescrito em 2026-06-19.** Valida o fluxo **cockpit: lembrar → refletir → planejar** —
a pessoa **escreve** a autoavaliação; a IA só ancora em fato e oferece um passo-pra-frente. Detalhes
de modelo em [data-model.md](./data-model.md); contratos em
[contracts/self-assessment.md](./contracts/self-assessment.md).

## Pré-requisitos

- Worktree `019-autoavaliacao` rebaseada na `main` (016 mergeada — gatilho disponível; 017 mergeada —
  `012_entry_title.sql` em `main`, por isso esta feature usa `013`).
- `.env.local` linkado (Anthropic + Supabase).
- Migration **013** aplicada **no dev** (CHECK de `format`/`seed_type`/`status` + colunas de recorrência).
- Conta QA com **entradas distribuídas no tempo** (ver memória `borogodo-qa-test-user`).

## Setup

```bash
cd ../borogodo-019
npm install
# aplicar a migration 013 no projeto dev do Supabase antes de testar
npm run dev
```

## Cenários de validação

### US1 — Lembrar, refletir e escrever a autoavaliação (P1)

1. Logar na conta QA, abrir `/autoavaliacao`.
2. Escolher um preset ("este ano") ou range personalizado.
3. **Recap "o seu ano, em fatos":** aparece **primeiro** — lista factual dos registros do período,
   **cada item com a fonte** (chip clicável), **zero adjetivo**, e **não** uma autoavaliação pronta.
4. **Escrita:** a pessoa escreve nas 4 seções (Entregas / Impacto / Evolução / Pontos a desenvolver)
   em primeira pessoa, com a **trilha de evidências ao lado** e **sentence-stems ancorados no período**.
5. **Assistência da IA:** "reescreve com minhas palavras" reformula só o texto da pessoa; "Não sei por
   onde começar" faz **1 pergunta** cuja resposta vira o rascunho dela; o nudge STAR pergunta "qual foi
   o resultado/número?". **Nunca** insere parágrafo nem dá nota.
6. **Base limitada:** período sem (ou quase sem) entradas → o recap reconhece a base limitada e
   **convida a registrar**; nunca fabrica fatos.
7. **Isolamento:** salvar (`status='draft'`) e conferir no espelho/`entries` que o texto escrito **não**
   aparece como evidência.

```bash
npm run test -- src/lib/ai/content/__tests__/loadSeed.test.ts        # seed por período (mantido)
npm run test -- src/lib/autoavaliacao/__tests__/periodRecap.test.ts  # recap determinístico (novo)
npm run test -- src/lib/ai/content/__tests__/assist.test.ts          # rephrase/unblock/star (novo)
```

### US2 — Um passo à frente, sem ser invasivo (P2)

1. Com uma autoavaliação escrita, pedir o passo-pra-frente → **uma** oferta opcional que **cita o que a
   pessoa escreveu** (não um veredito nem plano imposto).
2. Conferir o plano (GROW Will + 70-20-10, **ação de experiência**) e/ou talking points de 1:1 — todo
   conteúdo **ancorado** no `body`; nada inventado.
3. **Recusar** → segue sem nag, sem badge de incompleto.
4. **Aceitar + definir data de revisão** → grava `review_cycle_*`; essa data (dela) é o único gatilho.
5. **Gatilho de calendário:** ciclo próximo → painel convida a escrever; poucos dados → "registre
   antes"; sem recorrência → nada forçado.

```bash
npm run test -- src/app/api/autoavaliacao/forward-step/__tests__/route.test.ts
npm run test -- src/lib/panel/__tests__/getReviewCycleSignal.test.ts
```

### US3 — Histórico de autoavaliações (P2)

1. Abrir `/autoavaliacao` → ver a lista das anteriores (período + data); reabrir/editar cada uma.
2. Conferir que `entries`/espelho **não** mostram as autoavaliações (isolamento preservado).

```bash
npm run test -- src/components/features/autoavaliacao/__tests__/SelfAssessmentHistory.test.tsx
```

## Critérios de aceite (mapeados aos SC da spec)

> ⚠️ Os SC da spec ainda usam vocabulário do modelo antigo ("2 variações geradas"). Reler à luz do
> cockpit: onde diz "gera", entenda "a pessoa escreve / a IA ancora". Os SC serão reconciliados no
> `/speckit-tasks` ou num clarify rápido se necessário.

- [ ] Recap factual com fonte aparece **antes** da escrita; zero adjetivo (SC-001 reinterpretado).
- [ ] A IA nunca insere bloco nem dá nota; só microssugestão/reescrita/nudge (SC-002/003 reinterpretado).
- [ ] Período sem evidência nunca produz texto fabricado (SC-004).
- [ ] "Pontos a desenvolver" é escrito pela pessoa; o passo-pra-frente nunca inventa fraqueza (SC-005).
- [ ] Gatilho ressurge no painel na recorrência; sem recorrência, nada forçado; sem e-mail (SC-006).
- [ ] Cobertura ≥ 80% nos caminhos novos: recap, assist, forward-step, sinal de ciclo (SC-007).
- [ ] SC-008: validação manual da Ohana — a autoavaliação que **ela escreveu** é material que levaria
      com confiança a um ciclo real (fiel, sem floreio, e **dela**).

## Checkpoint de validação manual

Parar aqui e validar com a Ohana (constituição do colaborador): a cabine de reflexão devolve a autoria
(o texto é dela) sem reintroduzir a página em branco (o recap + stems ancoram)? A IA ajuda sem virar
juiz nem ghostwriter? Só seguir para o PR após o OK.
