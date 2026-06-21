# decide — Consolidar a decisão (durável + handoff)

**Objetivo:** fechar a conversa num artefato que sobrevive ao fim do contexto e está pronto
pra virar trabalho. O estado durável mora em disco, não no chat (princípio que os hooks do
projeto já impõem).

**Saída:** um **decision record** em `docs/decisions/NNN-titulo-curto.md` + um handoff claro
pro próximo passo (em geral `/speckit-specify`).

## Antes de gravar

1. **Confirme que há uma decisão de verdade.** Se ainda há fé não testada ou opção em aberto,
   não force o record — volte pra `frame` ou `stress`. Um decision record de uma decisão que
   não foi tomada é dívida, não clareza.
2. **Descubra o próximo número.** Liste `docs/decisions/` (crie a pasta se não existir). Use o
   próximo número sequencial com zero à esquerda (`001`, `002`, ...).

## Formato do decision record

Grave em `docs/decisions/NNN-titulo-curto.md`:

```markdown
# NNN — <Título da decisão>

- **Data:** <AAAA-MM-DD>
- **Status:** decidido
- **Objetivo core que isso serve:** <adesão / retenção / valor / receita — qual e por quê>

## Contexto
<O problema em 2–4 frases. Por que decidir isso agora. O que foi estudado (evidência real).>

## Decisão
<O que foi decidido, em uma frase clara e acionável.>

## Alternativas consideradas
<Cada opção real, com o trade-off. Inclua o "não fazer". Marque a escolhida.>

## Por que esta (e o steelman do oposto)
<A justificativa + a versão mais forte do caminho descartado — pra a decisão ser revisável
mais tarde com honestidade.>

## Riscos e o que os mitiga
<Os 1–3 riscos que sobreviveram ao stress, e o plano pra cada um. As premissas de fé.>

## Como saber se acertamos
<A métrica/sinal que valida ou invalida a decisão. Quando reavaliar.>

## Próximo passo
<O handoff: /speckit-specify "<frase>", ou /impeccable shape, ou /post-social, etc.>
```

Mantenha enxuto — um record que ninguém relê não serve. Síntese, não transcrição da conversa.

## Fim

Confirme o caminho do arquivo gravado e dê o comando exato do próximo passo, pronto pra
copiar. Se o próximo passo for a spec, escreva a frase de `/speckit-specify` já redigida a
partir da decisão — o decision record é o melhor input que o speckit pode receber, e é o que
faz ele questionar menos e modelar melhor.
