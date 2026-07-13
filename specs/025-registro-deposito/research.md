# Research: Registro como Depósito (fundação)

Todas as incertezas do Technical Context foram resolvidas por investigação do código real
(3 agentes de exploração paralelos: fluxo de captura, schema entries/evidences, Painel/navegação/
dark mode). Nenhum `NEEDS CLARIFICATION` restante.

## 1. Onde plugar o salvamento direto (sem IA)

**Decision**: criar um novo `kind: 'deposito'` na rota `POST /api/capture` existente
(`src/app/api/capture/route.ts`), com handler dedicado `handleDepositoCapture`, extraído para
`src/lib/capture/saveDeposito.ts` (mantém a rota fina, função testável isoladamente). Payload é
**JSON simples** (não FormData) — `{ rawText: string, manualFields?: {...} }` — porque anexos são
persistidos por uma chamada separada (ver decisão #2), não nesta.

**Rationale**: já existe `handleMarcoCapture` (`kind: 'marco'`) fazendo exatamente este padrão —
monta a entry a partir de campos crus e chama `saveEntries` direto, sem `captureAndReflect`. É o
precedente mais próximo no próprio código, só que hoje nenhuma UI o invoca. Reusar o padrão em vez
de inventar um novo evita duplicar a lógica de autenticação/validação que a rota já tem.

**Alternatives considered**:
- Reescrever `handleTextCapture` (`kind: 'text'`) para não chamar IA → rejeitado: esse caminho
  continua existindo para a feature B (`026-organizar-destaques`, que reintroduz a IA de forma
  assíncrona/opcional) e possivelmente para o modo "Perguntar" via `CaptureInput` — mexer nele
  arriscaria quebrar esses outros consumidores.
- Rota nova (`/api/capture/deposito`) → rejeitado: fragmenta a lógica de auth/parsing que já vive
  centralizada em `/api/capture`, sem ganho real de clareza.

## 2. Ordem de salvamento: texto vs anexos

**Decision**: salvar o registro em duas etapas do ponto de vista de rede, mas UMA só do ponto de
vista da pessoa usuária:
1. Drawer chama `POST /api/capture` (`kind: 'deposito'`) só com texto + campos manuais → volta
   `{ id, title }` **imediatamente** (sub-segundo, sem esperar upload de imagem) → `SavedPanel`
   aparece na hora.
2. Para cada anexo pendente no momento do clique em "Registrar" (imagem local ainda não
   enviada, link ainda não persistido), o cliente chama a rota já existente e inalterada
   `POST /api/entries/[id]/evidence` (uma vez por anexo) usando o `id` recém-recebido.

**Rationale**: mantém FR-004/SC-002 (salvar é síncrono, imediato, sem IA) verdadeiro mesmo quando
há anexo grande — o gargalo de rede de um upload de imagem de 10 MB nunca bloqueia a confirmação
de que o **registro em si** foi salvo. Reusa a rota de evidência sem tocar nela (menor superfície
de mudança, menor risco de regressão em `/historico`).

**Alternatives considered**:
- Um único request multipart (texto + arquivos + links) → rejeitado: exigiria reescrever a rota de
  evidência dentro da nova rota, duplicando validação de tipo/tamanho já existente, e faria o
  tempo de resposta do salvamento depender do tamanho do upload — quebra SC-002 no caso comum de
  "registro com print grande".
- Upload otimista antes de clicar Registrar (upload no momento do paste/drag) → considerado, mas
  fora de escopo desta spec: os testes de aceite (US2) descrevem a miniatura aparecendo antes de
  salvar como preview local (thumbnail via `URL.createObjectURL`), não como já-persistido; adiar o
  upload de fato pro clique em "Registrar" evita lixo de arquivos órfãos no bucket para anexos
  removidos antes de salvar (FR-007).

**Falha parcial**: se o passo 2 falhar para algum anexo (rede), a entry (passo 1) já está salva —
o sistema deve avisar que aquele anexo específico não foi salvo e oferecer nova tentativa, sem
perder o registro nem os demais anexos já persistidos (mesmo espírito de FR-016, aplicado a
anexos).

## 3. Heurística de título (sem IA)

**Decision**: `buildEntryTitle(rawText: string): string` em `src/lib/capture/buildEntryTitle.ts` —
pega a primeira linha não-vazia do texto cru, faz `trim()`, e trunca em 80 caracteres (mesmo limite
do schema `entries.title`, já validado hoje via Zod `z.string().max(80)`) com reticências se
cortar no meio de uma palavra.

**Rationale**: determinística, local, zero latência, sem dependência de IA — exatamente o que
FR-009/FR-010 e a Assumption da spec pedem. Reusa o mesmo limite de 80 chars que o schema já usa
para o título gerado por IA, então não há retrabalho quando a feature B reintroduzir o título "de
qualidade" (substantivo-primeiro) por cima do mesmo campo.

**Alternatives considered**: heurística mais sofisticada (remover stopwords, capitalizar) →
rejeitada por esta fatia — a spec é explícita que "qualidade" de título é escopo da feature B; aqui
o objetivo é só nunca deixar a pessoa "às cegas" sobre o que foi salvo (US3), e permitir edição
imediata cobre a diferença.

## 4. Rota de evidência existente — confirmado reuso sem alteração

`POST /api/entries/[id]/evidence` já cobre exatamente os dois casos necessários (imagem via
multipart com validação de 10 MB / tipos jpeg-png-webp-gif, e link via JSON com `z.string().url()`)
e já persiste no mesmo array JSONB `evidences` que `EvidenceSection.tsx` consome em `/historico`.
**Nenhuma mudança nesta rota.** A única extensão necessária é o `AttachTile.tsx` do drawer replicar
o mesmo formato `EvidenceItem { type: 'url' | 'image', value: string, label?: string }` já usado em
`src/lib/historico/getHistoricoData.ts`, para não criar um segundo formato de anexo.

## 5. Componentes de captura antigos

**Decision**: remover `CaptureConversation.tsx` (substituído por `Drawer` + `SavedPanel`) e
`CaptureComposer.tsx` (confirmado órfão pela investigação — só referenciado em
`tests/integration/capture-flow.test.tsx`, nenhum caminho de produção o importa). `CaptureInput.tsx`
é reavaliado: se ainda for usado pelo modo "Perguntar" (`kind: 'question'` dentro do `ChatSheet`),
mantém-se para esse uso; sua função como gatilho de registro no `AppShellClient` é substituída pelo
novo `RegistroTrigger` do Painel + `Drawer`.

**Rationale**: manter dois caminhos de salvar (o antigo com IA bloqueante + o novo determinístico)
coexistindo na mesma superfície reintroduziria a ambiguidade que a feature existe para eliminar.

## 6. Limiar de reroteamento de 150 caracteres

**Decision**: remover completamente `ARTIFACT_THRESHOLD_CHARS` e a ramificação
`content.length >= 150 ? setActiveCapture(...) : openChatSheet(...)` de `AppShellClient.tsx` (hoje
duplicada nos blocos desktop e mobile). Todo texto digitado no Drawer segue para o salvamento
direto (`kind: 'deposito'`), independente do tamanho — exatamente FR-001/FR-002.

**Rationale**: essa é a causa raiz do bug de produto que a spec inteira existe para consertar — o
limiar de 150 chars é o "reroteamento por tamanho" citado em US1.

## 7. Título/áudio — reuso confirmado

`AudioButton`/`AudioRecorder` (Web Speech, feature 016) já produzem texto puro via `onTranscript`,
sem depender de nenhuma chamada de IA — plugam no Drawer exatamente como plugam hoje no
`CaptureInput` (o texto transcrito cai no mesmo campo de texto do bloco-de-notas). **Nenhuma
mudança nesses dois componentes.**

## 8. Reforma do Painel — o que reusar vs recriar

`getPanelData` (data fetching server-side) é reusado sem mudança de contrato de dados. Os
componentes de apresentação mudam:
- **Substituídos** por peças novas (`HomeGreeting`, `RegistroTrigger`, `SuasForcas`,
  `RegistrosRecentes`, `NewAccountPrompt`): a barra fixa "Registrar|Perguntar" (vive em
  `AppShellClient`, não no Painel) e o layout de "dois blocos co-iguais".
- **Mantidos como estão** (contrato de dados e lógica preservados, só reposicionados no novo
  layout de coluna única): `ReviewCycleInvite` (banner condicional de calendário, já cobre o edge
  case "sem recorrência" retornando `null`), `PainelChatDoor` pode ser absorvido pelo item
  "Perguntar" da nova navegação (avaliar em `/impeccable shape` se ainda faz sentido como faixa
  separada dado que "Perguntar" já ganha destaque no menu).
- Modo "conta nova" hoje é só `PanelEmptyState` — precisa expandir para incluir o botão "Importar
  currículo ou LinkedIn" não-funcional (FR-021) e o cartão de progresso 0/N usando
  `FIRST_MIRROR_MIN_ENTRIES = 3` (já existente em `src/lib/ai/mirror/maybeRegenerate.ts`, reusado
  sem inventar número novo — FR-022).

## 9. Navegação em grupos — modelo de dados

**Decision**: estender `src/components/layout/navModel.ts` com uma estrutura de grupos para
desktop (`NAV_GROUPS: { id, labelKey, items: NavDestino[] }[]`) SEM remover `NAV_DESTINOS` (lista
plana) — a tab bar mobile continua consumindo a lista plana de 4 destinos como hoje (FR-025), só a
sidebar desktop passa a iterar `NAV_GROUPS`. "Perfil" e "Trajetória" são dois `NavDestino` novos
que apontam ambos para `/espelho` (o segundo com `?view=trajetoria` ou equivalente, para
pré-selecionar o toggle interno já existente da feature 007) — nenhuma rota nova.

**Resolução das clarificações já fechadas**: "Gerar conteúdo" → `/presenca?hub=mostrar`, "Me
preparar" → `/presenca?hub=preparar` (ambos existentes, feature 013), "Perguntar" → chama
`openChatSheet()` (já exportado de `ChatSheet.tsx`) em vez de navegar — não é um `NavDestino` com
`path`, é uma ação.

**Rationale**: dois modelos de dados (grupos para desktop, lista para mobile) evita forçar a tab
bar mobile a lidar com uma estrutura de grupos que ela não usa (FR-025 mantém mobile com 4 itens
originais), sem duplicar a fonte da verdade dos hrefs — os `NavDestino` dentro de `NAV_GROUPS` são
os mesmos objetos referenciados (Perfil/Trajetória/Registros apontam pra rotas já cobertas por
`activePrefixes` existentes).

## 10. Dark mode — ativação e reconciliação de tokens

**Decision**:
- Adicionar `next-themes` como dependência nova (padrão de mercado para Next.js App Router,
  evita reimplementar detecção de preferência do sistema + persistência + hidratação sem flash).
- Envolver o layout raiz com um `ThemeProvider` e adicionar um `ThemeToggle` (local: dentro da
  navegação/configurações — decidir exato em `/impeccable shape`).
- **Não introduzir os nomes de token do protótipo** (`--surface-0/1/2`, `--text-primary/secondary/
  muted`, `--roxo`) como um segundo sistema paralelo. O bloco `.dark` já existe em `globals.css`
  com os nomes canônicos do produto (`--background`, `--foreground`, `--card`, `--muted-foreground`,
  `--color-primary`, `--color-accent`, etc.) — a tradução do protótipo pros tokens reais é trabalho
  de `/impeccable shape`, não uma tabela de tokens nova.

**Rationale**: Princípio VII da constituição exige um único sistema de tokens em
`src/app/globals.css`; ter dois nomes para a mesma cor (ex.: `--roxo` E `--color-primary`)
viola isso na prática, mesmo que não seja hex cru. Os valores `.dark` já definidos nunca foram
auditados em produção (nenhuma tela os usa hoje) — auditar contraste/legibilidade real é trabalho
de implementação, não pesquisa.

**Alternatives considered**: CSS custom property toggling manual sem lib → rejeitado, reimplementa
o que `next-themes` já resolve (flash de tema errado no first paint, sync com `prefers-color-scheme`,
persistência em localStorage) — não há ganho em não usar a lib madura do ecossistema Next.js.

## 11. Namespace de i18n

**Decision**: novo namespace `registro` (não `capture`) para strings do Drawer/SavedPanel/
DetailsFields — reflete o reframe de produto ("captura" → "registro/depósito", decision record
003). Estende o namespace `appNav` já usado em `navModel.ts` (`labelKey: 'appNav.painel'` etc.)
para os novos itens/grupos. Estende `panel`/`painel` (namespace já existente do Painel) para
saudação/forças/registros recentes.

**Rationale**: manter `capture` para o que resta do fluxo antigo (feature B, modo Perguntar) evita
colisão semântica com o vocabulário novo que a spec adota deliberadamente.
