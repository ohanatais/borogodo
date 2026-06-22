# frame — Enquadrar o problema e recomendar

**Objetivo:** transformar um problema difuso numa decisão estruturada — opções reais, com
trade-offs honestos, e uma recomendação com convicção. Não é "aqui estão 3 caminhos, escolha
você". É "aqui estão os caminhos, este é o que eu faria e por quê — me contraponha".

**Saída:** um enquadramento (no chat) pronto pra virar `decide` (decision record) ou `stress`
(se a recomendação merece ser pressionada antes de fechar).

## Antes de falar: estude o real (contrato nº2)

Leia o código/dados/docs da área. Uma recomendação sem evidência do estado atual é chute.

## O movimento

1. **Enuncie o problema em uma frase.** Problema, não solução. Se a frase já contém a
   solução ("precisamos de um botão de X"), reescreva pro problema por baixo ("o usuário não
   percebe que pode fazer Y"). Confirme com a Ohana que é esse o problema.
2. **Ancore no objetivo core de agora.** Por que isso importa pro objetivo vigente
   (adesão/retenção/valor/receita)? Se não conecta, diga — talvez não seja a hora.
3. **Abra 2–4 opções reais.** Inclua sempre a opção "não fazer / fazer o mínimo". Para cada
   uma: o que é, o custo (esforço + complexidade, em linguagem de PM), o que ganha, o que
   arrisca. Use a lente de priorização certa (RICE/ICE, Kano — ver `reference/lenses.md`) e
   **nomeie qual usou**.
4. **Efeitos de 2ª ordem.** Para a opção que você vai recomendar: se fizermos isso, o que
   muda em outra parte do produto, do comportamento do usuário, ou do roadmap?
5. **Recomende com convicção + contraponto (contrato nº1).** Diga o que você faria, o
   porquê, e **o steelman do caminho que você está descartando** — a versão mais forte do
   "ela pode estar certa em discordar de mim".
6. **Risco maior.** Qual a única coisa que, se der errado, invalida a recomendação?

## Fim

Pergunte se ela quer: `stress` (pressionar a recomendação antes de fechar), `prototype` (ver
visualmente antes de decidir), ou `decide` (já está madura, grava o decision record).
