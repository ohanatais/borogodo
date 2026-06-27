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

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **021-navegacao-espinha** (branch: `021-navegacao-espinha`) — **reforma de IA: o menu expressa a espinha; 6 → 4 destinos. Spec ✅ clarify ✅ plan ✅ · IMPLEMENTADA + refinada numa revisão de design (PR aberto)**

> **Decisão:** `docs/decisions/001-arquitetura-de-navegacao.md`. O menu cresceu feature a feature
> e virou 6 portas paralelas que misturam camadas. Esta reforma colapsa para **4 destinos = os
> movimentos da espinha** (Descobrir→Entender→Provar→Usar): **Painel** (Home), **Espelho**
> (absorve a Linha do Tempo como 2ª vista — Forças + Trajetória), **Registros** (log cru),
> **Usar** (landing que roteia: pra fora → Repertório/`/presenca`; pra dentro → `/autoavaliacao`).
> **Reorganização, não reescrita** — telas existentes são re-parentadas/re-roteadas (a Trajetória
> reusa o `HistoricoPageClient` inteiro). **Sem migration.** `impact_summary` sai das listas
> oferecidas, fica no enum/motor. Princípio fixado: a Home é estruturada/proativa; o **chat é
> ferramenta onipresente, nunca a Home** (porta de conversa aditiva no topo do Painel).
> **4 fases independentes e testáveis** (US1 menu+landing · US2 Espelho 2 vistas · US3 porta do
> Painel · US4 limpeza de formato). **Me preparar** (generalizar a Autoavaliação para novos
> momentos) é feature futura separada, fora desta.
>
> **Refinos de execução (revisão de design pós-implementação — o que ficou diferente da spec):**
> - **Painel** colapsou pra coluna única (hero → porta de chat → conquistas → insight → recentes).
>   Saíram o `UsarInvite` (vivia no destino Usar) e a `MiniTimeline` (vive no Espelho→Trajetória);
>   query de timeline morta removida do `getPanelData`. A **porta de chat** (US3) ganhou copy que
>   ensina ("Pergunte qualquer coisa… ex.: 'o que me destaca?'") — o gap real era descoberta.
> - **Usar**: o splash de intenção foi mantido, mas cada caminho abre um **hub ESCOPADO**
>   (`/presenca?hub=mostrar|preparar`) — antes mostrava os dois hubs ("tudo tudo"). Título e
>   "Voltar" por hub. A **Autoavaliação** virou card permanente do hub PREPARAR (não se perde).
> - **Espelho**: Forças/Trajetória alinham no mesmo container (sem `max-w/px` duplicado); título da
>   Trajetória virou intro (h2). Temas de força viraram **tags de leitura** — saíram o "Usar" por
>   tema e o "Criar bio" (o Espelho é contemplação, ação vive no Usar).
> - **Design system**: um **`Segmented`** único (`components/ui/Segmented.tsx`) padroniza os 3
>   toggles (Espelho, Registros, Registrar/Perguntar). `impact_summary` ("Pra falar") saiu também
>   do filtro de rascunhos.
> - **Bio**: deixou de ancorar num tema fixo — **a pessoa escolhe o foco** antes de gerar (Geral +
>   temas). A evidência da mini-bio já era ampla; o prompt já mira formato LinkedIn ("Sobre").
> - **Shell**: frame de altura fixa (`h-dvh`/overflow) — só o conteúdo rola, sem rubber-band.
Spec: [specs/021-navegacao-espinha/spec.md](specs/021-navegacao-espinha/spec.md) ·
Plan: [specs/021-navegacao-espinha/plan.md](specs/021-navegacao-espinha/plan.md) ·
Research: [specs/021-navegacao-espinha/research.md](specs/021-navegacao-espinha/research.md) ·
Data-model: [specs/021-navegacao-espinha/data-model.md](specs/021-navegacao-espinha/data-model.md) ·
Contracts: [specs/021-navegacao-espinha/contracts/routes.md](specs/021-navegacao-espinha/contracts/routes.md) ·
Quickstart: [specs/021-navegacao-espinha/quickstart.md](specs/021-navegacao-espinha/quickstart.md) ·
Tasks: (pendente — `/speckit-tasks`)
<!-- SPECKIT END -->
