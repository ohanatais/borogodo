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
- **017-feed-registros** — feed cru de registros (`/registros`), cards colapsáveis, dois eixos de tempo, busca/filtros, grade-faísca (PR #43)

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **019-autoavaliacao** (branch: `019-autoavaliacao`) — **REDESENHADA 2026-06-19 (modelo cockpit); re-spec feita, reimplementação pendente**

> ⚠️ **Redesign (2026-06-19):** a autoavaliação deixou de ser "IA gera 2 variações → edita/copia"
> (herdado do post) e virou **cockpit: lembrar → refletir → planejar** — **o usuário escreve a
> própria autoavaliação**, a IA só ancora em fato e oferece um passo-pra-frente não-invasivo. Tese
> dos **dois modos** (pra dentro = usuário escreve/IA ancora; pra fora = IA assiste). Direção +
> pesquisa de mercado: `docs/estrategia-autoavaliacao-cockpit.md`, `docs/mercado.md`,
> `docs/mapa-competitivo.md`. Spec reescrita: `specs/019-autoavaliacao/spec.md` (Clarifications
> 2026-06-19 + user stories novas; as antigas estão no anexo "SUPERADAS"). **Fundação da PR 46 é
> reaproveitada** (seed period, formato self_assessment, migration 013, nav, histórico, estado
> limitado); o **fluxo de post (GenerateSheet/DraftCard) é descartado** como modelo da autoavaliação.
> Próximo: `/speckit-tasks` (regerar — `tasks.md` atual é do modelo antigo) + `/impeccable shape` da
> cabine de escrita; **Espelho v2** (incorporar autopercepção) é a propagação seguinte.
Spec: [specs/019-autoavaliacao/spec.md](specs/019-autoavaliacao/spec.md) ·
Plan: [specs/019-autoavaliacao/plan.md](specs/019-autoavaliacao/plan.md) ·
Research: [specs/019-autoavaliacao/research.md](specs/019-autoavaliacao/research.md) ·
Tasks: (pendente — regerar com `/speckit-tasks`)

Quarto elo de retenção — **segundo payoff episódico**, modelo **cockpit**. A pessoa escolhe um
**período** → vê **"o seu ano, em fatos"** (recap determinístico, factual, com fonte — **sem LLM**) →
**escreve** a própria autoavaliação por seções, com trilha de evidências ao lado e IA **não-invasiva**
(reescreve com minhas palavras / "não sei por onde começar" = 1 pergunta cuja resposta vira o rascunho / nudge STAR — nunca gera bloco, nunca dá
nota) → recebe **uma** oferta de **passo-pra-frente** (plano GROW+70-20-10 ou prep de 1:1) ancorada nas
palavras dela. **US1** recap (`lib/autoavaliacao/periodRecap.ts`, sobre `loadPeriodSeed`) + escrita
assistida (`lib/ai/content/assist.ts`, rota `/api/autoavaliacao/assist`); **US2** passo-pra-frente
(`/api/autoavaliacao/forward-step`, único LLM gerador, anti-invenção bloqueante, salvo em
`drafts.qa.forwardStep`) + gatilho de calendário (`getReviewCycleSignal` paralelo ao `getReturnSignal`
da 016, só painel, sem e-mail); **US3** histórico em `drafts` (isolado do espelho). **Sai do código:** o
ramo `self_assessment` de `generateDraft`, `prompts/selfAssessment.ts`, e a extensão de
`/api/content/generate`. Spec ✅, clarify ✅, plan ✅, research ✅, data-model ✅, contracts ✅, quickstart
✅, tasks ⬜ (regerar). **Gate antes de codar:** `/impeccable shape` da cabine de escrita.

**Migration 013** (renumerada de 012 — colidia com `012_entry_title.sql` da 017, já em `main`): estende
os CHECKs de `drafts` (`format` += `self_assessment`, `seed_type` += `period`, `status` += `draft`) **e**
adiciona `profiles.review_cycle_months` + `review_cycle_anchor` (aditivo, nullable). A autoavaliação
**escrita** vive em `drafts` (`status='draft'`, `body` = texto humano, fora do ruleset anti-IA). Sem
recorrência → gatilho proativo não dispara; escrita sob demanda nunca bloqueia.
<!-- SPECKIT END -->
