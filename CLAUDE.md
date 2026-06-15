# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #18):
- **001-landing-page** — landing page pública, design system e i18n
- **002-user-auth** — autenticação (Google OAuth + e-mail/senha), painel protegido por middleware
- **003-capture-pipeline** — captura de texto e PDF/LinkedIn, extração via IA com Zod
- **004-mirror-generation** — geração do espelho via Sonnet, regeneração automática
- **005-panel-dashboard** — painel com composer, indicadores, insight proativo, entradas recentes
- **006-espelho-honesto** — página do espelho com categorias macro, evidências e feedback
- **007-painel-redesign** — BorogodoCard, trajetória em destaque, mini timeline
- **008-historico-nav** — AppShell com navegação, Linha do Tempo (`/historico`)
- **009-perfil-onboarding** — Central de Configurações (`/configuracoes`) + onboarding WOW/AHA

<!-- SPECKIT START -->
Current feature: **010-produto-polish** (branch: `010-produto-polish`)
Tasks: [specs/010-produto-polish/tasks.md](specs/010-produto-polish/tasks.md)

17 itens de refinamento resultantes de audit completo (verify) em 2026-06-14.
Executar em ordem: Fase 1 (T01–T03) → Fase 2 (T04–T06) → Fase 3 (T07–T10) →
Fase 4 (T11–T14) → Fase 5 (T15–T17). Ver tasks.md para detalhes de cada item.
<!-- SPECKIT END -->
