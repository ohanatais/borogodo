# Research & Design Decisions: Repertório (017)

Achados da exploração do código existente (013/014/015 + chat 012 + painel 005/007) que sustentam o
plano. Cada decisão lista o que existe, a escolha e a alternativa rejeitada.

## 1. O "momento" não vira formato nem coluna

- **Existe**: `DraftFormat = 'post' | 'impact_summary' | 'mini_bio'` (CHECK no schema);
  `drafts.angle` (text) e `drafts.qa` (jsonb, aceito por `POST /api/content/drafts` via
  `qa: z.record(...)`); `generateDraft` e a rota de generate aceitam `angle`.
- **Decisão**: o momento (entrevista/review/salário) é um **ângulo** sobre `impact_summary` (vai
  como `angle` na geração) e um **rótulo livre** em `drafts.qa.moment` ao salvar.
- **Rejeitado**: criar formatos `interview`/`review`/`salary` + estender o CHECK de `format` →
  exigiria migration em dev+prod e multiplicaria prompts quase idênticos, sem ganho na v1.

## 2. Gap real: o `angle` nunca é enviado

- **Existe**: `/api/content/generate` (zod) e `generateDraft` aceitam `angle`. Mas
  `GenerateSheet.generate()` monta o body só com `format`/`seedType`/`seedRef`/`adjust`, e
  `PresencaOpenDetail` não tem `angle`.
- **Decisão**: adicionar `angle?`/`moment?` a `PresencaOpenDetail`; `generate()` inclui
  `angle: detail.angle` quando presente; preservar em troca de formato, regenerar e adjust (todos
  leem de `detail`).
- **Impacto**: é o que torna o ângulo de momento real ponta a ponta.

## 3. theme + impact_summary já funciona; não tocar THEME_FORMATS

- **Existe**: a zod de generate não cruza formato×seed; `loadThemeSeed` carrega as entradas
  recentes como evidência independentemente do formato; `generateDraft` é agnóstico.
- **Decisão**: os cards de PREPARAR chamam `openPresenca({ seedType:'theme', formats:['impact_summary'], angle, moment })`
  direto — **sem** alterar `THEME_FORMATS` (constante de UI do `PresencaCreate`, fora do caminho).
- **Rejeitado**: ampliar `THEME_FORMATS` para incluir `impact_summary` — desnecessário e
  ampliaria a aba genérica do seletor de tema sem pedido.

## 4. Persistir o momento, mas badge fica fora da v1

- **Existe**: `DRAFT_COLUMNS` em `src/lib/db/drafts.ts` exclui `qa` deliberadamente; `qa` nunca
  volta ao cliente. `DraftCard.ensureSaved` já grava `qa: { angle, evidenceRefs }`.
- **Decisão**: `DraftCard` ganha prop `moment?` e grava `qa.moment` quando presente.
- **Fora da v1**: badge do momento no `DraftListItem` exigiria expor `qa` (mudança maior) →
  fast-follow.

## 5. Contexto de chat `preparacao`

- **Existe**: `ChatContext.type = 'espelho'|'historico'|'empresa'|'entry'` em
  `answerCareerQuestion.ts`; a mesma enum na zod de `/api/chat`; `ChatOpenDetail.context` no
  `ChatSheet`. `buildCareerChatSystemPrompt` recebe `{profile, latestMirror, relevantEntries,
  companyEntries, correctionEntry}`.
- **Decisão**: adicionar `'preparacao'` às três definições + campo `moment?: PrepMoment`; quando
  `type === 'preparacao'`, repassar `prepMoment` ao builder, que injeta um bloco de enquadramento
  do momento. `suggestionsEnabled` permanece ligado (só `entry`/`espelho` desligam). Título do
  header do `ChatSheet` ganha branch para preparação.
- **Sem roleplay dedicado** (fast-follow): reusa o pipeline de chat, só adiciona o ramo de contexto.

## 6. Starters por momento sem mexer na rota

- **Existe**: `GET /api/chat/starters` é param-less e sem ciência de contexto; `StarterPrompts`
  busca dele no mount.
- **Decisão**: `StarterPrompts` aceita `context`/`moment`; em `preparacao` usa
  `PREP_MOMENTS[m].starters` (constantes client-side), sem ida ao servidor. Demais contextos
  inalterados.

## 7. Bio no Espelho

- **Existe**: `openPresenca` exige `seedRef` concreto; `UsarButton` já é por-tema; `loadThemeSeed`
  carrega a trajetória recente como evidência (o tema funciona como rótulo/âncora da bio).
- **Decisão**: botão "Criar minha bio" em `MirrorContent` chama
  `openPresenca({ seedType:'theme', seedRef: strength_themes[0], formats:['mini_bio'] })`; oculto
  se não houver temas.

## 8. Descoberta pelo Painel + rename

- **Existe**: `NAV_ITEMS` em `AppShellClient` usa labels hard-coded (não i18n); o Painel popula
  `BorogodoCard` → `TrajectoryHighlights` → `ProactiveInsightCard` no ramo `entryCount > 0`.
- **Decisão**: rename "Presença"→"Repertório" (label do nav + header/metadata + chave i18n; rota
  intacta). Novo `UsarInvite` montado no Painel logo após `BorogodoCard`, só no ramo populado.
- **Razão**: rótulo de menu sozinho não comunica a intenção (feedback da Ohana); o convite dá
  contexto com frase + exemplos.

## Riscos

- `impact_summary` sobre `theme` pode soar amplo → validar manualmente; opção de ancorar em
  projeto/entrada se fraco (fast-follow).
- Salário é o encaixe menos direto do motor → aceitar v1; roleplay dedicado depois.
