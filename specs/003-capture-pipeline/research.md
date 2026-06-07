# Research: Pipeline de Captura

**Feature**: `003-capture-pipeline` | **Date**: 2026-06-07

## Decisões técnicas

### D1 — Uma chamada Haiku para extração + reflexo
**Decisão**: `captureAndReflect` faz extração e reflexo numa única chamada `claude-haiku-4-5`,
retornando `{ entries, reflection }`.
**Racional**: minimiza custo (< US$ 0,0005/captura) e latência (1 round-trip). Doc 004 valida o custo.
**Alternativas rejeitadas**: duas chamadas (extrair, depois refletir) — dobra custo/latência sem ganho.

### D2 — Validação Zod antes de persistir (Princípio III)
**Decisão**: `validateCaptureResult` (Zod) roda sobre o JSON do modelo antes de qualquer insert.
**Racional**: LLM pode alucinar formato; constituição exige validar toda saída antes de persistir.
**Alternativas rejeitadas**: confiar no JSON do modelo — viola a constituição e arrisca dado corrompido.

### D3 — Extração do JSON via bloco markdown
**Decisão**: o prompt instrui o modelo a responder com ```json ... ``` e o parser extrai via regex.
**Racional**: simples, estável; alinhado ao doc 004. (Futuro: migrar para tool use / structured outputs.)
**Alternativas rejeitadas**: tool use estruturado — mais robusto, mas fora do escopo do MVP; anotado como melhoria.

### D4 — Prompt caching via system estável
**Decisão**: `CAPTURE_SYSTEM_PROMPT` é constante; o contexto variável do usuário é injetado em
bloco isolado do system (uma vez por request), preservando o prefixo estável p/ cache.
**Racional**: reduz custo de tokens de entrada repetidos.
**Referência**: doc 004, nota de implementação sobre prompt caching.

### D5 — Modalidades do MVP: texto + arquivo; áudio/imagem como costura
**Decisão**: `switch (kind)` trata `text` e `file`; `audio`/`image` retornam **501** + microcopy
"em breve". `CaptureInput` mantém os 4 ramos no type union. `transcribeAudio` e o bloco de visão
ficam como stubs documentados.
**Racional**: entregar valor rápido sem fechar a porta; ativar depois é trocar disabled/preencher ramo.
**Alternativas rejeitadas**: remover ramos audio/image — forçaria refatoração futura do tipo e da rota.

### D6 — `extractFromLinkedIn` separado do `captureAndReflect`
**Decisão**: import em lote usa **só extração** (`extractEntries`/`extractFromLinkedIn`), sem reflexo
individual. O "reflexo" do lote é o diagnóstico de conjunto (contagem + pílulas), montado pela 006.
**Racional**: lote pode gerar 5–20 entradas; reflexo por entrada seria custoso e ruidoso.
**Referência**: docs 003 e 004.

### D7 — Enriquecimento sem IA
**Decisão**: `PATCH /api/entries/:id/enrich` grava a resposta do usuário direto no campo, sem LLM.
**Racional**: mantém a captura barata e a resposta instantânea; a entrada já vale sem enriquecimento.

### D8 — Jobs assíncronos como costuras
**Decisão**: `triggerProactiveInsight` (→ feature 005) e `maybeRegenerateMirror` (→ feature 004)
entram como funções no-op documentadas, já chamadas pela rota de forma defensiva (com log de erro).
**Racional**: a assinatura da rota não muda quando as features seguintes preencherem os corpos —
evita buraco de integração entre features.
**Constituição**: o `.catch` registra o erro (sem dados do usuário); catch vazio é proibido.

### D9 — `pdf-parse` para extração de texto
**Decisão**: usar `pdf-parse` (doc 003) para extrair texto de PDF server-side.
**Alternativas rejeitadas**: parsing manual — desnecessário; `pdf-parse` é battle-tested.

## Pontos de atenção / riscos

- **Variação do JSON do modelo**: mitigado por Zod + retry no cliente (sem persistência parcial).
- **Tamanho do PDF**: limite de 10 MB validado na borda; texto truncado em ~8000 chars no prompt.
- **`service_role` vs RLS**: a rota usa o client autenticado do usuário (RLS ativa). Jobs de IA que
  rodam fora do request (regen) usarão `service_role` **sempre filtrando `user_id`** — detalhado na 004.
