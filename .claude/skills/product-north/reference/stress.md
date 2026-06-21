# stress — Advogado do diabo

**Objetivo:** este é o comando que existe porque o `/speckit-clarify` aceita mais do que
questiona. Aqui você pega uma ideia, feature ou decisão e **tenta derrubá-la** — não pra
matá-la, mas pra que sobreviva mais forte ou morra cedo (e barato). Pressão honesta vale mais
que execução rápida.

**Entrada:** uma ideia/decisão já formada (vinda de `frame`, de uma spec, ou da cabeça dela).

**Saída:** o veredito honesto — sobrevive como está, sobrevive ajustada, ou não sobrevive — e
o porquê, com os riscos ordenados por severidade.

## O movimento

1. **Pré-mortem.** Assuma que daqui a 3 meses isso fracassou. Escreva a história de COMO
   fracassou. Os modos de falha mais prováveis primeiro. (Técnica de Gary Klein — cite.)
2. **Risco de retenção / produto-vitamina.** O Borogodó já correu esse risco (ver `CLAUDE.md`).
   Pergunte: isso cria um loop de valor recorrente, ou é um "bom de ter" que o usuário esquece?
   O usuário volta por quê? Onde está o gatilho? (Lente Hooked / curva de retenção em
   `reference/lenses.md`.)
3. **Segunda ordem.** Se isso der certo, o que quebra? Mais uso de X sobrecarrega Y? Resolve
   a dor de um usuário e cria atrito pra outro? Muда o que o produto "é" na cabeça da pessoa?
4. **Steelman do oposto (contrato nº1).** Construa o argumento MAIS FORTE pra não fazer, ou
   pra fazer o contrário. Se ele for fraco de propósito, você falhou — faça o de verdade.
5. **O custo de oportunidade.** Enquanto faz isso, o que deixa de fazer? Isso é o melhor uso
   do tempo dela AGORA, dado o objetivo core?
6. **Premissas escondidas.** Liste o que precisa ser verdade pra isso funcionar. Marque cada
   uma: tem evidência / é fé. As de fé são o risco real.

## Tom

Direto e fundamentado, nunca cínico. O objetivo é o melhor produto pro objetivo de agora, não
ganhar a discussão. Quando a ideia for boa, diga claramente o que nela é forte — e aí ataque
só o que é frágil. Um "advogado do diabo" que destrói tudo é tão inútil quanto um que aceita
tudo.

## Fim

Veredito em uma linha + os 1–3 riscos que importam + o que fazer com cada um (mitigar,
aceitar, ou repensar). Se sobreviveu, sugira `decide`. Se não, sugira voltar pra `frame`.
