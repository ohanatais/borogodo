# Data Model — Autoavaliação de Desempenho (019, modelo cockpit)

**Reescrito em 2026-06-19.** As mudanças seguem **aditivas**: novo `format`/`seed_type`/`status` em
`drafts` e duas colunas de recorrência em `profiles`. Nenhuma tabela nova. A diferença do modelo
anterior: o `body` guarda o texto **escrito pela pessoa** (não a saída do LLM), e o passo-pra-frente
da IA vive em `qa.forwardStep`.

## Entidades

### Draft (`drafts`) — evolução, sem nova coluna

Reusa a tabela e a RLS. Isolada de `entries`/espelho por design (a interpretação da pessoa não vaza
como fato — estratégia §3, guarda-corpos).

- **`format`**: passa a aceitar `'self_assessment'` (CHECK estendido na migration 013).
- **`seed_type`**: passa a aceitar `'period'`.
- **`seed_ref`**: para `period`, codifica o intervalo (`period:::<from>:::<to>`, datas ISO), validado
  por `parsePeriodSeedRef`.
- **`status`**: passa a aceitar `'draft'` — a autoavaliação **escrita pela pessoa** nasce `draft`
  (rascunho autorado), depois `copied`/`discarded`. **Nunca** `generated` (ninguém gera).
- **`body`**: o texto **escrito pela pessoa**, estruturado por seções (Entregas / Impacto / Evolução /
  Pontos a desenvolver) como texto puro com cabeçalhos. **Não** passa pelo ruleset anti-IA (é texto
  humano, não saída de modelo).
- **`qa`** (jsonb): para `self_assessment`, guarda o **passo-pra-frente** opcional gerado pela IA
  (`qa.forwardStep`, ver abaixo). Vazio se a pessoa recusou a oferta.
- **`angle` / `voice_feedback`**: não usados neste formato.

### PeriodSeed (conceitual — loader `loadPeriodSeed`, já existe)

Evidência agregada de um **intervalo de datas**. Alimenta **o recap** e a **trilha de evidências** da
superfície de escrita (não mais uma geração).

- **Entrada:** `userId`, `from` (ISO), `to` (ISO).
- **Fonte:** `entries` do usuário no intervalo (`entry_date` quando houver, senão `created_at`),
  escopada por `user_id` (RLS).
- **Limite seguro:** `MAX_PERIOD_EVIDENCE = 50` (já definido em `loadSeed.ts`), priorizando as
  entradas mais recentes/relevantes — não estoura o contexto nem a UI.
- **Saída:** `SeedEvidence { seedSummary, evidence: EvidenceItem[] }`. Cada `EvidenceItem` carrega a
  referência da `entry` de origem — é a **fonte** do chip no recap (D2) e o que a trilha cita (D3).
- **Validação:** range válido (`from <= to`, datas ISO reais); intervalo vazio → `evidence: []`, que a
  UI trata como **base limitada** (convida a registrar, não fabrica — FR-006).

### Recap "o seu ano, em fatos" (conceitual — derivado, não persistido)

Transformação **determinística** de apresentação sobre `SeedEvidence.evidence[]` (D2). Cada item =
um registro do período + sua fonte (chip clicável). Sem LLM, sem adjetivo, não persistido — recalculado
a partir do seed quando a pessoa abre o período.

### ForwardStep (conceitual — `drafts.qa.forwardStep`, gerado pela IA)

O passo-pra-frente opcional (US2 do redesign), ancorado nas palavras da pessoa (D5). Shape sugerido:

```jsonc
{
  "forwardStep": {
    "kind": "action_plan" | "one_on_one_prep",
    "anchoredOn": ["<trecho citado do que a pessoa escreveu>"],
    "actionPlan": {                 // quando kind = action_plan (GROW Will + 70-20-10)
      "area": "<área que a PESSOA escreveu querer afiar>",
      "experienceAction": "<uma ação de experiência, não curso>",
      "commitmentQuestion": "<pergunta GROW de compromisso>"
    },
    "talkingPoints": ["<ponto p/ a conversa com o gestor>"],  // quando kind = one_on_one_prep
    "generatedAt": "<ISO>"
  }
}
```

- **Guarda-corpo:** todo conteúdo deriva **só** do `body` escrito pela pessoa; `anchoredOn` registra os
  trechos-fonte. Passa pelo ruleset anti-IA + checagem anti-invenção antes de persistir (é a única IA
  geradora da feature).

### ReviewCycle / Recorrência (`profiles` — colunas aditivas)

Config 1:1 com o usuário para o gatilho de calendário (US2).

- **`review_cycle_months`** `smallint`, nullable — periodicidade. Default conceitual trimestral/
  semestral, **editável**. `null` = sem recorrência (gatilho não dispara).
- **`review_cycle_anchor`** `date`, nullable — âncora do cálculo do próximo ciclo (a data que **a
  pessoa** define ao aceitar o plano).
- **Regra:** sem `review_cycle_months`/`anchor` → `getReviewCycleSignal` devolve `{ type: 'none' }`;
  escrita sob demanda (US1) sempre disponível (FR-009).

### DevelopmentArea (conceitual — seção escrita pela pessoa)

"Pontos a desenvolver" é uma **seção do `body` escrita pela pessoa**, não uma inferência da IA. O nudge
STAR e o passo-pra-frente podem ancorar nela, mas **nunca** a IA inventa uma fraqueza (FR-005).

## Migration 013

`supabase/migrations/013_self_assessment_and_review_cycle.sql` — aditiva, idempotente. Estende três
CHECKs de `drafts` (`format` += `self_assessment`, `seed_type` += `period`, `status` += `draft`) e
adiciona `profiles.review_cycle_months` + `review_cycle_anchor`. Número **013** resolve a colisão com
`012_entry_title.sql` (017, já em `main`) — ver research D9.

## Tipos (`src/types/content.ts`)

```ts
export type DraftFormat = 'post' | 'impact_summary' | 'mini_bio' | 'self_assessment'
export type SeedType = 'entry' | 'theme' | 'project' | 'period'
export type DraftStatus = 'draft' | 'generated' | 'edited' | 'copied' | 'discarded'
// + ForwardStep (qa.forwardStep) tipado para o passo-pra-frente
```
