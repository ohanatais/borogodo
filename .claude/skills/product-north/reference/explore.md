# explore — Discovery puro

**Objetivo:** entender o tema fundo o bastante pra tomar uma boa decisão depois. **Não há
solução nesta fase.** Se você está propondo "fazer X", você pulou o explore.

**Saída:** um mapa de discovery (no chat) — JTBD, tensões, hipóteses, perguntas abertas — e
uma recomendação de qual delas atacar primeiro. Não é decisão; é o terreno antes da decisão.

## Antes de falar: estude o real

Leia o código/dados/docs que tocam o tema (contrato nº2). Para o Borogodó, isso costuma ser:
o `product-context.md`, a feature atual no `CLAUDE.md`, o discovery em `docs/`, e o código da
área em questão. Para varredura ampla, despache `Explore`. **Diga o que você olhou.**

## O movimento

1. **Job-to-be-done.** Qual o progresso que o usuário tenta fazer na vida dele? (Não "usar a
   feature" — o progresso real.) Use a lente JTBD de `reference/lenses.md`. Separe job
   funcional, emocional e social. Para o Borogodó, lembre que é produto de **carreira**: o
   job costuma ser emocional (ser visto, não esquecer o que fez, ter controle da narrativa).
2. **Tensões.** Onde o usuário hesita, abandona, ou faz gambiarra hoje? Onde o produto pede
   esforço antes de devolver valor? (Risco clássico de produto-vitamina.)
3. **Hipóteses, não conclusões.** Escreva 3–6 hipóteses falsificáveis ("acreditamos que X
   porque Y; saberíamos que erramos se Z"). Marque quais têm evidência e quais são fé.
4. **Perguntas abertas.** O que você ainda não sabe e mudaria a decisão? Ordene por
   "quanto isso muda o rumo se a resposta for diferente do esperado".
5. **Contraponto (contrato nº1).** Antes de fechar, questione o próprio enquadramento do
   tema: e se o problema que ela trouxe não for o problema real? Nomeie isso.

## Cadência

Converse, não despeje. Faça 2–3 perguntas por rodada (use `AskUserQuestion` quando ajudar),
ouça, e adapte. Uma rodada é o default; abra uma segunda só se restar lacuna material.

## Fim

Termine recomendando: ou ir pra `frame` (já dá pra enquadrar uma decisão), ou continuar o
discovery (ainda falta entender). Nunca emende uma solução aqui.
