# 000 — Roadmap de Implementação do MVP (Captura → Espelho → Painel → Onboarding)

> Documento-mãe. Orienta a ordem de implementação das features que nascem dos docs
> `002`–`005`. Os docs originais continuam sendo a fonte de verdade do **conteúdo**
> (código de referência, microcopy, layouts); este roadmap define a **sequência**, as
> **fronteiras entre features** e as **ações manuais** necessárias.

## Decisão estrutural

Os quatro docs de produto (`002`–`005`) descrevem um único sistema acoplado. Em vez de
specá-los 1:1, eles foram decompostos em **quatro features em ordem de dependência**, para
garantir granularidade (cada uma é codável e testável isolada) sem buracos de integração
(cada uma só depende do que já foi entregue).

| Feature (spec) | Origem (docs/mvp) | Papel | Depende de |
|---|---|---|---|
| **003-capture-pipeline** | `004` + schema de `entries` (`003`) | Espinha dorsal: schema + extração + `/api/capture` | — (só auth/002) |
| **004-mirror-generation** | `005` | Síntese do espelho (Sonnet), 1ª geração + regeneração | 003 |
| **005-panel-dashboard** | `002` | Painel (espelho vivo + composer), superfície de captura canônica | 003, 004 |
| **006-onboarding-linkedin** | `003` | Onboarding = 1ª corrida da captura; import LinkedIn + 1º espelho | 003, 004, 005 |

### Por que esta ordem

- A **superfície de captura** (`CaptureComposer`/`CaptureConversation`) é *definida* no doc
  `002` (painel) mas *reusada* pelo onboarding (doc `003`). Logo o painel precede o onboarding.
- O painel **lê** `entries` e `mirror_snapshots` e **escreve** via `/api/capture` — então o
  pipeline (003) e o espelho (004) vêm antes.
- O onboarding fecha o "aha" gerando o **primeiro espelho** → precisa de tudo pronto.

### Escopo de modalidades (decisão de produto)

MVP entrega **texto + arquivos (PDF)**. Áudio (Whisper) e imagem (visão Haiku) ficam fora do
MVP, **mas a arquitetura os acomoda sem refatoração**:

- O type union `CaptureInput` (doc `004`) já inclui `audio` e `image` — mantê-los no tipo.
- O `switch (kind)` em `/api/capture` trata `text` e `file`; os ramos `audio`/`image`
  retornam **501 Not Implemented** com microcopy ("em breve") em vez de serem removidos.
- No composer, os botões de áudio/imagem ficam **renderizados mas desabilitados** com
  tooltip "em breve" (não removidos do JSX) — assim ligá-los depois é trocar o disabled e
  preencher o ramo da rota.
- `transcribeAudio` e o bloco de visão ficam como **stubs documentados** em `src/lib/ai/`.

Cada feature marca explicitamente esses pontos como *seams* (costuras) na sua `tasks.md`.

---

## Mapa de dependências

```
002-user-auth (MERGEADO)
      │  (auth.users, profiles, middleware, supabase server client)
      ▼
003-capture-pipeline ── entries, types, /api/capture (texto+arquivo), extração Haiku
      │
      ├──────────────► 004-mirror-generation ── mirror_snapshots, generateAndSaveMirror (Sonnet)
      │                        │
      ▼                        ▼
005-panel-dashboard ── painel + superfície de captura canônica + proactive_insights
      │  (consome /api/capture de 003 e lê mirror_snapshots de 004)
      ▼
006-onboarding-linkedin ── seleção de modalidade + import LinkedIn + 1ª revelação do espelho
   (reusa componentes de captura de 005; usa extractFromLinkedIn de 003 e /api/mirror de 004)
```

---

## Fronteiras de schema (quem cria o quê)

Para não haver dependência pra frente, cada tabela nasce na feature que **primeiro escreve** nela:

| Tabela | Criada em | Lida/escrita por |
|---|---|---|
| `entries` | **003** | 003 (capture, linkedin), 004 (lê p/ espelho), 005 (lê recentes), 006 (import) |
| `mirror_snapshots` | **004** | 004 (escreve), 005 (lê headline/temas), 006 (1ª geração) |
| `proactive_insights` | **005** | 005 (job + card) |

Coluna `mirror_snapshots.strength_themes` (doc `002`) entra junto com a tabela em 004.

### Costura do `triggerProactiveInsight`

`/api/capture` (003) chama `triggerProactiveInsight(userId).catch(...)` como fire-and-forget.
Em 003 essa função é um **stub no-op documentado** (a tabela ainda não existe). A feature
**005** implementa a função de verdade + a tabela + o card. A chamada na rota já existe e é
defensiva, então 005 só preenche o corpo — sem tocar na assinatura da rota.

