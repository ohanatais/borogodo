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
- **017-feed-registros** — feed cru de registros (`/registros`), cards colapsáveis, dois eixos de tempo, busca/filtros, grade-faísca (PR #43)

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **019-autoavaliacao** (branch: `019-autoavaliacao`) — **planejamento em andamento; implementação não iniciada**
Spec: [specs/019-autoavaliacao/spec.md](specs/019-autoavaliacao/spec.md) ·
Plan: [specs/019-autoavaliacao/plan.md](specs/019-autoavaliacao/plan.md) ·
Research: [specs/019-autoavaliacao/research.md](specs/019-autoavaliacao/research.md) ·
Tasks: (pendente — `/speckit-tasks`)

Quarto elo de retenção — **segundo payoff episódico**. A pessoa escolhe um **período** e o motor
**colhe as entradas do intervalo** e gera uma **autoavaliação estruturada por seções** (entregas,
impacto, evolução, pontos a desenvolver), 2 variações, ancorada em evidência real. **Reusa o motor da
013** (`generateDraft`) como **novo formato** `self_assessment` — não motor novo (constituição III).
**US1** novo formato + novo seed por período (`loadPeriodSeed`, espelha `loadProjectSeed` mas por
intervalo de datas); **US2** gatilho de calendário no painel via novo `getReviewCycleSignal` paralelo
ao `getReturnSignal` da 016 (já em `main`), só painel, sem e-mail no v1; **US3** edição/chips/cópia =
reuso total da 013. Spec ✅, clarify ✅, plan ✅, research ✅, data-model ✅, contracts ✅, quickstart ✅,
tasks ⬜. **Gate antes de codar:** `/impeccable shape` da tela de autoavaliação (seletor de período +
render por seções).

**Migration 012** (`011` já em `main` pela 016): estende o CHECK de `drafts.format` para
`self_assessment` **e** adiciona `profiles.review_cycle_months` + `review_cycle_anchor` (aditivo,
nullable). Sem recorrência configurada → gatilho proativo não dispara; geração sob demanda nunca
bloqueia.
<!-- SPECKIT END -->
