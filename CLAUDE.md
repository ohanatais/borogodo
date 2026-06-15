# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #21):
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

<!-- SPECKIT START -->
Current feature: **013-motor-de-voz** (branch: `013-motor-de-voz`) — **em planejamento**
Spec: [specs/013-motor-de-voz/spec.md](specs/013-motor-de-voz/spec.md) ·
Tasks: [specs/013-motor-de-voz/tasks.md](specs/013-motor-de-voz/tasks.md)

Primeiro elo do bloco de Geração de Conteúdo (Presença) — epic plan em
`docs/conteudo-plano-de-acao.md`. Trava a fundação compartilhada (`drafts`,
`voice_profile` JSONB, `src/lib/ai/content/`, golden set) e os formatos âncora
(post + resumo de impacto). Artefatos speckit completos (spec/plan/tasks/shape)
prontos; **implementação ainda não iniciada** (decisão: planejar e codar em sessões
separadas). Kickoff resolvido: nav "Presença" (rota `/presenca` entra na 014),
`voice_profile` como JSONB, próxima migration `009`.

**Bloco inteiro planejado** (a cadeia da Presença):
- **013-motor-de-voz** — fundação + post + resumo de impacto (migration `009`).
- **014-presenca** — hub `/presenca` + nav + "Usar" no projeto + nudge proativo (sem migration).
- **015-refino-voz** — recalibração de voz + golden set como gate de CI + mini-bio (migration `010`).

Dependência: 013 → 014 → 015. Ohana pretende implementar em batch; respeitar a ordem
(fundação da 013 antes de 014; `009` antes de `010`).
<!-- SPECKIT END -->
