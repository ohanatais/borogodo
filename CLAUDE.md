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

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **017-feed-registros** (branch: `017-feed-registros`)
Spec: [specs/017-feed-registros/spec.md](specs/017-feed-registros/spec.md) ·
Plan: [specs/017-feed-registros/plan.md](specs/017-feed-registros/plan.md) ·
Tasks: [specs/017-feed-registros/tasks.md](specs/017-feed-registros/tasks.md) ← gerado pelo /speckit-tasks

Feed cru de registros (`/registros`): cards colapsáveis, dois eixos de tempo, busca textual,
filtros combináveis, exclusão, grade-faísca (estilo GitHub). Painel aponta pro feed via
"Ver tudo →". Extração ganha `title` gerado no mesmo turno Haiku. Migration `01X` (número
confirmar no kickoff — provável `011` após 015→016 mergeadas).

Shape: [specs/017-feed-registros/shape.md](specs/017-feed-registros/shape.md) ✅

Próximos passos: implementar — começar pela Phase 1 (T001) → Phase 2 → US1 (T010–T018).
<!-- SPECKIT END -->
