# Research: Captura v2 — auditoria do código e decisões técnicas

**Feature**: `016-captura-v2` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Levantamento feito **lendo o código** no kickoff do plano, para confirmar (ou derrubar) a aposta
central da spec: "a 016 evolui, não constrói do zero; provavelmente sem migration". Resultado: a aposta
**se confirma**, com **uma** ressalva de schema isolada na US2.

## R1 — US1 (colar) já roda; o que falta é casca

**Achado.** `CaptureComposer` (textarea) → `POST /api/capture` kind `text` → `captureAndReflect`
(`claude-haiku-4-5` + Zod, devolve `ExtractedEntry[]`) → `saveEntries` → retorna `{ entries, reflection }`.
`saveEntries` (`src/lib/db/entries.ts`) **já quebra um texto em N entradas e deduplica em 3 camadas**
(exato normalizado, semântico por embedding, dentro do lote). `NoExtractableContentError` → 422
`noContent` já cobre o "texto sem conquista" (FR-004).

**Decisões.**
- **Não reconstruir extração.** US1 = (a) **enquadrar** o campo para artefatos (placeholder + aviso de
  privacidade, FR-001/019); (b) **limite máximo de tamanho** no `/api/capture` (hoje só há mínimo de 3
  chars; FR-005); (c) **resumo "criei N entradas" + desfazer do lote** (FR-003).
- **Desfazer = deletar os IDs do lote.** A rota já devolve as entradas salvas com `id`; `DELETE
  /api/entries/[id]` **já existe** (`route.ts:64`). O lote é estado **efêmero no cliente** (os IDs
  recém-criados). Para um toque, criar `DELETE /api/entries/batch` (recebe `ids[]`, escopa por
  `user_id`, RLS) em vez de N chamadas. **Sem coluna de lote no banco** — nada persiste o agrupamento.

## R2 — US2 (delta) é o único ponto com pergunta de schema

**Achado.** O nudge atual é por **relógio**: `getCapturePrompt(daysSince, themes)`
(`src/lib/panel/getCapturePrompt.ts`) escolhe uma chave por dias desde a última entrada, consumido em
`getPanelData.ts:183` — e só alimenta o **placeholder do composer** (`composerPlaceholder`), não um
destaque de retorno. `getPanelData` já busca, num `Promise.all`, tudo que o delta precisa, **menos um
sinal de "última visita"**: `entryCount`, último `created_at`, `mirror_snapshots.generated_at`.

**Decisões.**
- **`ReturnHighlight` é aditivo**, não um rip-out: o placeholder por relógio pode continuar; a US2
  **adiciona** um destaque de ressurgimento no topo do painel, movido por delta.
- **Aha de força sem coluna nova:** "o espelho regenerou" = existe `mirror_snapshots` com `generated_at`
  posterior ao último retorno. Derivável de dados que já temos.
