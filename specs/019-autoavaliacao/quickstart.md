# Quickstart / Validação — Autoavaliação de Desempenho (019)

Guia de validação end-to-end. Detalhes de modelo em [data-model.md](./data-model.md); contrato em
[contracts/self-assessment.md](./contracts/self-assessment.md).

## Pré-requisitos

- Worktree `019-autoavaliacao` rebaseada na `main` (016 já mergeada — gatilho disponível).
- `.env.local` linkado (Anthropic + Supabase).
- Migration 012 aplicada **no dev** (CHECK de `format` + colunas de recorrência em `profiles`).
- Conta QA com **entradas distribuídas no tempo** (ver memória `borogodo-qa-test-user`).

## Setup

```bash
cd ../borogodo-019
npm install
# aplicar migration 012 no projeto dev do Supabase antes de testar a geração
npm run dev
```

## Cenários de validação

### US1 — Gerar a autoavaliação do período (P1)

1. Logar na conta QA, abrir a tela da autoavaliação.
2. Escolher um preset ("este ano") ou um range personalizado.
3. **Esperado:** 2 variações **estruturadas por seções** (Entregas / Impacto / Evolução / Pontos a
   desenvolver) que **agregam as entradas do intervalo**, cada afirmação ancorada em evidência real,
   **sem número inventado**, passando no ruleset anti-IA.
4. **Pontos a desenvolver:** conferir que derivam de sinal honesto (força "Emergente" / tema com
   pouca evidência) ou de intenção informada — **nunca** fraqueza inventada.
5. **Base limitada:** escolher um período sem (ou quase sem) entradas → o sistema reconhece a base
   limitada e **convida a registrar**, sem fabricar autoavaliação.

```bash
npm run test -- src/lib/ai/content/__tests__/loadSeed.test.ts
npm run test -- src/lib/ai/content/__tests__/generateDraft.test.ts
npm run test -- src/lib/ai/content/__tests__/schemas.test.ts
```

### US2 — Gatilho de calendário no painel (P2, reusa 016)

1. Configurar `review_cycle_months` + `review_cycle_anchor` na conta QA para um ciclo **próximo**.
2. Abrir o painel → **esperado:** convite à autoavaliação ancorado no calendário, sem linguagem de
   cobrança e **sem e-mail**.
3. Editar a recorrência → o gatilho passa a respeitar a nova recorrência.
4. Ciclo próximo **com poucos dados recentes** → o convite é "registre antes" (alimentar), não "gere
   uma autoavaliação magra".
5. Sem recorrência configurada → **nada é forçado**; a geração sob demanda (US1) segue disponível.

```bash
npm run test -- src/lib/panel/__tests__/getReviewCycleSignal.test.ts
```

### US3 — Ajustar, copiar, levar (P2, reuso 013)

1. Com 2 versões geradas, **editar** uma → reflete e marca `edited`.
2. Aplicar um **chip** ("mais conciso") → texto encurta mantendo a evidência e passando no anti-IA.
3. **Copiar** → vai para a área de transferência e marca `copied`.

## Critérios de aceite (mapeados aos SC da spec)

- [ ] SC-001: período com N entradas → 2 autoavaliações estruturadas, ancoradas, sem número inventado.
- [ ] SC-002: 100% passam no ruleset (após no máx. 1 regeneração).
- [ ] SC-003: o mesmo `generateDraft` atende trocando só prompt + schema (sem caminho paralelo).
- [ ] SC-004: período sem evidência nunca produz autoavaliação fabricada.
- [ ] SC-005: "pontos a desenvolver" só com itens ancorados — zero fraqueza inventada.
- [ ] SC-006: gatilho ressurge no painel na recorrência; sem recorrência, nada forçado; sem e-mail.
- [ ] SC-007: cobertura ≥ 80% nos caminhos novos.
- [ ] SC-008: validação manual da Ohana — material que ela levaria com confiança a um ciclo real.

## Checkpoint de validação manual

Parar aqui e validar com a Ohana (constituição do colaborador): a autoavaliação gerada do ano real é
fiel e sem floreio? Só seguir para o PR após o OK.
