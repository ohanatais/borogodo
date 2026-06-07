# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features entregues e mergeadas em `main`:
- **001-landing-page** — landing page pública, design system e i18n
- **002-user-auth** — autenticação (Google OAuth + e-mail/senha), painel protegido por
  middleware, criação automática de perfil via trigger no Supabase

Próximas features planejadas em `docs/mvp/`: esqueleto do painel (espelho vivo +
composer), onboarding via LinkedIn, pipeline de extração e geração do primeiro espelho.

O bloco abaixo é gerenciado automaticamente pelo speckit e aponta para a feature em
desenvolvimento no momento — pode estar à frente do que já foi mergeado.

<!-- SPECKIT START -->
Current feature: **002-user-auth**
Implementation plan: [specs/002-user-auth/plan.md](specs/002-user-auth/plan.md)
Spec: [specs/002-user-auth/spec.md](specs/002-user-auth/spec.md)
Research: [specs/002-user-auth/research.md](specs/002-user-auth/research.md)
Data model: [specs/002-user-auth/data-model.md](specs/002-user-auth/data-model.md)
Contracts: [specs/002-user-auth/contracts/ui-contracts.md](specs/002-user-auth/contracts/ui-contracts.md)
Quickstart: [specs/002-user-auth/quickstart.md](specs/002-user-auth/quickstart.md)
<!-- SPECKIT END -->
