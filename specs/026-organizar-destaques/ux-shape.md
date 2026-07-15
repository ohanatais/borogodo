# UX Shape: Organizar + Destaques

**Produzido por**: `/impeccable shape` (passo 5 do processo obrigatório)
**Input**: `spec.md`, `plan.md`, `data-model.md`, `contracts/organize.md`, `contracts/feed.md`,
`PRODUCT.md`/`DESIGN.md` (via `context.mjs`), componentes existentes (`EntryCard.tsx`,
`ActivityGrid.tsx`, `SavedPanel.tsx`, `DetailsFields.tsx`).

**Nota de processo**: esta é uma sessão delegada (subagent) sem canal interativo para
`AskUserQuestion` em tempo real com a Ohana. A Fase 1 (Discovery Interview) do comando `shape`
normalmente é uma conversa; aqui ela foi respondida a partir dos documentos já produzidos nas
etapas anteriores (spec com 7 user stories detalhadas + edge cases, plan com decisões técnicas,
contratos de API) e do PRODUCT.md/DESIGN.md do projeto — que juntos já respondem a maior parte
das perguntas de propósito, conteúdo, direção visual e escopo. A Fase 1.5 (probes visuais) foi
pulada porque este ambiente não tem geração de imagem nativa. **A confirmação final (Fase 2) fica
pendente da revisão da Ohana antes do `/speckit-implement`** — este documento é a proposta a
confirmar ou corrigir, não uma aprovação já dada.

---

## 1. Feature Summary

"Organizar + destaques" transforma um registro cru salvo (feature 025) em um registro estruturado
com um ou mais destaques (wins/aprendizados) dentro dele, mais um contexto (empresa/projeto
pessoal) resolvido de forma determinística por pílula. Serve profissionais brasileiros que
registram no calor do momento e querem, depois, ver aquele registro virar prova de carreira
(métrica, impacto, tags, título) sem terem que preencher tudo à mão nem perder o texto original.

## 2. Primary User Action

Duas ações primárias, de peso equivalente:

1. **Clicar "Organizar"** (ou deixar a organização assíncrona rodar sozinha) e ver os campos
   estruturados aparecerem editáveis — sem nunca perder o que já foi preenchido manualmente.
2. **Selecionar uma pílula de contexto** (empresa já usada, "Projeto pessoal", ou "Outro") em um
   clique, sem digitação, resolvendo de forma confiável onde aquele registro pertence.

## 3. Design Direction

- **Register**: `product` (app autenticado, Registros/`/registros`) — não é a LP. Design SERVE o
  produto: familiaridade ganha de linguagem existente, não reinvenção.
- **Color strategy**: **Restrained** — mesma linha já em uso no feed (`EntryCard`, `ActivityGrid`):
  tokens `var(--card)`/`var(--border)`/`var(--muted)`/`var(--muted-foreground)` como base neutra,
  `var(--color-primary)` (roxo-jambo) reservado para estado ativo/seleção/ação primária, coral-faísca
  não entra aqui (é tom de marca/LP, não de UI de tarefa). Nenhuma superfície desta feature "ganha"
  Committed — não há hero nem momento de celebração que justifique fugir do restrained.
- **Theme scene sentence**: a pessoa revisita seu próprio histórico de trabalho, sozinha, num
  momento de reflexão ou organização rápida entre tarefas — pode ser de dia num intervalo do
  expediente ou de noite revisando a semana; a confiança/privacidade importa mais que o clima. Isso
  já está resolvido pelo produto: dark mode e light mode ambos suportados (herdado da 025), nenhuma
  decisão nova de tema aqui.
- **Anchors**: os próprios componentes já existentes do projeto — `EntryCard.tsx` (card colapsável
  com chevron, ações em pill button) e `DetailsFields.tsx` (seção "+ adicionar detalhes" opcional,
  colapsada por padrão) são a referência mais forte, porque a pessoa já usa essa gramática visual
  hoje em Registros. Fora do projeto: Linear (listas densas com collapse silencioso, sem
  spinner-teatro) e Notion (edição inline sem modal) — não como paleta ou tom, só como o "sente-se e
  confia" de produto que o `product.md` pede.

## 4. Scope

