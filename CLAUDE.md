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
- **017-feed-registros** — feed cru de registros (`/registros`), cards colapsáveis, busca/filtros, grade-faísca

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **018-seeds-expandidos** (branch: `018-seeds-expandidos`) — **US1+US2 implementadas (draft PR #44); polish/validação pendentes**
Spec: [specs/018-seeds-expandidos/spec.md](specs/018-seeds-expandidos/spec.md) ·
Plan: [specs/018-seeds-expandidos/plan.md](specs/018-seeds-expandidos/plan.md) ·
Tasks: [specs/018-seeds-expandidos/tasks.md](specs/018-seeds-expandidos/tasks.md)

Terceiro elo da aposta de retenção — amplia o **output** (mais ângulos de post). Sem migration: `angle_kind`
no `drafts.qa jsonb` existente. Dois novos ângulos: **US1** estudo/aprendizado (P1, reusa `loadSeedEvidence`
+ `generateDraft`); **US2** opinião/tese com lastro (P2, guardrail: `evidence_refs` não-vazio ou vivência
na hora + sinergia 016 de captura). **US3** P1 transversal: assert 11 anti-opinião-vazia em `bannedTerms.ts`
+ golden set como gate de CI (padrão 015). UI: estado `'angle-select'` no `GenerateSheet` antes de gerar.

**Estado:** US1 (estudo) e US2 (opinião com lastro) implementadas e commitadas. Pendente: Phase 5 (validação
manual quickstart, `/code-review`, audit) + revisão de produto (feature em stand-by no draft PR #44).

**Migration:** footprint **0**. Zero schema change. `angle_kind`, `thesis`, `lastro_captured` vão no `qa jsonb` existente.
<!-- SPECKIT END -->
