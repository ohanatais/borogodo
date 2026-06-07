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
Current feature: **003-capture-pipeline**
Implementation plan: [specs/003-capture-pipeline/plan.md](specs/003-capture-pipeline/plan.md)
Spec: [specs/003-capture-pipeline/spec.md](specs/003-capture-pipeline/spec.md)
Data model: [specs/003-capture-pipeline/data-model.md](specs/003-capture-pipeline/data-model.md)
Contracts: [specs/003-capture-pipeline/contracts/capture-api.md](specs/003-capture-pipeline/contracts/capture-api.md)
Quickstart: [specs/003-capture-pipeline/quickstart.md](specs/003-capture-pipeline/quickstart.md)
<!-- SPECKIT END -->
