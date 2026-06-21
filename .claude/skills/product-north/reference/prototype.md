# prototype — Protótipo visual navegável

**Objetivo:** resolver a dor real da Ohana — "ninguém prototipa visualmente pra mim, é só
wireframe no chat". Aqui o protótipo é o **artefato central da conversa**: algo que ela VÊ e
com que INTERAGE, pra reagir e comparar alternativas ANTES de comprometer com código.

**Isto NÃO é o `/impeccable`.** Impeccable produz UI de produção no repo. Aqui é conceito
**descartável, baixa-fidelidade, rápido** — o suficiente pra decidir a direção, não pra
enviar. Quando a direção for escolhida, faça handoff pro `/impeccable shape`.

## Quando prototipar (não é sempre)

Per o pedido da Ohana: protótipo **só em cenários maiores/robustos, quando ela pede
explicitamente, ou quando você percebe que ela claramente não tem certeza do caminho**. Se a
decisão é simples ou já clara, não prototipe — recomende e siga. Prototipar à toa é desperdício.

## O movimento

1. **Confirme as alternativas a comparar.** 2–3 direções distintas (não variações de
   espaçamento — direções de conceito: fluxos diferentes, hierarquias diferentes, modelos de
   interação diferentes). Cada uma tem que responder ao JTBD de um jeito diferente.
2. **Renderize visual e navegável.** Use a ferramenta de widget (`show_widget` do servidor
   `visualize` — chame `read_me` antes, silenciosamente). HTML interativo inline: telas
   clicáveis, estados, fluxo de ponta a ponta em baixa-fi. Use `sendPrompt()` nos botões pra
   ela conseguir te dar feedback direto do protótipo. Mantenha tosco de propósito (sem polir
   cor/tipografia — isso é trabalho do impeccable e poliria a coisa errada).
   - Para um fluxo de várias telas, um widget com navegação entre telas é melhor que descrição.
   - Use os tokens reais do `DESIGN.md` só o suficiente pra não parecer alienígena; não busque
     fidelidade de marca aqui.
3. **Aponte o trade-off de cada direção** ao lado do visual: o que cada uma ganha e arrisca
   em termos de adesão, esforço do usuário, e clareza do valor.
4. **Contraponha (contrato nº1).** Diga qual direção você escolheria e por quê — e o steelman
   da que você está descartando.

## Fim

Pergunte qual direção ressoou e o que mudaria. Quando ela escolher, sugira: `decide` (grava a
direção escolhida) e depois `/impeccable shape` (transforma o conceito em UI de produção).
