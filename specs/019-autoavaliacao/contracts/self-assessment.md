# Contracts — Autoavaliação de Desempenho (019, modelo cockpit)

**Reescrito em 2026-06-19.** A autoavaliação **não é mais gerada** — a pessoa escreve. A rota
`POST /api/content/generate` **deixa de aceitar** `format: self_assessment` (ver research D1). Os
contratos abaixo são os da cabine de reflexão: recap factual → escrita assistida → passo-pra-frente.

Convenções gerais (constituição I): **auth-first** em toda rota; todo input validado/sanitizado por
Zod antes de qualquer LLM; o período é validado como **do usuário** (RLS) antes de carregar evidência;
o contexto de IA **nunca** inclui dado de outro usuário; sem ID interno vazado.

---

## 1. Recap "o seu ano, em fatos" — `loadPeriodRecap` (server, determinístico)

Não é rota HTTP nova: é um **loader de servidor** (RSC) que transforma `loadPeriodSeed` no recap
factual (research D2). Sem LLM.

**Input:** `userId` (sessão), `from` (ISO), `to` (ISO) — presets resolvidos no servidor para o range.

**Output:**

```ts
interface PeriodRecap {
  items: Array<{
    text: string          // o registro, factual, sem adjetivo
    sourceEntryId: string // a entry de origem → chip clicável
    occurredAt: string    // ISO (entry_date ou created_at)
  }>
  isLimited: boolean      // true quando evidence: [] → base limitada (FR-006)
}
```

- `isLimited` → a UI convida a registrar; **nunca** fabrica itens.

## 2. Superfície de escrita assistida — `POST /api/autoavaliacao/assist`

As três ajudas in-flow (research D3). **Nunca** gera o bloco da autoavaliação; opera sobre o texto da
pessoa ou apenas pergunta. A pessoa aceita/rejeita/edita o retorno (provenance-at-decision).

**Request:**

```jsonc
{
  "mode": "rephrase" | "unblock" | "star_nudge",
  "text": "<a frase que a PESSOA escreveu>",      // rephrase / star_nudge
  "section": "entregas" | "impacto" | "evolucao" | "pontos_a_desenvolver",
  "seedRef": "period:::2025-01-01:::2025-12-31"    // para ancorar no período (unblock)
}
```

**Response 200:**

```jsonc
// mode = rephrase → reescrita na voz da pessoa, sem fato novo
{ "mode": "rephrase", "suggestion": "<reescrita>" }

// mode = unblock → UMA pergunta ancorada no recap (a resposta vira rascunho DELA)
{ "mode": "unblock", "question": "<1 pergunta>" }

// mode = star_nudge → pergunta de impacto/resultado (heurística; nunca propõe o número)
{ "mode": "star_nudge", "prompt": "qual foi o resultado / número / antes-depois?" }
```

- **Modelos:** `rephrase`/`unblock` → `claude-sonnet-4-6` (voz). `star_nudge` → heurística
  determinística (sem LLM no v1).
- **Anti-invenção:** `rephrase` só reformula `text`; `unblock` só pergunta; `star_nudge` só sinaliza.
  Nenhum modo retorna afirmação factual nova.

**Erros:** `401 unauthorized`; `400 invalid_request` (mode/section inválido, `text` vazio em rephrase);
`422 assist_failed` (saída do LLM violou anti-IA após 1 retry — degrada para "sem sugestão", não bloqueia
a escrita); `500 internal_error`.

## 3. Passo-pra-frente — `POST /api/autoavaliacao/forward-step`

Oferta **única, opcional**, ancorada nas palavras da pessoa (research D5). Única IA geradora da feature
→ guarda-corpo mais forte.

**Request:**

```jsonc
{
  "draftId": "<id da autoavaliação escrita>",
  "kind": "action_plan" | "one_on_one_prep"
}
```

**Response 200:** o objeto `ForwardStep` (ver data-model `qa.forwardStep`), já persistido em
`drafts.qa.forwardStep` do draft.

- **Modelo:** `claude-sonnet-4-6`. **Insumo:** **apenas** o `body` que a pessoa escreveu (lido do draft,
  escopado por `user_id`). `anchoredOn` cita os trechos-fonte.
- **Anti-invenção (bloqueante):** se a saída inventar área de desenvolvimento ou inflar caso sem lastro
  no `body`, falha o ruleset → 1 retry → `422`. Nunca persiste conteúdo não-ancorado.

**Erros:** `401`; `404 draft_not_found` (não é do usuário); `422 generation_failed`; `500`.

## 4. Persistência da autoavaliação escrita (reuso de `drafts`)

Sem rota nova. Reusa `POST /api/content/drafts` (criar, `status='draft'`) e
`PATCH /api/content/drafts/[id]` (salvar edição / `status` → `copied`/`discarded`). O `format`
`self_assessment` e o `status` `draft` são só novos valores aceitos.

- **Create body:** `{ format: 'self_assessment', seedType: 'period', seedRef, body, status: 'draft' }`.
- **`body` é texto humano** → **não** passa pelo ruleset anti-IA (que vale só para saída de modelo).
- Histórico (US3) lê os drafts `self_assessment` do usuário (`SelfAssessmentHistory`), separado do feed
  e do espelho (RLS + isolamento de `drafts`).

## 5. Recorrência / data de revisão — reuso de `profiles`

Ao aceitar o passo-pra-frente e definir uma data, grava `profiles.review_cycle_months` +
`review_cycle_anchor` (PATCH em rota de perfil já existente, ou a mesma transação do forward-step).
Sem recorrência → gatilho não dispara.

## 6. Sinal de painel — `getReviewCycleSignal` (US2, contrato interno)

Função de domínio consumida pelo `getPanelData` (RSC), **paralela** ao `getReturnSignal` da 016.

**Input:**

```ts
interface GetReviewCycleSignalInput {
  reviewCycleMonths: number | null
  reviewCycleAnchor: string | null   // ISO date
  now: Date                          // injetável p/ teste
  hasRecentEntries: boolean
}
```

**Output:**

```ts
type ReviewCycleSignal =
  | { type: 'none' }                            // sem recorrência → não dispara (FR-009)
  | { type: 'approaching'; mode: 'write' }      // ciclo perto + dados → convida a escrever a autoavaliação
  | { type: 'approaching'; mode: 'feed-first' } // ciclo perto + poucos dados → convida a registrar antes (FR-008)
```

- `reviewCycleMonths == null` (ou `anchor == null`) → `{ type: 'none' }`.
- Janela de proximidade = constante nomeada. **Sem e-mail no v1** — só a superfície do painel (016).
