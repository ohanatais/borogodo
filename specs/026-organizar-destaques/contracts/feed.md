# Contract: Registros (feed reestruturado)

## `getFeedData` (extensão, `src/lib/feed/getFeedData.ts`)

O contrato de paginação/filtro (`FeedQuery`) não muda — mesmo cursor, mesmo `axis`, mesmos
filtros (`q`, `from`/`to`, `company`, `tags`, `metricOnly`, `source`). O que muda é o **shape**
de `FeedItem` (FR-025/FR-026/FR-027) e a query passa a fazer um segundo select (ou um join) contra
`entry_highlights` para montar a contagem e a lista de destaques por fonte.

### `FeedItem` (novos campos)

```ts
export interface FeedItem {
  // ...campos já existentes (id, title, what_i_did, source, created_at, entry_date, company,
  // role_title, metric, tags, thumbnail, evidences, impact, decision, learning, file_name)

  /** Story 4/US7: destaques da fonte. Fontes legadas sem linha em entry_highlights (FR-032)
   *  retornam um array com um destaque sintético derivado dos campos legados da própria entry
   *  (title/metric/impact/tags), nunca um array vazio — todo card tem ao menos 1 destaque. */
  highlights: FeedHighlight[]

  /** Estado de organização derivado (ver data-model.md) — controla o selo "organizando…" (US3). */
  organizationStatus: 'not_organized' | 'organizing' | 'organized'

  /** Estado de contexto derivado — controla a sinalização discreta de FR-008. */
  contextStatus: 'unresolved' | 'company' | 'personal_project'

  isPersonalProject: boolean
}

export interface FeedHighlight {
  id: string
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
}
```

### Card de fonte (FR-025/FR-027)

- 1 card por fonte (linha de `entries`), nunca por destaque.
- Selo de contagem: exibido apenas quando `highlights.length > 1` ("+N destaques") — com exatamente
  1 destaque, nenhum selo (FR-017 já resolve isso no nível do cartão individual: aberto por
  padrão, sem necessidade de sinalizar contagem).
- Miniatura: `thumbnail` (já existente, primeira imagem de `evidences`) — inalterado.
- Sinalização de contexto não identificado (FR-008/US7 acceptance #6): renderizada a partir de
  `contextStatus === 'unresolved'`, estilo discreto (convite a completar, não alerta de erro).

### Expansão do card (FR-026)

Ao expandir, o cliente já tem `highlights` completo (veio na mesma página do feed — não é uma
segunda chamada de rede por card) + acesso ao `raw_content`/anexos completos da fonte (campos já
existentes no `FeedItem`, sem mudança).

### Timeline por mês (FR-028) e grade-faísca (FR-029)

Não dependem de `entry_highlights` — continuam operando sobre `created_at`/`entry_date` de
`entries`, exatamente como hoje (`src/app/api/feed/activity`). Nenhuma mudança de contrato aqui;
citado só para deixar explícito que esta feature não altera essas duas partes do feed além de
remover qualquer resquício de streak/emoji, se existir (FR-029 já é um requisito herdado, não
novo).
