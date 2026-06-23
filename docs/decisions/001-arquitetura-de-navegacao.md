# 001 — Arquitetura de navegação: o menu expressa a espinha (6 → 4 portas)

- **Data:** 2026-06-22
- **Status:** decidido
- **Objetivo core que isso serve:** **retenção + valor percebido.** O menu cresceu feature a
  feature e virou 6 portas paralelas que misturam camadas — a pessoa não sente a espinha do
  produto, adivinha onde clicar. Navegação ilegível corrói retenção (a pessoa não acha o
  valor) e dilui o wedge (o payoff episódico fica enterrado). Uma IA que expressa a espinha
  torna o valor óbvio e dá ao Painel o papel de motor de retorno.

## Contexto

A camada "Usar" ia ser re-arquitetada (Repertório vs. Preparar), mas a investigação contra a
`main` real revelou um problema maior: o app tem **6 portas** (Painel, Espelho, Registros,
Linha do Tempo, Repertório, Autoavaliação) + Configurações, que misturam input (Registros),
revelação (Espelho), mapa (Linha do Tempo) e output (Repertório, Autoavaliação). "Registros" e
"Linha do Tempo" soam iguais pro usuário. O produto **declara** uma espinha em
`product-context.md` — Descobrir → Entender → Provar → Usar — mas o menu não a expressa.

Estudado (na `main`, verificado): `AppShellClient.tsx` (NAV_ITEMS = 6 portas; `/presenca` já
se chama "Repertório"; Autoavaliação já é porta própria — 019/PR #46). `getHistoricoData.ts`
(Linha do Tempo = mapa estruturado empresa→cargo→projeto, é **interpretação**, não log).
`getFeedData`/`registros` (Registros = feed cru buscável, é **input**). `ChatSheet.tsx` (chat
já é global na barra de baixo, modos Registrar/Perguntar, **efêmero** — sem persistência).
017-repertorio-intencao **nunca foi mergeada** (spec morta — esta decisão a supersede).

## Decisão

**Colapsar o menu de 6 → 4 destinos, cada um = um movimento da espinha:**

1. **Painel** — a Home / centro de gravidade (estruturada e proativa).
2. **Espelho** — "me entender": absorve a **Linha do Tempo** como segunda vista (forças +
   trajetória). A Linha do Tempo deixa de ser porta própria.
3. **Registros** — o log cru de input / buscar uma captura.
4. **Usar** — output: reúne **Repertório** (pra fora: post/bio) + **Me preparar**
   (Autoavaliação generalizada, pra dentro: review/entrevista/1:1).

\+ Configurações no rodapé.

**Princípio de interação (decidido junto):** Home estruturada e proativa; **o chat é
ferramenta onipresente, nunca a Home.** Uma porta conversacional ("fala com o seu borogodó")
vive no **topo do Painel** e abre o chat já enquadrado — dá o feeling conversacional sem
esconder o acúmulo. Nada de modal de chat central que toma a tela (padrão Gemini/Claude).

**Limpeza junto:** cortar `impact_summary` como formato visível ao usuário (mantém como motor
por baixo). Hoje é oferecido pelado em `PresencaCreate.tsx` e `ProactiveInsightCard.tsx`.

## Alternativas consideradas

- **Não fazer / mínimo** — organizar só o Repertório por intenção, deixar as 6 portas. Rejeitada:
  não resolve a ilegibilidade do menu nem o "soam iguais"; o wedge continua sem casa nomeada.
- **Opção A — Linha do Tempo dentro do Espelho** ✅ **escolhida.** A trajetória é interpretação
  (o mapa da carreira = pilar "Entender") → mora junto da revelação. Registros fica como input puro.
- **Opção B — Histórico unificado (Registros + Linha do Tempo)** — fundir os dois "olhar meu
  passado", Espelho fica puro. Defensável (era o instinto inicial), mas mistura input cru com
  narrativa interpretada num destino só.
- **Duas portas novas (Conteúdo + Preparar)** — rejeitada: levaria o menu a 7–8 portas (Hick),
  e "Conteúdo" é nome genérico de SaaS (a marca proíbe). Regrediria a separação que a `main` já tem.
- **Chat-first (Gemini/Claude): caixa de conversa como Home** — rejeitada: esconde o moat
  (artefatos duráveis) atrás de um prompt → vira "wrapper de GPT" (falha de marca); cold-start
  a cada abertura → mata o motor de retorno proativo do Painel; exige persistir histórico de chat
  (hoje efêmero) = semanas de trabalho + decisão de privacidade dura.

## Por que esta (e o steelman do oposto)

O menu deveria nascer da espinha do produto, não da ordem em que as features foram construídas.
A Linha do Tempo é interpretação da carreira (empresa→cargo→projeto com destaques), então
pertence ao lado de "me ver" (Espelho), não ao log cru de capturas. Juntar revelação +
trajetória cria um mundo coerente de autoconhecimento e deixa Registros sendo o que de fato é:
a camada de input/busca.

**Steelman do B (revisável depois):** pro usuário leigo, "Espelho" pode não ser o lugar óbvio
pra *procurar* "o que eu fiz na empresa X" — se as pessoas vão à Linha do Tempo **procurando
coisa** (e não contemplando trajetória), então ela pertence a Registros e A enterra a função. O
teste é o verbo: a Linha do Tempo é mais "me entender" (→ A) ou "achar um registro" (→ B). A
aposta é A; se o uso real mostrar gente caçando registro lá, reavaliar pra B.

## Riscos e o que os mitiga

1. **Espelho fica denso** (revelação + mapa numa porta só). Mitiga: as duas vistas já existem
   como páginas; viram um toggle/duas seções, não um amontoado. Validar legibilidade no shape.
2. **Big-bang trava.** Mitiga: sequenciar (issues abaixo). O passo 1 (regrupar o menu) entrega
   melhora sentida **sem** reescrever página nenhuma — as rotas atuais seguem vivas por baixo.
3. **Perder a função ao fundir** (a vista de trajetória sumir dentro do Espelho). Mitiga: a porta
   some, a função não — forças **e** trajetória têm que sobreviver como vistas.
4. **Painel virar gaveta de bagunça** ao ser "fortalecido". Mitiga: fortalecer = curar o que
   aparece, não empilhar. A Home do LinkedIn é forte por fazer uma coisa bem.

## Como saber se acertamos

- **Sinal de legibilidade:** queda em "abrir a porta errada e voltar" (idas e voltas entre
  Espelho/Registros/Linha do Tempo na mesma sessão).
- **Sinal de retorno:** Painel como ponto de entrada das sessões + cliques saindo dele pras
  outras portas (a Home funcionando como gravidade).
- **Sinal de uso da trajetória:** a vista de trajetória dentro do Espelho continua sendo aberta
  (se cair a zero, B estava certo — reavaliar).
- Reavaliar depois do passo 2 (a fusão), com uso real de algumas semanas.

## Próximo passo

Este record é o input do `/speckit-specify`. A reforma é grande demais pra uma spec só —
sequenciar em features pequenas (ver lista de issues no chat). Começar pela barata e de maior
impacto:

`/speckit-specify "Colapsar o menu de navegação de 6 para 4 destinos que expressam a espinha
do produto (Painel/Espelho/Registros/Usar). Reagrupar NAV_ITEMS e adicionar uma landing 'Usar'
que roteia para Repertório (pra fora) ou Me preparar (pra dentro). As rotas atuais permanecem
vivas por baixo — sem reescrever páginas neste passo. Painel é a Home; o chat segue ferramenta
onipresente, nunca a Home."`
