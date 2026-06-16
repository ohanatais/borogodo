# Implementation Plan: Captura v2 — Captura sem atrito

**Branch**: `016-captura-v2` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-captura-v2/spec.md`; discovery
`docs/discovery-retencao-e-conteudo.md` (§1, §3, §8). Primeira aposta de retenção pós-bloco de Presença.

## Summary

Ataca o gargalo de retenção no **input** (alimentar dado fresco), não no output. Quatro frentes, todas
**reusando infraestrutura existente** — a auditoria de kickoff confirmou que o pipeline já faz o núcleo:

1. **US1 — colar artefato vira entradas (P1):** `CaptureComposer` → `POST /api/capture` (text) →
   `captureAndReflect` (Haiku+Zod) → `saveEntries` (dedup 3 camadas) **já transforma texto colado em
   N entradas salvas na hora**. O trabalho é enquadramento (placeholder de artefato + aviso de
   privacidade), **limite máximo de tamanho**, e o **resumo "criei N entradas" com desfazer do lote**.
2. **US2 — ressurgimento por delta (P1):** troca o nudge por **relógio** (`getCapturePrompt`) por um
   movido por **delta de dados** ("≥1 entrada nova desde o último retorno"). **Única decisão de schema
   em aberto** (ver Decisão pendente, abaixo).
3. **US3 — áudio in-app (P2):** Web Speech API **no navegador**; o `AudioButton` (stub `disabled`) e o
   `transcribe.ts` (lança erro) ficam para trás. Áudio vira **texto antes de extrair** e entra pelo
   caminho de texto que já existe. **Zero servidor.**
4. **US4 — pergunta cirúrgica assíncrona (P3):** reusa `proactive_insights` (campo `type` é texto livre,
   sem CHECK) + `ReflectionCard` + `PATCH /api/entries/[id]/enrich`. Aditivo à pergunta síncrona atual.

## Technical Context

**Language/Version**: TypeScript strict (Next.js 15 App Router, React 19).

**Primary Dependencies**: reuso de `src/lib/ai/extraction/` (captura), `saveEntries`/`entries` (003),
`getCapturePrompt`/`getPanelData` (005), `ReflectionCard`/`proactive_insights` (004/005),
`mirror_snapshots` (004). Nova dependência de plataforma: **Web Speech API** (nativa do navegador, sem
pacote).

**Storage**: **provável zero migration** — reusa `entries`, `proactive_insights`, `mirror_snapshots`.
**Exceção possível (US2):** um marcador de "último retorno" pode exigir 1 coluna nova em `profiles`
(`011`) — decisão registrada abaixo, a fechar nas tasks da US2.

**Testing**: Vitest. Módulos novos com cobertura ≥ 80%: limite/resumo+desfazer do colar; lógica de
delta do ressurgimento (dois ramos); enfileiramento da pergunta de enriquecimento (no máx. uma);
wrapper de Web Speech (start/stop/cancel/rerecord + detecção de suporte, com a API mockada).

**Target Platform**: Web app, mobile-first. Áudio degrada com honestidade onde a Web Speech é fraca
(iPhone/Safari) — texto permanece 100% funcional.

**Project Type**: Web application (Next.js full-stack).

**Performance Goals**: colar reusa **uma** chamada Haiku (já existente); áudio é client-side (zero custo
de servidor/IA na transcrição); delta e pergunta assíncrona derivam de queries simples sob índices que
já existem (`entries_user_created_idx`, `proactive_insights_user_unseen_idx`).

**Constraints**: captura por texto nunca depende de áudio; nada é salvo sem o texto na tela; o
ressurgimento **nunca** fabrica análise sem delta real; RLS em toda superfície; entrada validada e
sanitizada antes do LLM; contexto de IA só do próprio usuário; zero string hardcoded.

**Scale/Scope**: ~24–30 tasks; **0–1 migration** (decisão US2); 1 endpoint novo (desfazer lote); 1
hook novo (Web Speech) + UI de gravação; 1 seletor de ressurgimento por delta; 1 enfileirador de
pergunta assíncrona. Sem tabela nova.

## Constitution Check

*GATE: deve passar antes da Fase 0. Re-checar após o design da Fase 1.*

| Princípio | Como cumpre |
|---|---|
| **I. Security First** | Texto colado/transcrito tratado como dado do próprio usuário, isolado por RLS (`auth.uid() = user_id`); contexto de IA nunca inclui dado de outro usuário; `raw_content` preservado mas nunca logado; IDs internos não vazam. Aviso leve de privacidade no colar (FR-019); **sem** detecção de PII no v1 (decisão de clarify). |
| **II. TS Strict & Quality** | Sem `any` (`unknown` + narrow para eventos de Web Speech); funções < 40 linhas; arquivos < 800; erros explícitos (permissão de mic negada, browser sem suporte, texto vazio, limite estourado). |
| **III. AI-First** | Extração reusa `claude-haiku-4-5` + Zod (uma chamada); a pergunta assíncrona reusa o veículo de `proactive_insights`; **nada de IA na transcrição** (Web Speech client-side). Saída sempre validada antes de persistir. |
| **IV. Server-First & Perf** | Colar/extração/persistência no servidor; delta e enfileiramento da pergunta no servidor (Server Components/route handlers); só a captura de voz é client-side (exigência da Web Speech). |
| **V. Acessibilidade AA** | Controles de gravação são **botões explícitos rotulados, operáveis por teclado e leitor de tela** (FR-012b) — não gesto de segurar-e-arrastar; estados de gravação anunciados; foco gerido. |
| **VI. TDD** | Testes primeiro: limite/desfazer do colar; dois ramos do delta; "no máx. uma" pergunta; wrapper de Web Speech com API mockada (start/stop/cancel/rerecord/sem-suporte). Cobertura ≥ 80% nos módulos novos. |
| **VII. Design Identity** | Reusa as superfícies de captura e do painel; "nunca página em branco" no ressurgimento (banco vazio → convite de boas-vindas); `/impeccable shape` para o ressurgimento e a UI de gravação; `/impeccable audit` antes do PR. |
| **VIII. Mobile-First** | Captura, gravação e ressurgimento revisados a 375px; alvos de toque ≥ 48px; o áudio é "plus" no mobile onde funciona, nunca pré-requisito. |
| **IX. i18n** | Strings novas em `capture.*` e `panel.*` (`pt-BR.json`); `en.json` espelha a estrutura. Zero string hardcoded. |

**Veredito**: PASS condicional. A única possível mudança de schema (coluna `last_panel_seen_at` em
`profiles`, US2) é aditiva e mínima — registrada como decisão aberta, não viola a constituição. A
captura de voz client-side é exceção justificada ao Princípio IV (a Web Speech só roda no navegador).

> **Security gate**: a 016 ingere texto bruto de terceiros (transcrições/e-mails) e transcrição de
> voz — `/security-review` recomendado antes do PR (foco em isolamento RLS, sanitização pré-LLM e
> ausência de vazamento de dado de terceiros no contexto de IA), além de `/pr-review`.

## Decisão pendente (a fechar nas tasks da US2)

**Marcador de "último retorno" para o delta.** Não há hoje um sinal de "última visita ao painel". Dois
caminhos, ambos documentados; decisão adiada para a fase da US2 (escolha da Ohana no kickoff do plano):

- **Opção A — `migration 011`: coluna `profiles.last_panel_seen_at timestamptz` (recomendada).** No load
  do painel (server), "novidade" = `entries.created_at > last_panel_seen_at`; depois atualiza para
  `now()`. Robusto, cross-device, simples de testar. Custo: 1 migration aditiva e nullable (zero risco).
- **Opção B — `localStorage` no cliente (sem migration).** Por-dispositivo (volta no celular não
  conversa com o laptop) e exige componente cliente + segundo render (o painel é Server Component). Na
  prática, mais complexo e menos robusto para economizar uma migration trivial.

O **aha de força** ("reforça sua força em Y") só acompanha quando o **espelho regenerou** — isso é
derivável de `mirror_snapshots` (snapshot novo desde o último retorno) **sem coluna nova**, independente
da opção acima.

## Project Structure

### Documentation (this feature)
```text
specs/016-captura-v2/
├── spec.md · plan.md · research.md · quickstart.md · shape.md · tasks.md
└── checklists/requirements.md
```
(`shape.md` próprio: o ressurgimento por delta e a UI de gravação são superfícies novas o bastante para
um `/impeccable shape` antes de codar.)

### Source Code (repository root)
```text
src/
├── components/features/capture/
│   ├── CaptureComposer.tsx          # ESTENDE: enquadramento de artefato + aviso de privacidade (FR-001/019)
│   ├── AudioButton.tsx              # ESTENDE: deixa de ser stub; abre a gravação por voz (US3)
│   ├── AudioRecorder.tsx            # NOVO: UI de gravação — botões parar/cancelar/regravar (FR-012a/b)
│   ├── CaptureConversation.tsx      # ESTENDE: resumo "criei N entradas" + desfazer do lote (FR-003)
│   └── BatchSummary.tsx             # NOVO: o card "criei N entradas" com desfazer (US1)
├── hooks/
│   └── useSpeechRecognition.ts      # NOVO: wrapper Web Speech (start/stop/cancel/rerecord, suporte) (FR-011/013)
├── lib/panel/
│   ├── getReturnSignal.ts           # NOVO: delta → 'tem-novidade' | 'ressurgir+convidar' (FR-006/007/008)
│   └── getEnrichmentNudge.ts        # NOVO: acha entrada magra sem nudge e enfileira UMA pergunta (FR-014/015)
├── lib/ai/extraction/
│   └── (sem mudança no motor — colar e áudio entram pelo caminho de texto existente)
├── app/api/
│   ├── capture/route.ts             # ESTENDE: limite máximo de tamanho do texto colado (FR-005)
│   └── entries/batch/route.ts       # NOVO: DELETE de lote (ids[]), escopado por user_id/RLS (desfazer)
├── components/features/panel/
│   └── ReturnHighlight.tsx          # NOVO: destaque de ressurgimento no topo do painel (US2)
└── messages/pt-BR.json · en.json    # capture.* (artefato, privacidade, gravação) + panel.* (ressurgimento)
supabase/migrations/
└── 011_profiles_last_panel_seen.sql # CONDICIONAL (US2, Opção A): coluna last_panel_seen_at
```

**Structure Decision**: Web app full-stack. A 016 **estende** as superfícies de captura e painel e
**reusa** o motor de extração, o dedup, `proactive_insights` e `ReflectionCard`. O único código de
servidor novo é o endpoint de desfazer lote e os dois seletores de painel (delta + pergunta). A captura
de voz é o único trecho client-side novo (Web Speech). Migration só na Opção A da US2.

## Phasing (resumo; detalhe em tasks.md)

1. **Setup** — i18n (`capture.*` artefato/gravação/privacidade, `panel.*` ressurgimento).
2. **Foundational** — endpoint `DELETE /api/entries/batch` (escopo user_id/RLS); limite máximo no
   `/api/capture` (texto); **decisão US2** (Opção A → migration `011`; Opção B → utilitário cliente).
3. **US1 (P1)** — enquadramento de artefato + aviso de privacidade no `CaptureComposer`; resumo
   "criei N entradas" + desfazer (`BatchSummary` no fluxo de `CaptureConversation`); estado honesto de
   "sem conquista" (já existe, refinar texto). **Checkpoint de validação manual (conta QA).**
4. **US2 (P1)** — `getReturnSignal` (dois ramos do delta) + `ReturnHighlight` no topo do painel; aha de
   força só com espelho regenerado; ressurgimento de vitória antiga + convite que cai na captura.
   **Checkpoint de validação manual (dois ramos).**
5. **US3 (P2)** — `useSpeechRecognition` + `AudioRecorder` (botões explícitos); `AudioButton` abre a
   gravação; transcrição cai no campo de texto, editável, segue para a extração; estado honesto onde
   não há suporte. **Checkpoint de validação manual (Chrome/desktop + Safari/iPhone).**
6. **US4 (P3)** — `getEnrichmentNudge` (uma pergunta por vez, fora da captura) renderizada via
   `ReflectionCard`; resposta via `PATCH .../enrich`; marcar `seen` ao responder/dispensar.
7. **Polish** — a11y (foco/labels/anúncios de gravação), i18n, "nunca página em branco",
   `/impeccable audit`, `/security-review`, `/pr-review`.

## Complexity Tracking

| Possível "violação" | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Captura de voz **client-side** (exceção ao Server-First) | A Web Speech API só existe no navegador; a decisão de discovery é não ter servidor de transcrição no v1 | Transcrição no servidor (Whisper) exigiria backend novo, custo e latência — explicitamente fora do v1 |
| Possível coluna `last_panel_seen_at` (US2, Opção A) | Delta robusto e cross-device precisa de um marcador de "último retorno" persistido | `localStorage` (Opção B) é por-dispositivo e quebra o modelo Server Component — mais complexo, menos robusto |
