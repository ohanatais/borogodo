# Contracts — Autoavaliação de Desempenho (019)

Reusa as rotas da 013/014. As mudanças são **extensões de enum**, não rotas novas.

## POST /api/content/generate (estendido)

Gera 2 variações efêmeras da autoavaliação (Zod + ruleset anti-IA), sem persistir. Auth-first;
período validado como do usuário antes do LLM (constituição I).

**Request (campos novos/estendidos em negrito):**

```jsonc
{
  "format": "self_assessment",          // NOVO valor do enum existente
  "seedType": "period",                 // NOVO valor do enum existente
  "seedRef": "period:::2025-01-01:::2025-12-31", // intervalo serializado (presets resolvidos no servidor para um range)
  "angle": null,                         // opcional (reuso)
  "adjust": null                         // opcional — chip da US3 (reuso)
}
```

- `seedRef` para `period` codifica `from`/`to` ISO; validado por `parsePeriodSeedRef`
  (datas parseáveis, `from <= to`). Presets (`este_ano`, `ultimo_ciclo`) são resolvidos para um range
  no servidor antes de virar `seedRef` — fonte única da regra de calendário.

**Response 200:**

```jsonc
{
  "variants": [
    { "angle": "...", "body": "<autoavaliação por seções>", "evidenceRefs": ["E1", "E4"] },
    { "angle": "...", "body": "<autoavaliação por seções>", "evidenceRefs": ["E2"] }
  ]
}
```

- `body` contém as 4 seções (Entregas / Impacto / Evolução / Pontos a desenvolver) como texto puro
  com cabeçalhos. Cada afirmação ancorada em `evidenceRefs`.

**Erros (reuso do contrato atual):**
- `401 unauthorized` — sem sessão.
- `400 invalid_request` — corpo inválido / `seedRef` de período malformado.
- `404 seed_not_found` — período não resolve para evidência do usuário.
- `422 generation_failed` — saída violou anti-IA mesmo após 1 regeneração (estado de erro honesto).
- `500 internal_error` — falha inesperada (sem vazar detalhe).

**Base limitada (FR-006):** período sem entradas → o seed devolve `evidence: []`; o prompt reconhece
a base limitada e **não fabrica** — a UI convida a registrar (não bloqueia, não inventa).

## Persistência / edição / cópia (US3 — reuso total)

Sem contrato novo. `self_assessment` usa o mesmo `POST /api/content/drafts` (persistir) e
`PATCH/DELETE /api/content/drafts/[id]` (editar / status `edited`/`copied`/`discarded`) das features
anteriores. O `format` é só mais um valor aceito.

## Sinal de painel — `getReviewCycleSignal` (US2, contrato interno)

Não é rota HTTP; é uma função de domínio consumida pelo `getPanelData` (RSC).

**Input:**

```ts
interface GetReviewCycleSignalInput {
  reviewCycleMonths: number | null   // profiles.review_cycle_months
  reviewCycleAnchor: string | null   // profiles.review_cycle_anchor (ISO date)
  now: Date                          // injetável p/ teste
  hasRecentEntries: boolean          // se há dado fresco no período recente
}
```

**Output:**

```ts
type ReviewCycleSignal =
  | { type: 'none' }                                  // sem recorrência → não dispara (FR-009)
  | { type: 'approaching'; mode: 'generate' }         // ciclo perto + dados → convida a gerar
  | { type: 'approaching'; mode: 'feed-first' }       // ciclo perto + poucos dados → convida a registrar antes (FR-008)
```

- `reviewCycleMonths == null` (ou `anchor == null`) → `{ type: 'none' }`.
- Janela de proximidade do ciclo (ex.: N dias antes da próxima âncora) é constante nomeada.
- **Sem e-mail no v1** — o sinal só alimenta a superfície do painel (reusa o ressurgimento da 016).
