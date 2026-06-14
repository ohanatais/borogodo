# Spec: 007 — Painel Redesign

**Feature**: 007-painel-redesign  
**Depende de**: 006-espelho-honesto (006b/006c)

## O quê e por quê

O painel atual mostra o headline do espelho + IndicatorStrip + insights + entradas recentes.
Está funcional mas não revela a identidade da pessoa. O objetivo é transformar o painel
em uma declaração de identidade profissional: o "borogodó" da pessoa visível em 3 segundos,
com destaques de trajetória e mini linha do tempo.

## User Stories

**US1 — Ver o cartão do borogodó**  
Como usuária com espelho gerado, quero ver um cartão com minhas especialidades, skills
destaque e padrão de carreira, para que minha identidade profissional fique clara.

**US2 — Ver trajetória em destaque**  
Como usuária, quero ver até 3 conquistas em resultado-primeiro, para que minha
contribuição real apareça sem eu ter que lembrar de tudo.

**US3 — Ver mini linha do tempo**  
Como usuária, quero ver os 3 papéis mais recentes (cargo · empresa), para que minha
trajetória recente seja visível no painel.

## Decisões de UX (fonte: decisoes-ux-painel-espelho-historico.md)

- Cartão herói: avatar + "O borogodó de {nome}" + especialidades em chips + skills em pílulas + padrão
- Status do espelho: nunca label estático — vira convite pra frente
- Highlights: resultado-primeiro, 1 linha de evidência
- Mini timeline: 3 itens desktop (direita), colapsa pro fim no mobile
- Estado vazio (poucas entradas): cartão exibe "seu espelho tá se formando" + convite

## Fora de escopo

- Ajuste de tier pelo usuário (entra depois)
- Linha do tempo completa (feature histórico)
- Agrupamento de entradas por empresa/período (depende de dedup #9)