- **Fidelidade**: production-ready — esta é a etapa final antes do `/speckit-implement`, os 10
  componentes/telas descritos aqui devem ser codificáveis diretamente.
- **Abrangência**: uma superfície inteira (Registros reestruturado) + duas extensões (SavedPanel na
  025, e a ação "Organizar" acessível a partir do card expandido).
- **Interatividade**: componentes interativos reais (client components, fetch, estado otimista),
  não protótipo estático.
- **Intenção de tempo**: até funcionar e já polido o bastante para dogfooding real — não é uma
  exploração rápida.

## 5. Layout Strategy

**Dois níveis, sempre visíveis como hierarquia (fonte → destaques), nunca invertidos:**

```
┌─ SourceCard (1 por fonte) ──────────────────────────────┐
│ [thumb/ícone]  Título da fonte           [+3 destaques] │  ← colapsado
│                dd mmm aaaa · Empresa X  · [●contexto]   │
└──────────────────────────────────────────────────────────┘
        ↓ expandir (mesmo padrão de chevron do EntryCard)
┌─ SourceCard expandido ───────────────────────────────────┐
│ texto cru completo + anexos (já existente)               │
│                                                            │
│ ── Contexto ──                                            │
│ [Empresa A] [Empresa B] [Projeto pessoal] [Outro...]      │  ← ContextPillPicker
│                                                            │
│ ── Destaques ──                                            │
│ ▸ HighlightCard 1 (colapsado se houver >1)                │
│ ▾ HighlightCard 2 (aberto — só 1 destaque = sempre aberto)│
│ [+ adicionar destaque]                                     │
│                                                            │
│ [Organizar]  [Usar]  [Editar]  [Excluir]                  │  ← linha de ações, como hoje
└────────────────────────────────────────────────────────────┘
```

- O card de fonte preserva a estrutura de `EntryCard` (borda `rounded-xl`, header clicável de 48px
  mínimo, chevron). O que muda é o **conteúdo do header** (selo de contagem, sinalização de
  contexto) e o **conteúdo do corpo expandido** (destaques em vez de só metric/impact/tags soltos).
- **Feed → Timeline por mês**: agrupar os `SourceCard`s sob um cabeçalho de mês (`text-xs
  font-semibold uppercase tracking-wide`, mesma classe que `ActivityGrid` já usa para "Atividade") —
  ex. "Julho 2026" — sticky ou apenas inline acima do primeiro card do mês, sem duplicar em cada
  card.
- **Grade-faísca**: `ActivityGrid.tsx` já satisfaz FR-029 (sem streak, sem emoji, símbolo ✦) — nenhuma
  mudança estrutural necessária aqui, só confirmar que nenhuma regressão a reintroduz.
- **Hierarquia de emphasis**: título do primeiro/mais recente destaque > selo de contagem > data/
  contexto > sinalização de contexto não identificado (a mais discreta de todas — nunca compete
  visualmente com o título).

## 6. Key States

