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
- **017-feed-registros** — feed cru de registros (`/registros`), cards colapsáveis, busca/filtros, grade-faísca (PR #51)
- **020-canal-suporte** — canal de contato/suporte pré-launch: `ContactCard` reutilizável (e-mail copiável via `lib/clipboard.ts`, LinkedIn secundário, SLA) no rodapé da LP (`Footer`) e em `/configuracoes`; i18n namespace `support` (PR #54)
- **021-navegacao-espinha** — reforma de IA: menu de 6 → 4 destinos (Painel, Espelho c/ Forças+Trajetória, Registros, Usar), `Segmented` único, chat como porta no Painel (PR #55)

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **024-termos-privacidade** (branch: `024-termos-privacidade`) — **Termos de Uso + Política de Privacidade (páginas em URLs dedicadas `/termos-de-uso` e `/politica-de-privacidade`) + consentimento auditável (LGPD). Spec ✅ clarify ✅ plan ✅**

> Escopo: estrutura das páginas (conteúdo jurídico é placeholder — Ohana escreve depois), vínculos
> (Footer + `/configuracoes`), e o mecanismo de aceite. Aceite de Termos via **sign-in-wrap** (aviso +
> links, sem checkbox; base legal LGPD = execução de contrato), **registrado server-side** (`terms_accepted_at`
> + `terms_version`). Marketing é consentimento **separado, desligado por padrão** (checkbox no cadastro por
> e-mail; Google só liga em configurações; **onboarding livre de marketing**, decisão da Ohana). Registro do aceite na camada de render:
> onboarding carimba novos usuários; gate em `(app)/layout.tsx` (3º check: `terms_version != CURRENT`) cobre
> contas existentes e bumps de versão → `/consentimento`. Fonte única em `src/lib/legal/policy.ts`.
> **Migration `015_profiles_consent.sql`** (3 colunas em `profiles`, aditiva). FORA: texto jurídico, cookie
> banner, direitos-do-titular (exclusão/portabilidade), histórico multi-versão de aceites.
Spec: [specs/024-termos-privacidade/spec.md](specs/024-termos-privacidade/spec.md) ·
Plan: [specs/024-termos-privacidade/plan.md](specs/024-termos-privacidade/plan.md) ·
Research: [specs/024-termos-privacidade/research.md](specs/024-termos-privacidade/research.md) ·
Data-model: [specs/024-termos-privacidade/data-model.md](specs/024-termos-privacidade/data-model.md) ·
Contracts: [specs/024-termos-privacidade/contracts/consent.md](specs/024-termos-privacidade/contracts/consent.md) ·
Quickstart: [specs/024-termos-privacidade/quickstart.md](specs/024-termos-privacidade/quickstart.md) ·
Tasks: [specs/024-termos-privacidade/tasks.md](specs/024-termos-privacidade/tasks.md) (42 tasks, 7 fases; MVP = Foundational + US1)
<!-- SPECKIT END -->
