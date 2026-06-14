# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features entregues e mergeadas em `main`:
- **001-landing-page** — landing page pública, design system e i18n
- **002-user-auth** — autenticação (Google OAuth + e-mail/senha), painel protegido por
  middleware, criação automática de perfil via trigger no Supabase

Em PR no momento:
- **003-capture-pipeline** — captura de texto e import de PDF/LinkedIn, extração via IA
  validada por Zod, e enriquecimento de campos sem IA (PR #6)

Próximas features planejadas em `docs/mvp/`: geração do primeiro espelho (004-mirror),
painel com insights proativos (005-panel) e o que vier depois.

O bloco abaixo é gerenciado automaticamente pelo speckit e aponta para a feature em
desenvolvimento no momento — pode estar à frente do que já foi mergeado.

<!-- SPECKIT START -->
Current feature: **006-espelho-honesto**
Implementation plan: [specs/006-espelho-honesto/plan.md](specs/006-espelho-honesto/plan.md)
Spec: [specs/006-espelho-honesto/spec.md](specs/006-espelho-honesto/spec.md)
Data model: [specs/006-espelho-honesto/data-model.md](specs/006-espelho-honesto/data-model.md)
Contracts: [specs/006-espelho-honesto/contracts/mirror-output.md](specs/006-espelho-honesto/contracts/mirror-output.md)
Quickstart: [specs/006-espelho-honesto/quickstart.md](specs/006-espelho-honesto/quickstart.md)
<!-- SPECKIT END -->
