# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #22):
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

<!-- SPECKIT START -->
Current feature: **014-presenca** (branch: `014-presenca`) — **em revisão** (PR #23, draft)
Spec: [specs/014-presenca/spec.md](specs/014-presenca/spec.md) ·
Tasks: [specs/014-presenca/tasks.md](specs/014-presenca/tasks.md)

Segundo elo do bloco de Geração de Conteúdo (Presença) — epic plan em
`docs/conteudo-plano-de-acao.md`. **Sem migration** (usa `status='discarded'` e a RLS de
`delete` da 013). Implementado: hub `/presenca` + nav (US1), gestão total do rascunho —
editar/arquivar/excluir/restaurar/filtrar, em lista densa (US2), "Usar este projeto" no
`/historico` com evidência agregada (US3), e sugestões — nudge `content_opportunity` no
Painel + faixa "Sugestões pra você" na Presença (US4). Inclui conserto da dedup de entradas
(`saveEntries`): normalização + dedup semântica sem exigir empresa + dedup no lote.
Pendente: `/impeccable audit` + `/security-review` + `/pr-review` antes de marcar pronto.

**Bloco da Presença:**
- **013-motor-de-voz** — fundação + post + resumo de impacto (migration `009`). ✅ mergeada.
- **014-presenca** — hub + gestão total + "Usar" projeto + sugestões. 🔄 em revisão (PR #23).
- **015-refino-voz** — recalibração de voz + golden set como gate de CI + mini-bio (migration `010`).

Dependência: 013 → 014 → 015. Respeitar a ordem (`009` antes de `010`).
<!-- SPECKIT END -->