- **Pendência registrada (não decidida aqui, por escolha da Ohana):** o gatilho "≥1 entrada nova **desde
  o último retorno**" precisa de um marcador de "último retorno", que **não existe**. `auth.users
  .last_sign_in_at` não serve (só muda em login real, não a cada abertura). Duas opções no [plan.md](./plan.md#decisão-pendente-a-fechar-nas-tasks-da-us2):
  **A)** `migration 011` — coluna `profiles.last_panel_seen_at` (robusto, cross-device; recomendada);
  **B)** `localStorage` (sem migration, por-dispositivo, quebra o modelo Server Component). A fechar na
  fase da US2.

## R3 — US3 (áudio) é 100% navegador; o stub de servidor fica para trás

**Achado.** `AudioButton` está `disabled` ("em breve"); `transcribe.ts` **lança erro** (costura de
Whisper-servidor nunca ligada); `/api/capture` rejeita `kind:'audio'` com 501. A decisão de discovery
(§3) é **não** ter servidor de transcrição no v1.

**Decisões.**
- **Web Speech API client-side.** Novo hook `useSpeechRecognition` (start/stop/cancel/rerecord +
  **detecção de suporte**, FR-011/013). O `transcribe.ts` e o ramo `audio` da rota **continuam
  inertes** — o áudio nunca vira `kind:'audio'`; ele transcreve no navegador e injeta **`kind:'text'`**
  no fluxo que já existe (`setActiveCapture({ kind:'text', content })` no `CaptureComposer`).
- **Controles são botões explícitos** (parar/cancelar/regravar), rotulados e operáveis por teclado/leitor
  de tela (FR-012b) — decisão de acessibilidade e de funcionar no desktop (onde o gesto do WhatsApp não
  se aplica). "Reouvir" vira "ler o texto"; regravar limpa a transcrição anterior (FR-012a).
- **Risco conhecido:** Web Speech é fraca/instável em Safari/iOS. A UI sinaliza isso com honestidade e o
  texto permanece 100% funcional (FR-013, SC-004). Sem polyfill nem pacote — API nativa.

## R4 — US4 (pergunta assíncrona) tem precedente exato, sem migration

**Achado.** `proactive_insights.type` é **`text` sem CHECK** (migration `004`). A 014 **já** adicionou um
`type` novo (`content_opportunity`) **sem migration** — só um membro novo no union de aplicação
(`src/types/insight.ts`). Existe toda a trilha: `insertProactiveInsight`/`countUnseenInsights`
(`db/insights.ts`), `markInsightSeen` (`actions/insights.ts`, marca `seen` sob RLS), `getPanelData` já
puxa o último insight **não visto** (`:129`) e o painel renderiza `ProactiveInsightCard`.

**Decisões.**
- **`enrichment_nudge` é só mais um `type`** no union — **sem migration**, seguindo o precedente da 014.
- **A pergunta "ressurge" pela trilha de insight existente**, não pelo `ReflectionCard` da captura: o
  `ReflectionCard` só é renderizado em `CaptureConversation` (no momento da captura). A US4 **persiste**
  a pergunta como `proactive_insight` (`headline`/`body`/`entry_ids`/`seen`) e a **renderiza no painel**
  com o **padrão de input do `ReflectionCard`** (campo + enviar), fiado ao `PATCH /api/entries/[id]/enrich`
  que já existe. "Reuso do `ReflectionCard`" da spec = reuso do **padrão de pergunta cirúrgica**, na
  superfície de insight do painel.
- **"Entrada magra" e "uma por vez":** magra = sem `metric` e sem `impact` claros; "uma por vez" =
  `getEnrichmentNudge` não gera novo nudge se já houver um `enrichment_nudge` (visto ou não) para aquela
  entrada. Lógica de query — sem coluna nova. Responder via `enrichEntryField` preenche o campo;
  `markInsightSeen` fecha o nudge (FR-015).

## R5 — Veredito de schema

| US | Toca schema? |
|---|---|
| US1 colar | **Não** — desfazer é efêmero (IDs no cliente) + `DELETE /api/entries/batch` |
| US2 delta | **Talvez 1 coluna** (`profiles.last_panel_seen_at`) — decisão aberta, Opção A/B |
| US3 áudio | **Não** — client-side, entra como texto |
| US4 pergunta | **Não** — `type` novo no union, precedente da 014 |

**Conclusão:** a 016 é **0 ou 1 migration**, e a única candidata é uma coluna aditiva e nullable. A
aposta da spec se sustenta.

## Referências de código (auditadas)

- `src/lib/ai/extraction/captureAndReflect.ts`, `src/app/api/capture/route.ts` — colar → entradas (US1)
- `src/lib/db/entries.ts` (`saveEntries`, `enrichEntryField`, `DELETE` em `entries/[id]/route.ts`) — persistência/dedup/enrich
- `src/lib/panel/getCapturePrompt.ts`, `src/lib/panel/getPanelData.ts` — nudge por relógio (US2 troca)
- `src/components/features/capture/AudioButton.tsx`, `src/lib/ai/transcribe.ts` — stub de áudio (US3 implementa)
- `src/types/insight.ts`, `src/lib/db/insights.ts`, `src/lib/actions/insights.ts`, `ProactiveInsightCard.tsx` — trilha de insight (US4)
