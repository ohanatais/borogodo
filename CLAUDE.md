# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main`:
- **001-landing-page** — landing page pública, design system e i18n
- **002-user-auth** — autenticação (Google OAuth + e-mail/senha), painel protegido por middleware
- **003-capture-pipeline** — captura de texto e PDF/LinkedIn, extração via IA com Zod
- **004-mirror-generation** — geração do espelho via Sonnet, regeneração automática
- **005-panel-dashboard** — painel com composer, indicadores, insight proativo, entradas recentes
- **006-espelho-honesto** — página do espelho com categorias macro, evidências e feedback
- **007-painel-redesign** — BorogodoCard, trajetória em destaque, mini timeline
- **008-historico-nav** — AppShell com navegação, Linha do Tempo (`/historico`)

Próxima feature em branch `009-perfil-onboarding` (a criar após merge de 008):
- **009-perfil-onboarding** — Central de Configurações (`/configuracoes`) + onboarding WOW/AHA

<!-- SPECKIT START -->
Current feature: **009-perfil-onboarding**
Tasks: [specs/009-perfil-onboarding/tasks.md](specs/009-perfil-onboarding/tasks.md)
Implementation plan: [specs/009-perfil-onboarding/plan.md](specs/009-perfil-onboarding/plan.md)
Spec: [specs/009-perfil-onboarding/spec.md](specs/009-perfil-onboarding/spec.md)
Data model: [specs/009-perfil-onboarding/data-model.md](specs/009-perfil-onboarding/data-model.md)
<!-- SPECKIT END -->
