# Research — Autoavaliação de Desempenho (019)

Decisões resolvidas no kickoff (Phase 0). Não havia `NEEDS CLARIFICATION` aberto na spec; o trabalho
aqui é fechar as **decisões de arquitetura** que o audit do código levantou.

## D1 — Formato estruturado por seções: como representar sem quebrar o motor

**Decisão:** o `self_assessment` reusa a **mesma forma de saída** dos outros formatos
(`{ variants: [{ angle, body, evidence_refs }] }`, exatamente 2). A **estrutura por seções**
(entregas / impacto / evolução / pontos a desenvolver) vive **dentro do `body`** como texto com
cabeçalhos de seção, ensinada pelo **prompt** — não como um novo shape de schema.

**Rationale:**
- `generateDraft` é format-driven via `promptFor(format)`; toda a validação (Zod + ruleset anti-IA),
  edição, chips e cópia operam sobre `body`. Manter `body` como o texto da autoavaliação preserva
  **100% do pipeline da 013/014/015** (SC-003: "trocando só prompt + schema").
- O ruleset anti-IA (sem travessão, sem antítese, etc.) roda em cima de `body` — manter o texto em
  `body` mantém a disciplina automaticamente.
- Cabeçalho de seção é texto puro (ex.: "Entregas", "Impacto", "Evolução", "Pontos a desenvolver"),
  compatível com o `OUTPUT_CONTRACT` ("texto puro, sem markdown") — as seções são rótulos, não
  markdown sintático.

**Alternativas consideradas:**
- *Schema com campo `sections: {…}` por variante:* mais "tipado", mas obrigaria a tocar `schemas.ts`,
  `validateContentRuleset` (que valida string), o render e o fluxo de edição/cópia — quebra o reuso
  e o SC-003. Rejeitado por YAGNI/KISS.
- *Texto corrido sem seções:* contradiz o clarify (artefato é **estruturado por seções**). Rejeitado.

**Risco/mitigação:** o prompt precisa garantir as 4 seções sempre presentes e ancoradas. Coberto por
teste do prompt/saída (as seções aparecem; pontos a desenvolver ancorados).

## D2 — Seed por período: como agregar com limite seguro

**Decisão:** novo `loadPeriodSeed` em `loadSeed.ts`, espelhando `loadProjectSeed`, mas filtrando
`entries` por **intervalo de datas** (`entry_date` quando houver; senão `created_at`), escopado por
`user_id` (RLS). Aplica **limite seguro de evidência** (constante nomeada, ex.: priorizar as mais
recentes/relevantes do intervalo, na linha do `MAX_THEME_EVIDENCE = 12` já existente) para não
estourar o contexto do LLM em períodos longos.

**Rationale:** reuso direto do padrão de seed já validado; a única diferença é o predicado de data.
O `SeedType` ganha `'period'`; o `seedRef` codifica o intervalo (ver D3).

**Alternativas:** seed sem limite (risco de estourar contexto em "anos") — rejeitado pelo edge case
da spec (período enorme). Resumir entradas antes de mandar — adia para fast-follow se o limite simples
não bastar (YAGNI agora).

## D3 — Período: presets + range, e como codificar o `seedRef`

**Decisão:** presets (`este_ano`, `ultimo_ciclo`) e **range personalizado** resolvidos no servidor
para um par `{ from, to }` (datas ISO). O `seedRef` carrega o intervalo de forma serializada
(ex.: `period:::<from>:::<to>`), com `parsePeriodSeedRef` validando formato e ordem das datas — mesmo
espírito do `parseProjectSeedRef`. Preset vira range no servidor (fonte única da regra do calendário).

**Rationale:** mantém o contrato da rota `/api/content/generate` (que recebe `seedType` + `seedRef`)
sem inventar um corpo novo. Validação no boundary (constituição I).

**Alternativas:** novos campos `from`/`to` no corpo da rota — divergiria do contrato uniforme de seed.
Rejeitado por consistência (reuso do `seedRef`).

## D4 — "Pontos a desenvolver" sem inventar fraqueza

**Decisão:** a seção deriva **só** de (a) sinal honesto da evidência — uma força ainda "Emergente"
(não consolidada) ou tema com pouca evidência — **ou** (b) intenção de crescimento informada pela
pessoa. O prompt proíbe fraqueza inventada explicitamente, e o ruleset anti-IA continua valendo.

**Rationale:** preserva a disciplina anti-invenção (constituição III, FR-005) numa seção
historicamente perigosa. O sinal "Emergente" já existe no domínio do espelho (`SkillSummary`:
comprovadas/consistentes/emergentes), então é um sinal real, não fabricado.

**Alternativas:** deixar o modelo inferir fraquezas livremente — viola a disciplina, gera crítica sem
lastro. Rejeitado (e é Out of Scope explícito da spec).

## D5 — Gatilho de calendário (US2): onde plugar no ressurgimento da 016

**Decisão:** novo `getReviewCycleSignal` em `src/lib/panel/`, **paralelo** ao `getReturnSignal` da
016 (não dentro dele). Lê a **recorrência configurável** do `profiles` e, quando o ciclo se aproxima,
expõe um sinal que o `getPanelData` integra como convite no painel. É **só painel** no v1 (sem
e-mail). Quando há poucos dados recentes, o convite é "registre antes" (alimentar), não "gere agora".

**Rationale:** o ressurgimento da 016 é por **delta** ("≥1 entrada nova desde o último retorno") — um
eixo diferente do **calendário** (ritmo de avaliação). Misturar os dois em `getReturnSignal`
acoplaria duas regras distintas num lugar só. Função separada mantém cada sinal testável e coeso
(constituição II), reusando a **superfície** de ressurgimento da 016, não sua lógica de delta.

**Alternativas:** estender `getReturnSignal` com mais um `type` — sobrecarrega uma função já com 3
tipos e mistura delta com calendário. Rejeitado por coesão.

## D6 — Onde persistir a recorrência do ciclo

**Decisão:** colunas aditivas em `profiles` na migration 012:
`review_cycle_months` (smallint, nullable; default conceitual trimestral/semestral, **editável**) e
`review_cycle_anchor` (date, nullable — a âncora a partir da qual o próximo ciclo é calculado). Sem
recorrência configurada → o gatilho proativo **não dispara** (FR-009); a geração sob demanda nunca é
bloqueada.

**Rationale:** segue o padrão da 016 (`profiles.last_panel_seen_at`): coluna server-side,
cross-device, simples de testar, aditiva e nullable (zero risco para linhas existentes). Evita nova
tabela (YAGNI — é config 1:1 com o usuário).

**Alternativas:** nova tabela `review_cycles` — over-engineering para uma config 1:1. localStorage —
não cross-device e difícil de testar (mesma razão da 016 ter escolhido coluna). Rejeitados.

## D7 — Migration: número e conteúdo

**Decisão:** **012** (confirmado: `009` drafts, `010` mini_bio, `011` last_panel_seen da 016 já em
`main`). Uma migration: estende `drafts_format_check` para incluir `'self_assessment'` (mesmo padrão
do `010`) **e** adiciona as colunas de recorrência em `profiles`. Respeita a ordem de merge dos elos.

**Rationale:** FR-011 manda confirmar o número (≠ 010); o audit confirma 012 livre. Uma migration
coesa por feature.

---

**Saída:** todas as decisões de arquitetura resolvidas. Sem `NEEDS CLARIFICATION` pendente. Pronto
para Phase 1 (data-model, contratos, quickstart).
