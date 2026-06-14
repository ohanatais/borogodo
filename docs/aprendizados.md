# Aprendizados — construindo o Borogodó

Registro dos momentos em que algo me surpreendeu, destravou ou exigiu uma decisão
não-óbvia durante o desenvolvimento. Não é changelog técnico (isso já está nos commits
e PRs) — é o "isso eu não esperava" em linguagem simples, pensado para virar conteúdo
real no ecossistema (`build-with-claude`, `product-thinking`) quando fizer sentido.

## Como usar

- Um aprendizado entra aqui quando vale a pena lembrar depois — não tudo que acontece
  numa sessão merece registro.
- Formato: data, o que aconteceu, o que aprendi, por que importa.
- Quando um aprendizado amadurecer o suficiente para virar conteúdo público, ele migra
  (manualmente, por decisão da Ohana) para o repo do ecossistema correspondente.

---

## 2026-06-07 — Um CI "verde" pode estar verde porque não está testando nada

**O que aconteceu:** o PR #6 começou a falhar no CI com 6 testes quebrados, e a
pergunta natural foi "por que só agora, se os PRs anteriores passaram?". Investigando,
descobri que o `package.json` nunca teve um script `test` antes desta feature. O passo
de CI rodava `npm test --if-present` — a flag `--if-present` faz o comando simplesmente
não fazer nada (e retornar sucesso) quando o script não existe. Ou seja: **o CI estava
"passando" há duas features inteiras sem nunca ter executado um teste sequer**. Os 6
testes que falharam agora sempre estiveram quebrados — só nunca tinham sido rodados de
verdade. Corrigi os 6 (eram bugs nos próprios testes: faltava mockar `IntersectionObserver`
no jsdom para o Framer Motion, e um teste de cadastro não preenchia o campo de confirmar
senha) e fechei as issues #4 e #5.

**O que aprendi:** "está verde" não é a mesma coisa que "está sendo testado". Um pipeline
de CI pode reportar sucesso de boa-fé enquanto pula silenciosamente a parte mais
importante — e isso é mais comum do que parece, porque flags como `--if-present` existem
justamente para "não quebrar quando não tem nada para rodar", o que é ótimo... até o dia
em que você espera que aquilo rode. Vale a pena, de tempos em tempos, abrir o log do CI e
confirmar que cada etapa está fazendo o que você acha que está fazendo — não só olhar o
selo verde.

**Por que importa:** esse é o tipo de armadilha que ninguém ensina a procurar — porque
"deu certo" é exatamente o sinal que nos faz parar de olhar. Para quem está aprendendo a
configurar CI pela primeira vez, vale mostrar como ler o log de uma execução "bem
sucedida" e confirmar que ela rodou o que deveria, não só que terminou sem erro.

---

## 2026-06-07 — Branches "esquecidas" deixam o repo parecer mais bagunçado do que é

**O que aconteceu:** revisei a estrutura do repo e apontei o README e o CLAUDE.md raiz
como desatualizados — pareciam um sintoma de bagunça. Na investigação seguinte, descobri
que ambos já tinham sido corrigidos na `main` (PR mergeado antes), só que minha branch de
trabalho (`003-capture-pipeline`) tinha sido criada *antes* desse merge, então ainda
carregava as versões antigas.

**O que aprendi:** "o código está desatualizado" e "o código está bagunçado" são
diagnósticos diferentes — o primeiro geralmente é só uma branch que ficou para trás, e se
resolve com um merge, não com retrabalho. Antes de classificar algo como problema
estrutural, vale checar se aquilo já não foi resolvido em outro lugar (`git log --all`,
`git branch --contains`).

