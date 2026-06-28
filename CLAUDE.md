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
Current feature: **022-landing-rebuild** (branch: `022-landing-rebuild`) — **rebuild da landing page: narrativa dos 4 verbos + pilar Provas + propriedade do dado + SEO/GEO 100% + mídia real via slots. Spec ✅ clarify ✅ plan ✅**

> Mescla decidida em `docs/decisions/001-landing-page-rebuild.md`: a issue #36 manda na
> narrativa, voz e estrutura (headline da dor, eyebrow estilo dicionário, 4 verbos, CTA único,
> sem depoimento fake); a auditoria de mercado entra como camada técnica de SEO/GEO (H1 único,
> JSON-LD Software+Org+FAQ, llms.txt, SSR, crawlers de IA, meta/OG humanas) e reforço dos
> diferenciais (Provas e "seu, não da sua empresa"). Os mockups fake (`MirrorMockup`,
> `CareerMapMockup`, `ContentGenSection`) saem; entram slots de mídia (`MediaSlot`) com
> placeholder agora, mídia real depois (vídeo do onboarding no hero + screenshot do card de
> força em Provas). **Sem migration, sem API nova, sem dado de usuário.** Risco real é
> conteúdo/voz (gate humano da Ohana). Hub de conteúdo e consenso off-site ficam FORA (trilha
> GTM separada).
Spec: [specs/022-landing-rebuild/spec.md](specs/022-landing-rebuild/spec.md) ·
Plan: [specs/022-landing-rebuild/plan.md](specs/022-landing-rebuild/plan.md) ·
Research: [specs/022-landing-rebuild/research.md](specs/022-landing-rebuild/research.md) ·
Data-model: [specs/022-landing-rebuild/data-model.md](specs/022-landing-rebuild/data-model.md) ·
Contracts: [specs/022-landing-rebuild/contracts/landing.md](specs/022-landing-rebuild/contracts/landing.md) ·
Quickstart: [specs/022-landing-rebuild/quickstart.md](specs/022-landing-rebuild/quickstart.md) ·
Tasks: (pendente — `/speckit-tasks`)
<!-- SPECKIT END -->
