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
- **023-freio-de-custo** — limite/hora + trava diária US$10 + alertas operacionais de IA (PR #57)
- **024-termos-privacidade** — Termos de Uso + Política de Privacidade + consentimento auditável (LGPD), migration `015` (PR #58)
- **025-registro-deposito** — drawer bloco-de-notas que sempre salva (sem IA no caminho crítico), anexo de imagem/link de primeira classe (clique/colar/arrastar), confirmação editável, campos manuais opcionais; Painel novo (saudação + gatilho único + Suas forças + Registros recentes) e navegação em grupos + dark mode (PR #59)

**Bloco da Presença (fechado):** 013 → 014 → 015 mergeadas. Migrations `009` e `010` aplicadas em
**dev e prod** (`borogodo`). Respeitar a ordem (`009` antes de `010`).

**Fatiamento Registro-como-depósito (A → B → C, `docs/decisions/003-registro-deposito-e-captura.md`):**
Feature A (`025-registro-deposito`) mergeada (PR #59). Feature B é esta (`026`); Feature C
(`027-importar-historico`) depende de B.

<!-- SPECKIT START -->
Current feature: **026-organizar-destaques** (branch: `026-organizar-destaques`) — **Organizar +
destaques: botão opcional 'Organizar' (Haiku, só preenche campos vazios) + organização
assíncrona disparada pelo salvar; registro = FONTE com destaques dentro (layout dois níveis, não
splitar fonte de um evento); Registros reestruturado (miniatura real, feed 1 card/fonte,
timeline por mês, grade-faísca sem streak). Spec ✅**

> Depende da Feature A (`025-registro-deposito`, PR #59, mergeada) já implementada: reusa o
> drawer sempre-salva, `Entry.raw_content` (cru verbatim), `EntrySource: 'deposito'` e
> `evidences`/bucket `evidence-files`. Escopo desta feature começa depois do salvar: estruturação
> por IA opcional, destaques dentro da fonte, e a reestruturação de Registros. Cru preservado
> sempre; geração/RAG leem a fonte, não o resumo. Provavelmente sem migration nova (a decidir no
> `/speckit-plan`). Contexto: `docs/decisions/003-registro-deposito-e-captura.md`.
Spec: [specs/026-organizar-destaques/spec.md](specs/026-organizar-destaques/spec.md) ·
Plan: (pendente — `/speckit-clarify` → `/speckit-plan`)
<!-- SPECKIT END -->
