# Implementation Plan: Registro como Depósito (fundação)

**Branch**: `025-registro-deposito` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-registro-deposito/spec.md`

## Summary

Substituir o caminho crítico de salvar um registro — hoje acoplado a uma chamada síncrona de IA
(Haiku, `captureAndReflect`) que pode rejeitar texto curto (`NoExtractableContentError`) e é
reroteado pro chat por um limiar de 150 caracteres no cliente — por um salvamento determinístico e
imediato, via um drawer estilo bloco de notas que sempre salva. Reusa a tabela `entries` e a coluna
`evidences` JSONB + bucket `evidence-files` (migration 007) sem nova migration. O caminho mais
próximo já existente (`handleMarcoCapture`, `kind: 'marco'`) vira a base do novo salvamento direto.
Acompanha uma reforma do Painel (saudação + gatilho único + "Suas forças" + "Registros recentes")
e da navegação (grupos "Meu espelho"/"Usar" + dark mode), conforme decidido no `/speckit-clarify`.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 15 (App Router, React Server Components
por padrão)

**Primary Dependencies**: `@supabase/supabase-js` (client + storage), `next-intl` (i18n),
`@radix-ui/react-dialog` (base do `ChatSheet`, reusado como padrão para o drawer desktop),
Framer Motion (entrada do drawer/bottom sheet), Zod (validação de payload), Lucide React (ícones).
**Nova dependência necessária**: um mecanismo de tema (ex.: `next-themes`) para ativar o dark mode
— hoje os tokens `.dark` existem em `globals.css` mas estão inertes (nenhum provider, nenhuma
classe `dark` é aplicada em lugar nenhum).

**Storage**: Supabase PostgreSQL — tabela `entries` (title, raw text, campos manuais, `evidences`
JSONB) já existente; bucket `evidence-files` (Supabase Storage, 10 MB máx, apenas
jpeg/png/webp/gif) já existente (migration 007). **Nenhuma migration nova.**

**Testing**: Vitest + Testing Library (unit + integration); TDD conforme constituição (Princípio VI)

**Target Platform**: Web — navegadores desktop e mobile (bottom sheet em viewport mobile)

**Project Type**: Aplicação web única (Next.js App Router) — sem separação frontend/backend

**Performance Goals**: Salvar um registro é síncrono e sub-segundo (SC-002) — nenhuma chamada de
IA no caminho crítico (FR-004). Upload de anexos (imagem) pode levar mais que isso, mas não
bloqueia o salvamento do texto/título (ver `research.md` para a decisão de ordenação).

**Constraints**: Sem nova migration; não pode quebrar `EvidenceSection.tsx`/`/historico` (mesma
estrutura `EvidenceItem`); dark mode limitado às superfícies que esta feature toca (Painel,
drawer, navegação) — não é um compromisso de dark mode para o produto inteiro (ver spec,
"Fora de escopo mesmo com a adoção da navegação nova").

**Scale/Scope**: Uso pessoal/dogfooding (Ohana + early users) — não é um caminho de alto volume;
prioriza corretude e sensação de "sempre salva" sobre otimização de throughput.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Notas |
|---|---|---|
| I. Security First | ✅ Pass | Reusa RLS já existente em `entries`/`storage.objects` (`auth.uid() = user_id`, path `${user.id}/...`). Nova rota de salvamento direto DEVE autenticar antes de qualquer lógica, como as rotas atuais. |
| II. TypeScript Strict & Code Quality | ✅ Pass (orienta breakdown) | Drawer grande será quebrado em subcomponentes (`Drawer`, `DrawerTextarea`, `AttachTile`, `SavedPanel`, `DetailsFields`) para respeitar <40 linhas/função e 1 componente por arquivo. |
| III. AI-First Architecture | ⚠️ Requer nota (não é violação) | A constituição exige Haiku para "todas as operações de extração/estruturação" — esta feature **não remove** essa capacidade, apenas a **desacopla do caminho síncrono de salvar** (decisão explícita da spec, Assumptions). A extração/estruturação por IA continua existindo e volta de forma assíncrona/opcional na feature `026-organizar-destaques`. Título deste build usa heurística local determinística (ver `research.md`), não chamada de IA. |
| IV. Server-First & Performance | ✅ Pass | Painel continua Server Component buscando dados (`getPanelData`); Drawer é client component por natureza (textarea, paste, drag-drop) — interatividade justifica `"use client"`. |
| V. Accessibility & WCAG AA | ✅ Pass (orienta tasks) | Drag-and-drop precisa de fallback acessível (botão "Imagem"/"Link" sempre visível, não só a área de soltar); foco visível em todos os elementos novos. |
| VI. Test-First Development | ✅ Pass (orienta tasks) | Testes primeiro para: heurística de título, rota de salvamento direto, anexos, `navModel` agrupado, toggle de tema. |
| VII. Borogodó Design Identity | ⚠️ Requer auditoria | Tokens do protótipo (`--surface-0/1/2`, `--text-primary/secondary/muted`, `--accent`, `--roxo`) não existem hoje — os nomes reais são `--background/--foreground/--card/--color-primary/--color-accent` etc. Necessário reconciliar nomenclatura (ver `research.md`) sem introduzir hex cru. `/impeccable shape` e `/impeccable audit` seguem obrigatórios no processo. |
| VIII. Mobile-First Architecture | ✅ Pass | Bottom sheet é o padrão mobile nativo da feature (FR-014); touch targets ≥48px em todos os novos elementos. |
| IX. i18n Architecture | ✅ Pass (orienta tasks) | Todo texto novo via `next-intl`, namespace a definir em `research.md` (extensão de `capture` vs namespace novo `registro`). |

Nenhuma violação bloqueante. A nota do Princípio III é uma clarificação de escopo (já fechada na
spec), não uma exceção que precise de justificativa em Complexity Tracking.

**Re-checagem pós-Fase 1** (após `research.md`/`data-model.md`/`contracts/`): gates continuam
passando. As duas notas (⚠️) foram resolvidas com decisões concretas: III → `research.md` §1/§5
confirma que `captureAndReflect`/Haiku permanecem no código para a feature B, só saem do caminho
síncrono de salvar; VII → `research.md` §10 decide não introduzir os nomes de token do protótipo
como sistema paralelo, reconciliando tudo sob os tokens canônicos já existentes em `globals.css`.

## Project Structure

### Documentation (this feature)

```text
specs/025-registro-deposito/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Fase 0 (/speckit-plan)
├── data-model.md         # Fase 1 (/speckit-plan)
├── quickstart.md         # Fase 1 (/speckit-plan)
├── contracts/             # Fase 1 (/speckit-plan)
│   └── capture.md
└── tasks.md              # Fase 2 (/speckit-tasks — ainda não criado)
```

### Source Code (repository root)

Aplicação única Next.js (App Router) — sem separação frontend/backend. Estrutura real afetada:

```text
src/
  app/
    api/
      capture/route.ts                 # MODIFICA: novo caminho de salvamento direto (drawer)
      entries/[id]/evidence/route.ts    # REUSA como está (upload imagem + link)
    [locale]/(app)/
      painel/page.tsx                   # MODIFICA: novo layout (saudação, gatilho, forças, recentes)
  components/
    features/
      capture/
        Drawer.tsx                      # NOVO: shell do drawer (desktop lateral / mobile bottom sheet)
        DrawerTextarea.tsx              # NOVO: bloco-de-notas sempre-salva (paste/drag de imagem)
        AttachTile.tsx                  # NOVO: tile de anexo (imagem/link) com miniatura real
        DetailsFields.tsx               # NOVO: "+ adicionar detalhes" (métrica/impacto/tags/empresa/data)
        SavedPanel.tsx                  # NOVO: confirmação pós-salvar com título editável
        CaptureInput.tsx                # MODIFICA ou REMOVE: gatilho vira o Drawer
        CaptureConversation.tsx         # REMOVE (substituído pelo Drawer + SavedPanel)
        CaptureComposer.tsx             # REMOVE (confirmado órfão na investigação)
        AudioButton.tsx / AudioRecorder.tsx  # REUSA como está (áudio → texto no Drawer)
      painel/
        HomeGreeting.tsx                # NOVO: saudação personalizada
        RegistroTrigger.tsx             # NOVO: gatilho único (borda coral), abre o Drawer
        SuasForcas.tsx                  # NOVO: resumo compacto + link "Ver espelho"
        RegistrosRecentes.tsx           # NOVO: até 3 registros + "Ver todos"
        NewAccountPrompt.tsx            # NOVO: modo "novo" (gatilho + Espelho como promessa + progresso 0/3)
        BorogodoCard.tsx, ReviewCycleInvite.tsx, PainelChatDoor.tsx, TrajectoryHighlights.tsx,
        ProactiveInsightCard.tsx, RecentEntries.tsx  # AVALIA reuso/substituição por componente acima
    layout/
      navModel.ts                       # MODIFICA: adiciona grupos (Meu espelho / Usar) mantendo lista mobile
      AppShellClient.tsx                # MODIFICA: remove Segmented "Registrar|Perguntar", integra Sidebar agrupada
    providers/
      ThemeProvider.tsx                 # NOVO: ativa dark mode (classe `dark` em `<html>`)
    ui/
      ThemeToggle.tsx                   # NOVO
  lib/
    capture/
      buildEntryTitle.ts                # NOVO: heurística determinística de título (primeira linha, truncada)
      saveDeposito.ts                   # NOVO: orquestra insert de entry + anexos pendentes, sem IA
    ai/extraction/captureAndReflect.ts  # MANTÉM (usado pelo caminho `kind: 'text'` legado/feature B), não removido do produto
  messages/
    pt-BR.json / en.json                # MODIFICA: novo namespace (ver research.md)

tests/
  unit/lib/capture/buildEntryTitle.test.ts       # NOVO
  integration/api/capture-deposito.test.ts       # NOVO
  integration/painel/painel-empty-state.test.tsx # MODIFICA
  integration/nav/nav-groups.test.tsx            # NOVO
```

**Structure Decision**: aplicação única (não há opção 2/3 do template — sem frontend/backend
separados nem mobile/API nativos). Reuso máximo do que já existe (`/api/entries/[id]/evidence`,
`saveEntries`, `AudioButton/AudioRecorder`, `getPanelData`, `FIRST_MIRROR_MIN_ENTRIES`); os
componentes de captura antigos (`CaptureConversation`, `CaptureComposer`) são removidos, não
mantidos em paralelo, para não deixar dois caminhos de salvar coexistindo.

## Complexity Tracking

*Sem violações de constituição a justificar — ver Constitution Check acima. As duas notas (⚠️)
são clarificações de escopo já fechadas na spec/clarify, não exceções.*