| Estado | O que a pessoa vê / sente |
|---|---|
| **Fonte não organizada** (`organizationStatus: 'not_organized'`) | Card mostra só o título/what_i_did legado como destaque único implícito (FR-032); botão "Organizar" em destaque discreto (ghost, não grita "ação pendente obrigatória" — é convite, não pedágio) |
| **Organizando…** (`organizing`) | Spinner pequeno inline (não bloqueia o card, não desabilita scroll/outras ações) + texto "organizando…" — sem rótulo persistente depois, sem CTA extra ao concluir (FR-011). No `SavedPanel` pós-salvar, mesmo texto aparece no bloco "Organizando o resto em segundo plano" |
| **Organizada** (`organized`) | Destaques renderizados; botão vira "Organizar de novo" (ghost, menor prioridade visual que antes) |
| **Falha de organização** | Card permanece idêntico ao estado "não organizada" — sem badge de erro, sem toast bloqueante; botão "Organizar" continua disponível para nova tentativa (FR-030) |
| **Contexto não identificado** | Indicador discreto (ponto/ícone pequeno + tooltip/label curto, ex. "sem contexto ainda"), nunca um badge vermelho de alerta — é convite a completar (FR-008/US7#6) |
| **Contexto resolvido (empresa)** | Nome da empresa aparece inline no header do card (`· Empresa X`, já é o padrão do `EntryCard` atual) |
| **Contexto resolvido (projeto pessoal)** | Label "Projeto pessoal" no lugar do nome de empresa, mesmo estilo |
| **1 destaque** | `HighlightCard` sempre aberto, sem chevron de colapso (nada a "revelar") |
| **N destaques (N>1)** | Todos colapsados por padrão, mostrando só título + métrica (se houver) na linha de resumo |
| **Destaque em branco (recém-adicionado manualmente)** | Aberto por padrão (a pessoa acabou de pedir para criar, precisa editar na hora), campos vazios editáveis |
| **Vocabulário de contexto vazio (primeiro uso)** | Pílulas mostram só "Projeto pessoal" e "Outro" — sem lista de empresas ainda |
| **Vocabulário de contexto grande** | Acima de ~8 pílulas, a fileira ganha um campo de busca inline (filtra pílulas por texto digitado) em vez de crescer infinitamente em altura — ver Interação abaixo |
| **Fonte legada (pré-026, sem `entry_highlights`)** | Tratada como fonte de destaque único sintético (título/metric/impact/tags legados da própria `entry`) — visualmente indistinguível de uma fonte nova com 1 destaque |
| **Feed vazio** | Já resolvido por `EmptyFeed.tsx` existente — sem mudança aqui |
| **Erro de rede ao clicar pílula/Organizar/editar destaque** | Reverte o estado otimista (pílula volta ao estado anterior, botão volta a "Organizar"), sem toast agressivo — mesmo padrão silencioso que falha de organização |

## 7. Interaction Model

- **Expandir/colapsar fonte**: clique no header do card (igual `EntryCard` hoje) — `aria-expanded`,
  chevron rotaciona. **Sem Framer Motion**: o padrão atual (`{expanded && (...)}` sem transição) já é
  a convenção do produto (nenhum outro collapse no feed anima hoje) — manter consistência em vez de
  introduzir motion só aqui. Decide a pergunta em aberto do `plan.md` sobre Framer Motion: **não
  usar** para expand/collapse de destaque ou fonte.
- **Clicar "Organizar"**: chamada a `POST /organize`; estado local muda para "organizando…"
  imediatamente (otimista); ao responder, mescla `highlights`/`company`/`entry_date` no item do feed
  sem recarregar a página (mesmo padrão de atualização local que `EntryCard.onEdit` já usa).
  Double-click guard: botão fica `disabled` assim que o primeiro clique dispara a chamada.
- **Selecionar pílula de contexto**: clique em uma pílula → `PATCH /api/entries/[id]` imediato
  (custo zero, sem loading visível além de um estado ativo instantâneo) — pílula fica preenchida
  (fundo `var(--color-primary)`, texto `var(--color-primary-fg)`, ícone de check) e as demais
  pílulas de empresa desmarcam. Selecionar "Outro" troca a pílula por um input de texto inline
  (mesmo padrão de edição inline do `EntryCard`) — confirma no blur ou Enter, e o novo valor vira
  pílula permanente em registros futuros.
- **Busca dentro do seletor de pílulas** (vocabulário grande): um campo de texto pequeno acima da
  fileira de pílulas, aparece só quando `empresas.length > 8`; filtra por substring, sem chamada de
  rede (a lista já veio no payload do feed/verificação de vocabulário).
- **Editar campo de um destaque** (título, métrica, impacto, tags): clique no ícone de lápis dentro
  do `HighlightCard` expandido → mesmos campos inline-editáveis com Salvar/Cancelar do `EntryCard`
  atual (reusar o mesmo par de botões pill "Salvar"/"Cancelar").
- **"+ adicionar destaque"**: botão ghost com borda tracejada ao final da lista de destaques (não
  modal — inline, aparece imediatamente um `HighlightCard` vazio e aberto, sem round-trip de
  confirmação separado).
- **Excluir um destaque**: ícone de lixeira dentro do `HighlightCard` → mesmo `Dialog.Root` de
  confirmação já usado para excluir uma fonte inteira no `EntryCard` (reusar componente/estilo, só
  trocar a cópia de "excluir registro" para "excluir destaque").
- **Feedback de organização falha**: nenhum popup — o botão simplesmente volta ao estado "Organizar"
  (não "Organizar de novo"), permitindo nova tentativa sem explicação adicional na tela (a spec
  exige "sem estado de erro bloqueante", não exige explicar o motivo).

## 8. Content Requirements

Novo texto necessário (namespace: manter a mesma divisão já existente — `feed` para o que é exibido
no feed/card, `registro` para ações dentro de um registro aberto; nenhum namespace novo):

- `registro.organize.cta` → "Organizar"
- `registro.organize.ctaAgain` → "Organizar de novo"
- `registro.organize.organizing` → "Organizando…"
- `feed.card.highlightsBadge` → "+{count} destaques" (singular tratado à parte se `count === 1`,
  embora o badge só apareça quando `count > 1`)
- `registro.context.unresolvedLabel` → algo curto e sem alarme, no tom caloroso/espirituoso da marca
  (não "ERRO: sem contexto") — sugestão: "sem contexto ainda" ou "de onde foi isso?" (a escolha final
  de copy cabe a uma revisão de tom, não trava a implementação)
- `registro.context.personalProjectLabel` → "Projeto pessoal"
- `registro.context.otherLabel` → "Outro"
- `registro.context.otherPlaceholder` → algo como "Nome do projeto ou empresa"
- `registro.context.searchPlaceholder` → "Buscar…" (só aparece com vocabulário grande)
- `registro.highlight.addNew` → "+ adicionar destaque"
- `registro.highlight.deleteConfirm.title`/`.description`/`.cancel`/`.confirm` — mesmo padrão de
  `card.deleteConfirm.*` já existente, cópia adaptada para "destaque" em vez de "registro"
- `feed.timeline.monthHeader` — formatação de data (`toLocaleDateString('pt-BR', { month: 'long',
  year: 'numeric' })`, capitalizado), não uma chave de tradução fixa por mês

Conteúdo dinâmico e seus limites realistas: 0 a 5+ destaques por fonte (sem limite artificial,
FR conforme spec); vocabulário de empresas de 0 a dezenas ao longo dos anos (edge case da spec —
resolvido pela busca inline acima de 8 itens); título de destaque pode ser longo (texto cru livre) —
truncar com `line-clamp` visual, não corte de caractere no banco.

Nenhum asset de imagem novo — miniatura já é a `thumbnail` real existente (primeira evidência).

## 9. Recommended References

- `reference/layout.md` — para a fileira de pílulas com scroll/busca e a hierarquia de dois níveis
  do card (evitar grid onde flex-wrap resolve).
- `reference/polish.md` — pass final depois do `/speckit-implement`, antes do PR (já é o passo 7 do
  processo, `/impeccable audit`).
- Não recomendo `animate.md` para este trabalho — a decisão de design aqui é justamente **não**
  introduzir motion nova, para não destoar do resto do feed que já não anima collapse.

## 10. Open Questions (com default assumido, não bloqueante)

- **Copy exata do indicador de "contexto não identificado"**: assumido um texto curto e não-alarmante
  acima; a Ohana pode preferir uma frase mais espirituosa alinhada ao tom de marca — ajustável sem
  reabrir a estrutura.
- **Ícone do botão "Organizar"**: assumido `Sparkles` (lucide-react, já é o ícone convencional para
  "ação de IA" em produtos similares e não está em uso em nenhum outro botão do feed hoje, evitando
  colisão semântica) — confirmar ou trocar por outro ícone da mesma biblioteca já em uso.
- **Posição exata do bloco de contexto vs. destaques dentro do card expandido**: assumido contexto
  primeiro (resolve "onde/quando" antes de mostrar "o quê") — pode inverter se, ao implementar, a
  leitura ficar mais natural com destaques primeiro.
- **Threshold de 8 pílulas para ativar busca**: número arbitrário razoável, ajustável em code review
  sem impacto de arquitetura.

---

## Pendência explícita

Este documento substitui a etapa interativa de discovery do `/impeccable shape` (não houve rodada
de perguntas em tempo real com a Ohana). Antes do `/speckit-implement`, a Ohana deve revisar este
arquivo e confirmar ou corrigir a Seção 3 (direção visual), a Seção 6 (estados) e a Seção 10
(perguntas em aberto) — especialmente a copy do indicador de contexto não identificado, que é a
peça mais sensível ao tom de marca.
