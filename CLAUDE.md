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

## Pronta para PR (implementação completa, aguardando merge)

- **026-organizar-destaques** (branch: `026-organizar-destaques`) — implementação completa das 7
  user stories (US1-US7, T001-T062) + Polish (T063-T068): botão opcional "Organizar" (Haiku, só
  preenche campos vazios) infere métrica/impacto/tags/período; contexto por seletor de pílulas
  determinístico (empresas já usadas + "Projeto pessoal" + "Outro", sem IA, precedência sobre
  inferência); organização assíncrona disparada pelo salvar (fire-and-forget); registro = FONTE
  com múltiplos destaques dentro (`entry_highlights`); tags reaproveitam o vocabulário já usado
  pela pessoa; título outcome-first protegido de sobrescrita; Registros reestruturado
  (`SourceCard`, miniatura real, selo "+N destaques", timeline por mês, grade-faísca sem streak).
  Code-review high pós-implementação encontrou e corrigiu uma corrida real entre o guard de
  `organizing_started_at` do clique manual e o disparo assíncrono (US1 × US3) — ver
  `src/lib/entries/organizingLock.ts`. Impeccable audit corrigiu 3 alvos de toque abaixo de 48px.
  1128 testes passando, `tsc --noEmit` limpo.
  **Pendências antes do merge:**
  - Migration `016_entry_highlights.sql` ainda **não aplicada** em dev nem prod — bloqueio de
    segurança do MCP Supabase (não confirma automaticamente que é o projeto de dev autorizado);
    requer a Ohana rodar manualmente ou conceder a permissão.
  - Roteiros manuais de `specs/026-organizar-destaques/quickstart.md` (US1-US7) não rodados fim a
    fim contra o app de verdade — depende da migration acima estar aplicada.
  - Abrir o PR (branch pronta, não commitada nenhuma alteração além do que está aqui).
  Ver `specs/026-organizar-destaques/tasks.md` (Phase 10) para o detalhe completo do que foi
  verificado em cada item de polish.

<!-- SPECKIT START -->
Sem feature em especificação ativa no momento — a `026-organizar-destaques` está com
implementação completa (ver "Pronta para PR" acima), só falta migration/validação manual e o
merge. A próxima é `027-importar-historico`, que depende de `026` estar mergeada (ver
fatiamento acima). Referências da 026: Spec
[specs/026-organizar-destaques/spec.md](specs/026-organizar-destaques/spec.md) · Plan
[specs/026-organizar-destaques/plan.md](specs/026-organizar-destaques/plan.md) · Tasks
[specs/026-organizar-destaques/tasks.md](specs/026-organizar-destaques/tasks.md) (68 tasks, 10
fases, todas concluídas) · Shape de UX
[specs/026-organizar-destaques/ux-shape.md](specs/026-organizar-destaques/ux-shape.md).
<!-- SPECKIT END -->
