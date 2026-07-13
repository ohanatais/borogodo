# Quickstart: validar "Registro como Depósito" ponta a ponta

Pré-requisitos: branch `025-registro-deposito`, `.env.local` linkado (via `worktree-add.sh` ou
symlink manual), servidor de dev rodando (`npm run dev`), usuário de teste logado.

Não requer nenhuma migration nova — reusa `entries`/`evidences`/`evidence-files` já existentes em
dev e prod. Se o ambiente de dev não tiver essas colunas/bucket (improvável, já que são de
migrations mergeadas há tempo), rodar `supabase db push` antes.

## 1. Salvar sem nunca ser rejeitada (US1)

```bash
# Nenhum comando de terminal necessário — validação manual na UI
```

1. Abrir o Painel (`/painel`), clicar no gatilho de Registro.
2. Digitar `"resolvi um bug hoje"` (poucas palavras) → clicar "Registrar".
3. **Esperado**: confirmação aparece imediatamente (sub-segundo), sem erro, sem redirecionamento
   pro chat. Registro visível em `/registros`.
4. Repetir colando um texto de vários parágrafos (ex.: transcrição de reunião) → **esperado**:
   texto cru salvo por inteiro, sem truncar (conferir em `/historico` ou `/registros` que o texto
   bate caractere a caractere com o colado).
5. Deixar o campo vazio, sem anexo → **esperado**: botão "Registrar" permanece desabilitado.

## 2. Anexar imagem e link (US2)

1. No drawer, clicar "Imagem" e escolher um arquivo → **esperado**: miniatura real aparece antes
   de salvar.
2. Copiar uma imagem (ex.: `Cmd+Shift+4` → área de transferência) e colar (`Cmd+V`) com o foco no
   textarea → **esperado**: vira anexo (tile com miniatura), não polui o texto.
3. Arrastar um arquivo de imagem do Finder pro drawer → **esperado**: destaque visual durante o
   arraste, tile ao soltar.
4. Clicar "Link", informar uma URL → **esperado**: tile com domínio/título.
5. Colar uma URL como parte de uma frase no texto livre → **esperado**: permanece texto, não vira
   anexo automaticamente.
6. Salvar, reabrir o registro em `/registros` → **esperado**: os mesmos anexos continuam visíveis.
7. Remover um anexo antes de salvar → **esperado**: some do drawer, nunca aparece no registro salvo
   (conferir que nenhum arquivo órfão foi enviado ao bucket — nenhuma chamada de rede deveria ter
   sido feita para esse anexo).

## 3. Confirmação editável (US3)

1. Salvar um registro qualquer → **esperado**: `SavedPanel` aparece com título pré-preenchido
   (primeira linha do texto, heurística local) em campo editável, e "salvo em Registros".
2. Editar o título, concluir → **esperado**: `/registros` reflete o novo título.
3. Fechar sem editar → **esperado**: título pré-preenchido é mantido.

## 4. Campos manuais sem IA (US4)

1. Abrir "+ adicionar detalhes" sem clicar em nada de IA → **esperado**: campos vazios e
   editáveis, nenhuma chamada de rede disparada por essa ação (conferir na aba Network do
   DevTools: zero requests ao abrir a seção).
2. Preencher métrica/tags, salvar → **esperado**: registro salvo contém exatamente o digitado.
3. Não abrir a seção → **esperado**: registro salva normalmente só com texto/anexos.

## 5. Painel novo (US5) e navegação em grupos + dark mode (US6)

1. Abrir `/painel` → **esperado**: saudação, gatilho único de Registro (borda coral), sem a barra
   fixa "Registrar | Perguntar"; "Suas forças" e "Registros recentes" abaixo, coluna única.
2. Conta sem registros → **esperado**: modo "novo" com gatilho em destaque, botão "Importar
   currículo ou LinkedIn" visível mas sem ação ao clicar (sem erro no console), cartão de
   progresso 0/3 rumo ao primeiro Espelho.
3. Abrir a sidebar desktop → **esperado**: "Painel"/"Registrar" isolados no topo; grupo "Meu
   espelho" (Perfil, Trajetória, Registros); grupo "Usar" (Gerar conteúdo, Me preparar,
   Perguntar). Clicar "Perfil" e "Trajetória" → ambos abrem `/espelho` (o segundo com o toggle de
   trajetória pré-selecionado). Clicar "Gerar conteúdo"/"Me preparar" → abrem `/presenca?hub=
   mostrar` / `/presenca?hub=preparar` direto (sem passar pela splash de 2 cards). Clicar
   "Perguntar" → abre o `ChatSheet` como overlay, sem navegar.
4. Alternar tema claro/escuro → **esperado**: Painel, drawer e navegação legíveis nos dois temas,
   contraste equivalente.
5. Viewport mobile → **esperado**: tab bar com 4 abas (Painel, Espelho, Registros, Usar) + FAB
   central de Registro; "Espelho" continua único (sem separar Perfil/Trajetória).

## 6. Bottom sheet mobile (US7)

1. Em viewport mobile, tocar o FAB central → **esperado**: drawer sobe como bottom sheet (não
   desliza da lateral).
2. Tocar fora ou usar gesto de fechar → **esperado**: fecha sem perder o texto digitado até ali
   (mantém no rascunho da sessão do drawer, não persiste como registro — reabrir o drawer na mesma
   sessão de navegador deveria restaurar o texto; navegar pra outra aba/fechar o browser descarta).

## Regressão a checar

- `/historico` e `EvidenceSection.tsx` continuam funcionando com registros antigos (evidências
  criadas pelo caminho antigo devem seguir visíveis).
- Modo "Perguntar" (chat) continua funcionando igual, só reposicionado no menu.
- Nenhum registro criado por `kind: 'text'` (caminho antigo, ainda existente no código para
  feature B) quebra ao ser exibido em `/registros`/`/historico` junto com registros novos
  `kind: 'deposito'`.