**Por que importa:** para quem está aprendendo a trabalhar com branches pela primeira
vez, esse é exatamente o tipo de momento que gera pânico desnecessário ("meu repo virou
bagunça!") quando na real é só falta de sincronizar. Bom material para explicar branches
de um jeito que reduz ansiedade.

---

## 2026-06-07 — Ferramentas de medição também têm bugs (e isso não significa que o código está errado)

**O que aconteceu:** o relatório de cobertura de testes não mostrava o arquivo da rota
`enrich/[id]` — parecia que o código não estava sendo testado. Investigando, descobri que
era um bug cosmético do *reporter* de texto do Vitest com pastas de nome entre colchetes
(`[id]`, convenção do Next.js para rotas dinâmicas). Trocando para outro formato de
relatório (`json-summary`), a cobertura aparecia corretamente — 100%.

**O que aprendi:** quando uma ferramenta de medição mostra um resultado estranho, a
primeira pergunta não deveria ser "o que eu fiz de errado", e sim "será que é a
ferramenta que está com dificuldade de mostrar isso". Confirmar com uma segunda fonte
(outro reporter, outro comando) antes de mexer no código é mais barato do que sair
"corrigindo" algo que já estava certo.

**Por que importa:** para quem não é técnico, um número "errado" na tela costuma soar
como "eu quebrei algo". Vale mostrar que isso também acontece com gente experiente, e
que checar a ferramenta antes de duvidar do trabalho é uma habilidade, não uma desculpa.

---

## 2026-06-13 — `/pr-review` e `/verify` enxergam coisas diferentes, e isso não é redundância

**O que aconteceu:** o `/pr-review` (6 subagentes lendo o diff do PR #8) aprovou as
mudanças sem apontar nada crítico. Em seguida, ao rodar `/verify` — criando uma conta de
teste real, logando no `/painel` e disparando `/api/capture` de verdade, em pt-BR e em
inglês — apareceu um problema que nenhum dos subagentes de review tinha visto: o
placeholder do composer agora respeitava o idioma do usuário (era exatamente o que o PR
corrigia), mas as mensagens de erro da própria `/api/capture` ("Conta um pouco mais...",
"Tipo de captura inválido" etc.) continuavam fixas em pt-BR, mesmo com o cookie
`NEXT_LOCALE=en`. Resultado: um usuário em inglês via a tela toda em inglês, mas qualquer
erro de captura aparecia em português — uma inconsistência que só fica visível
*executando* o fluxo nos dois idiomas, não lendo o código.

**O que aprendi:** revisão de código (estática, lendo o diff) responde "esse código está
correto, isolado?" — e o `/pr-review` fez exatamente isso bem. Verificação em runtime
(`/verify`) responde uma pergunta diferente: "a experiência, de ponta a ponta, é
coerente?". As mensagens de erro nem tinham mudado no diff — por isso nenhum revisor de
código tinha motivo para olhar para elas. Só apareceram como problema quando colocadas ao
lado do que *tinha* mudado. Um passo não substitui o outro: cada um tem um ângulo cego
que é exatamente o ponto forte do outro.

**Por que importa:** para quem está montando um processo de revisão, é tentador pensar
"já passou no review, não precisa rodar de verdade" (ou o contrário). Esse caso mostra um
exemplo concreto e pequeno de um bug que só existe na junção das duas mudanças — uma
delas nem estava no PR. Bom exemplo para `product-thinking`: "funciona" e "a jornada faz
sentido" são perguntas diferentes, e a segunda só se responde usando o produto.

---

## 2026-06-13 — `next-intl`: o idioma da requisição não chega nas Route Handlers

**O que aconteceu:** ao corrigir o placeholder do composer para respeitar o idioma
(`getTranslations` + cookie `NEXT_LOCALE`), funcionou de primeira no `/painel` (uma
página). Mas a mesma chamada `getTranslations()` dentro de `/api/capture/route.ts` (uma
Route Handler) sempre voltava em pt-BR, mesmo com `NEXT_LOCALE=en`. Olhando o código-fonte
do `next-intl`, o idioma da requisição (`requestLocale`) é lido de um header
(`X-NEXT-INTL-LOCALE`) que o *middleware* do next-intl injeta — e este projeto não tem
`middleware.ts` (usa `localePrefix: 'never'` e negocia o idioma só na renderização de
páginas, via o plugin do Next). Route Handlers nunca recebem esse header, então
`getTranslations()` cai silenciosamente no idioma padrão (pt-BR), pra sempre, em qualquer
rota de API.

**O que aprendi:** "internacionalizei a tela" e "internacionalizei o produto" não são a
mesma garantia quando a tela e a API são coisas tecnicamente separadas — mesmo
compartilhando a mesma lib de i18n. A correção (ler o cookie `NEXT_LOCALE` direto via
`cookies()` e passar `{ locale, namespace }` para `getTranslations`) é simples, mas só
aparece se alguém testar especificamente "uma chamada de API responde no idioma certo?".

**Por que importa:** qualquer rota de API nova que devolva texto para o usuário vai cair
nessa mesma armadilha por padrão. Vale documentar esse padrão (`getApiErrors()` em
`src/app/api/capture/route.ts`) como referência para a próxima rota que precisar de i18n,
e considerar extrair para um helper compartilhado quando a segunda rota precisar disso.

---

## 2026-06-13 — O nome do produto já continha a estratégia (e o "pivô" não era pivô)

**O que aconteceu:** numa sessão que começou como "reorganizar a UI do painel", a conversa
escalou para "qual é a estratégia do produto". Três coisas se acumularam: (1) o output da IA
do espelho estava clichê ("você transforma ambiguidade em entrega concreta"), (2) a ideia de
vincular artefatos de evidência (reviews, protótipos, sites) à história de carreira, e (3)
uma crítica honesta de que o produto, como vitamina de autoconhecimento, tinha um problema de
retenção (você não volta toda semana pra rever quem você é). Ao tentar reposicionar para "base
de evidências que paga nos momentos de carreira", parecia que íamos pivotar o produto. Até
perceber que o nome — Borogodó, "aquilo em que você é bom sem saber nomear" — já continha
quatro movimentos: **Descobrir, Entender, Provar e Usar** o seu borogodó. O reposicionamento
não era pivô; era a marca levada a sério (borogodó guardado não serve de nada — existe pra ser
usado).

**O que aprendi:** quando um produto tem um nome forte e carregado de sentido, esse nome
costuma já conter a estrutura da proposta de valor — vale "interrogar o nome" antes de inventar
framework novo. Os quatro verbos não foram criados, foram extraídos do que a palavra já
significava. E resolveram de uma vez quatro problemas que pareciam separados: clichê (Provar =
evidência mata o genérico), retenção (Usar = motivo de voltar nos momentos de carreira), os
dois jobs do produto (introspecção vs. projeção, ambos contidos no nome) e a brasilidade
(mostrar sem se gabar é o antídoto cultural, não um recurso). A disciplina de founder aqui foi
não aceitar de cara a ideia mais brilhante (o álbum de artefatos) e perguntar primeiro "o que
precisa estar sólido antes disso" — a fundação (a inteligência que classifica bem) é o produto;
o álbum pendura nela.

**Por que importa:** é um caso forte de `product-thinking` — a diferença entre *inventar*
posicionamento e *descobrir* o que já estava ali. Para quem constrói, mostra que uma crise
aparente ("preciso pivotar?") pode ser o produto pedindo pra ser ele mesmo com mais clareza. E
vira a base de toda a mensagem futura (LP, marketing, vendas), por isso foi persistido em
`product-context.md` (produto) e `docs/marca.md` (mensagem).
