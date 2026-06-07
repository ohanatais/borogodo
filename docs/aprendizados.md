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