> Nota: a constituição proíbe `.catch(() => {})` vazio. O catch aqui DEVE logar o erro
> (sem dados do usuário) — ex. `.catch((e) => logger.warn('proactive insight failed', e))`.

---

## Step-by-step de implementação (ordem + ações manuais)

> Codifique **uma feature por vez, na ordem**. Cada feature segue o ciclo speckit completo
> (`/speckit-implement` → testes → `/impeccable audit` nas de UI) e só então faz merge.

### Antes de começar (uma vez)

- [ ] **Manual:** confirmar variáveis de ambiente em `.env.local`: `ANTHROPIC_API_KEY`,
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
      (a `service_role` é necessária para jobs server-side de IA que escrevem como o usuário —
      sempre filtrando por `user_id`).
- [ ] **Manual:** ter acesso ao painel Supabase do projeto para rodar migrations SQL.

### Feature 003 — capture-pipeline

1. `git checkout 003-capture-pipeline` (branch já criado, specs commitados).
2. `/speckit-implement` seguindo `specs/003-capture-pipeline/tasks.md`.
3. **Manual (Supabase):** rodar a migration de `entries` (ver `data-model.md`) no SQL editor.
4. **Manual (deps):** `npm install pdf-parse && npm install -D @types/pdf-parse`,
   `npm install @anthropic-ai/sdk zod` (se ainda não presentes).
5. Testes (Vitest) verdes + cobertura ≥ 80% (extração, validação Zod, rota).
6. PR → merge na `main`.

### Feature 004 — mirror-generation

1. `git checkout 004-mirror-generation && git rebase main` (puxa o pipeline de 003).
2. **Manual (Supabase):** rodar migration de `mirror_snapshots`.
3. `/speckit-implement` → `generateAndSaveMirror`, `/api/mirror/generate`, `maybeRegenerate`.
4. Ligar `maybeRegenerateMirror` no `/api/capture` (a costura já está marcada em 003).
5. Testes verdes; PR → merge.

### Feature 005 — panel-dashboard (UI)

1. `git checkout 005-panel-dashboard && git rebase main`.
2. **Manual (Supabase):** rodar migration de `proactive_insights`.
3. `/impeccable shape` já está em `specs/005-panel-dashboard/shape.md` — revisar antes de codar.
4. `/speckit-implement` → superfície de captura + componentes de leitura do painel.
5. Implementar `triggerProactiveInsight` de verdade (preenche o stub de 003).
6. **Antes do PR:** `/impeccable audit` (Princípios V, VII, VIII, IX da constituição).
7. i18n: todas as strings em `src/messages/pt-BR.json` + stub `en.json`.
8. Testes + PR → merge.

### Feature 006 — onboarding-linkedin (UI)

1. `git checkout 006-onboarding-linkedin && git rebase main`.
2. `/impeccable shape` já está em `specs/006-onboarding-linkedin/shape.md` — revisar.
3. `/speckit-implement` → telas de onboarding + import LinkedIn + revelação do 1º espelho.
4. **Manual:** após primeiro espelho, marcar `profiles.onboarding_completed = true`
   (coluna pode já existir do módulo 002 — confirmar; se não, migration mínima).
5. `/impeccable audit`; i18n; testes; PR → merge.

### Ações manuais recorrentes (todo merge)

- [ ] Rebase do branch da feature seguinte em `main` após cada merge.
- [ ] Rodar migrations Supabase **na ordem** (entries → mirror_snapshots → proactive_insights).
- [ ] Regenerar tipos do Supabase se você usa `supabase gen types` (opcional).

---

## Princípios não-negociáveis que cruzam as 4 features

(Da constituição — valem para todas; cada `plan.md` referencia.)

- **Segurança:** toda query filtra por `auth.uid()` via RLS; auth verificada no topo de toda
  rota; nenhum dado de usuário em logs; sem segredos no client; IDs internos fora das respostas.
- **IA:** Haiku (`claude-haiku-4-5`) só extração; Sonnet (`claude-sonnet-4-6`) só espelho;
  toda saída de LLM validada (Zod) antes de persistir; wrappers só em `src/lib/ai/`.
- **TDD:** testes escritos e falhando antes da implementação; cobertura ≥ 80%.
- **Server-first / mobile-first / i18n:** RSC por padrão; Tailwind mobile-first; toques 48px;
  zero string hardcoded (next-intl).

---

## Fora do escopo de todas as 4 features (v1)

Streaming token-a-token; múltiplos movimentos por reflexo; dedupe/embeddings; áudio e imagem
(seams prontos, implementação posterior); perguntas guiadas do onboarding; re-import LinkedIn;
regerar espelho com feedback "nem tanto"; espelho completo com lacunas detalhadas.
