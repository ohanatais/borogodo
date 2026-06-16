# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro. Contexto
completo de produto, stack e processo de desenvolvimento está em `.claude/CLAUDE.md`.

## Status do desenvolvimento

Features mergeadas em `main` (até PR #23):
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

<!-- SPECKIT START -->
Current feature: **015-refino-voz** (branch: `015-refino-voz`) — **validada**, PR #24 ready for review
Spec: [specs/015-refino-voz/spec.md](specs/015-refino-voz/spec.md) ·
Tasks: [specs/015-refino-voz/tasks.md](specs/015-refino-voz/tasks.md)

Terceiro e último elo do bloco de Geração de Conteúdo (Presença) — epic plan em
`docs/conteudo-plano-de-acao.md`. Migration `010` (estende o CHECK de `drafts.format` para
`mini_bio`) — **aplicada no dev `borogodo-dev`; prod pendente** (aplicar antes do deploy).
Implementado: recalibração de voz com consentimento — `recalibrateVoice` (preserva amostras),
`POST /api/content/voice/recalibrate` (sugerir/aplicar), `VoiceRecalibratePrompt` no topo do
`/presenca`, gate de sugestão no servidor via `getVoiceSignal` (≥3 "não soa") (US1); golden set
como gate dedicado e obrigatório no `ci.yml`, determinístico, + meta-regressão (US2); mini-bio
como 3º formato no mesmo motor — `prompts/miniBio.ts` anti-clichê, opção no seletor (tema →
post + mini-bio) (US3). Code-review + security-review feitos; sem CRITICAL/HIGH. Validada manualmente.
Pendente: `/impeccable audit` + `/pr-review` + migration `010` no prod antes do deploy.

**Bloco da Presença (fechado):**
- **013-motor-de-voz** — fundação + post + resumo de impacto (migration `009`). ✅ mergeada.
- **014-presenca** — hub + gestão total + "Usar" projeto + sugestões. ✅ mergeada (PR #23).
- **015-refino-voz** — recalibração de voz + golden set como gate de CI + mini-bio (migration `010`). 🔄 em revisão.

Dependência: 013 → 014 → 015. Respeitar a ordem (`009` antes de `010`).
<!-- SPECKIT END -->
