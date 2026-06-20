# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #24):
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

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

<!-- SPECKIT START -->
Current feature: **017-repertorio-intencao** (branch: `017-repertorio-intencao`) — **implementação concluída; aguardando `/impeccable audit` + `/pr-review` antes do merge**
Spec: [specs/017-repertorio-intencao/spec.md](specs/017-repertorio-intencao/spec.md) ·
Plan: [specs/017-repertorio-intencao/plan.md](specs/017-repertorio-intencao/plan.md) ·
Tasks: [specs/017-repertorio-intencao/tasks.md](specs/017-repertorio-intencao/tasks.md)

Pivô da camada "Usar" → **Repertório**: `/presenca` reorganizada num launchpad de dois hubs por
intenção (MOSTRAR: post/bio · PREPARAR: entrevista/review/salário com bifurcação pronto/conversar),
convite central no Painel e entrada de Bio no Espelho. **Reorganização de IA e pontos de entrada,
não motor novo** — zero migration (o "momento" é um `angle` sobre `impact_summary` + rótulo em
`drafts.qa.moment`). Gap real corrigido: `GenerateSheet` agora envia o `angle` que a API já aceitava.
Rota `/presenca` intacta (rename só de rótulo). 684 testes passando, build e `tsc` limpos.

Feature anterior: **016-captura-v2** — planejamento concluído; implementação não iniciada.
Spec: [specs/016-captura-v2/spec.md](specs/016-captura-v2/spec.md) ·
Plan: [specs/016-captura-v2/plan.md](specs/016-captura-v2/plan.md) ·
Tasks: [specs/016-captura-v2/tasks.md](specs/016-captura-v2/tasks.md)

Primeira aposta de retenção pós-Presença — ataca o gargalo no **input** (alimentar dado fresco), não no
output. Discovery em `docs/discovery-retencao-e-conteudo.md` (§1/§3/§8). Quatro frentes, **reusando** o
pipeline existente: **US1** colar artefato vira N entradas (reusa extração+`saveEntries`; novo só o
resumo "criei N entradas"+desfazer e o limite de tamanho); **US2** ressurgimento por **delta** ("≥1
entrada nova desde o último retorno", substitui o nudge por relógio); **US3** áudio via **Web Speech**
client-side (sem servidor); **US4** pergunta cirúrgica assíncrona via `proactive_insights`+`ReflectionCard`.
Spec ✅, clarify ✅, plan ✅, research ✅, tasks ✅. **Gates antes de codar:** `/impeccable shape` do
ressurgimento (US2) e da gravação (US3).

**Migration:** footprint **0–1**. US1/US3/US4 não tocam schema. Única candidata: coluna
`profiles.last_panel_seen_at` (`011`) para o delta da US2 — **decisão aberta** (Opção A migration / B
localStorage), a fechar na fase da US2 (tasks T006/T012).
<!-- SPECKIT END -->
