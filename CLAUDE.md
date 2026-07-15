# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #40):
- **001-landing-page** — landing page pública, design system e i18n
- **002-user-auth** — autenticação (Google OAuth + e-mail/senha), painel protegido por middleware
- **003-capture-pipeline** — captura de texto e PDF/LinkedIn, extração via IA com Zod
- **004-mirror-generation** — geração do espelho via Sonnet, regeneração automática
- **005-panel-dashboard** — painel com composer, indicadores, insight proativo, entradas recentes
- **006-espelho-honesto** — página do espelho com categorias macro, evidências e feedback
- **007-painel-redesign** — BorogodoCard, trajetória em destaque, mini timeline
- **008-historico-nav** — AppShell com navegação, Linha do Tempo (`/historico`)
- **009-perfil-onboarding** — Central de Configurações (`/configuracoes`) + onboarding WOW/AHA
- **010-produto-polish** — 17 itens de refinamento de UX/identidade/bugs
- **011-skills-robustez** — robustez de skills (PR #20)
- **012-chat** — Q&A com streaming SSE, correção/marco guiado, discovery (PR #21)
- **013-motor-de-voz** — fundação de conteúdo (`drafts`, `voice_profile` JSONB, motor `generateDraft`, post + resumo de impacto), migration `009` (PR #22)
- **014-presenca** — hub `/presenca`, gestão total do rascunho, "Usar projeto" no histórico, sugestões (PR #23)
- **015-refino-voz** — recalibração de voz com consentimento, golden set como gate de CI, mini-bio (3º formato), migration `010` (PR #24)
- **016-captura-v2** — captura multi-item, ressurgimento por delta, áudio via Web Speech, pergunta cirúrgica (PR #40)
- **017-feed-registros** — feed cru de registros (`/registros`), cards colapsáveis, busca/filtros, grade-faísca (PR #51)
- **020-canal-suporte** — canal de contato/suporte pré-launch: `ContactCard` reutilizável (e-mail copiável via `lib/clipboard.ts`, LinkedIn secundário, SLA) no rodapé da LP (`Footer`) e em `/configuracoes`; i18n namespace `support` (PR #54)
- **021-navegacao-espinha** — reforma de IA: menu de 6 → 4 destinos (Painel, Espelho c/ Forças+Trajetória, Registros, Usar), `Segmented` único, chat como porta no Painel (PR #55)

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **025-registro-deposito** (branch: `025-registro-deposito`) — **Registro como Depósito (fundação): drawer bloco-de-notas que sempre salva (sem IA no caminho crítico), anexo de imagem/link de primeira classe, confirmação editável, campos manuais opcionais; Painel novo (saudação + gatilho único + Suas forças + Registros recentes) e navegação em grupos + dark mode. Spec ✅ clarify ✅ plan ✅**

> Feature A do fatiamento A→B→C descrito em `docs/decisions/003-registro-deposito-e-captura.md`.
> Remove a dependência de IA síncrona (Haiku) do caminho de salvar (`captureAndReflect`) e o
> reroteamento por tamanho de texto (limiar de 150 chars) — hoje ambos quebram o dogfooding.
> Reusa `entries`/`evidences` JSONB/bucket `evidence-files` (migration 007) sem migration nova.
> Novo `kind: 'deposito'` em `/api/capture` salva texto+campos manuais direto (sem IA); anexos
> vão pela rota já existente `/api/entries/[id]/evidence`, chamada após a entry já ter `id`.
> Navegação em grupos ("Meu espelho"/"Usar") e dark mode via `next-themes` (nova dependência)
> ficam dentro desta fatia — decidido no `/speckit-clarify`, não viram sub-feature. Fora de
> escopo: botão Organizar/estruturação por IA, destaques, reestruturação de Registros, Importar
> histórico (features `026-organizar-destaques` e `027-importar-historico`).
Spec: [specs/025-registro-deposito/spec.md](specs/025-registro-deposito/spec.md) ·
Plan: [specs/025-registro-deposito/plan.md](specs/025-registro-deposito/plan.md) ·
Research: [specs/025-registro-deposito/research.md](specs/025-registro-deposito/research.md) ·
Data-model: [specs/025-registro-deposito/data-model.md](specs/025-registro-deposito/data-model.md) ·
Contracts: [specs/025-registro-deposito/contracts/capture.md](specs/025-registro-deposito/contracts/capture.md) ·
Quickstart: [specs/025-registro-deposito/quickstart.md](specs/025-registro-deposito/quickstart.md) ·
Tasks: (pendente — `/speckit-tasks`)
<!-- SPECKIT END -->
