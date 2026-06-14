# Borogodó — Product Context

> Este arquivo é lido automaticamente pelo spec-kit e pelo Claude Code em toda sessão.
> Mantê-lo atualizado é responsabilidade de quem altera o produto.
> Documento completo: `docs/prd.md`

---

## O que é o Borogodó

App web de inteligência de carreira para o white-collar brasileiro.
A maioria dos profissionais não consegue enxergar nem comunicar o próprio valor.
O produto resolve isso com três cores de igual peso:

1. **Espelho** — revela onde a pessoa manda bem e onde pode crescer, com evidência real do que ela fez (não autoavaliação genérica)
2. **Mapa de carreira** — constrói o histórico profissional de forma visual e clara: clustering de skills, padrões de trajetória, perfil profissional por especialização. Responde "quem sou eu como profissional?" para quem tem anos de experiência mas nunca conseguiu enxergar o próprio mapa.
3. **Geração de conteúdo** — transforma esse histórico em post, bio ou resumo que soa como a pessoa, não como IA

**Frase única:** entenda o seu próprio valor e mostre ele ao mundo, a partir do que você realmente faz.

**North Star Metric:** ações de valor por usuário ativo por mês — onde "ação de valor" = consultar um insight do espelho OU publicar um conteúdo gerado a partir do histórico.

> **Em revisão (jun/2026):** dado o reposicionamento para "base de evidências com payoff
> episódico" (ver espinha abaixo), as métricas que importam no começo são **taxa de aha**
> (a revelação emociona?) e **retorno em momento de carreira** (a pessoa volta quando
> precisa se mostrar?). Frequência alta vem depois, se vier.

---

## A espinha do produto — o seu borogodó em 4 movimentos

> Esta é a estrutura-mãe do produto **e** da marca (registrada em 13/jun/2026). Toda
> feature, tela, copy e campanha de marketing se encaixa em um destes quatro movimentos.
> O nome **é** a estratégia: borogodó é aquilo em que você é bom sem saber nomear — e ele
> não serve de nada guardado; existe pra ser usado. Versão para marketing/LP em `docs/marca.md`.

1. **Descobrir** o seu borogodó — a revelação, o "aha". *"Eu não sabia que era boa nisso."*
2. **Entender** o seu borogodó — o mapa: skills segmentadas por categoria, com evidência. *"Agora vejo a forma da minha carreira."*
3. **Provar** o seu borogodó — evidência externa que sustenta (reviews, produtos no ar, depoimentos, artefatos). *"Tenho como comprovar."*
4. **Usar** o seu borogodó — onde a carreira pedir: processo seletivo, post, review, conteúdo. *"Sei mostrar — do meu jeito."*

**Os dois jobs, contidos no nome:** Descobrir + Entender = *saber qual é* o seu borogodó
(introspecção). Provar + Usar = *saber usar* o seu borogodó (projeção). A marca segura os dois.

**Como os três cores antigos se encaixam:** Espelho = Descobrir + Entender; Mapa de carreira
= Entender; Geração de conteúdo = Usar. O pilar **Provar** é a adição que dá credibilidade de
recrutador e mata o clichê com evidência real (subiu cirurgicamente: começa só com link de
validação externa, não com o álbum completo de artefatos).

**Wedge (foco da aposta):** não é uma vitamina de autoconhecimento — é a **base de evidências
do seu borogodó, que paga nos momentos que importam na carreira** (entrevista, review,
promoção, um post forte). É por isso que a pessoa volta: pra montar o próprio caso. Não é
copiloto de busca de emprego (Cluster C) — é a camada de evidência durável embaixo de todos
esses momentos.

**A premissa brasileira (vai fundo, não é enfeite):** o produto ajuda o profissional
brasileiro a mostrar valor **sem parecer que está se gabando** e **sem soar como IA** —
mostrar seu borogodó não é se gabar, é deixar aparecer o que já é seu. A taxonomia de skills
honra a realidade brasileira (versatilidade forjada na escassez, navegação de ambiguidade,
articulação relacional) como força evidenciada, não como falta de foco. O antídoto cultural à
dificuldade brasileira de se vender é a marca, não um recurso.

**Foco inicial:** cravar uma persona primeiro — **Ana (PM)** — antes de generalizar para as
quatro. Qualidade excepcional da revelação em uma frente bate qualidade média em quatro.

**Anti-clichê (regra de produto, não de prompt):** toda afirmação do espelho aponta para uma
evidência real (uma entrada). Sem evidência, a IA **pergunta** — nunca inventa. Num produto de
carreira, fabricação é fatal: específico + citado > grandioso + vago.

---

## As quatro personas

### Ana — Product Manager (tech, AI-native)
- 6 anos de produto, usa ferramentas de IA no dia a dia
- **Dor:** esquece o que entregou; acha o dia a dia trivial demais; trava pra se posicionar; medo de soar como IA
- **Ganho:** presença consistente, banco de histórias para entrevista, clareza para pleitear senioridade

### Bruno — Executivo de vendas
- Bate (ou não) meta todo mês, troca de empresa com frequência
- **Dor:** não documenta as próprias vitórias; na hora da entrevista não lembra dos números; sente que "só vende", sem enxergar a competência por trás
- **Ganho:** histórico de conquistas com números, clareza das próprias forças (negociação? farming? hunting?), presença que atrai oportunidade

### Clara — Analista/coordenadora financeiro-administrativa
- Competente e confiável, mas pouco visível; pensa em crescer para liderança ou trocar de área
- **Dor:** trabalho operacional "invisível"; não sabe articular impacto; insegurança para se posicionar; consome conteúdo, publica nada
- **Ganho:** enxergar o próprio impacto traduzido, descobrir onde se diferencia, ganhar confiança e visibilidade para a próxima vaga ou promoção

### Rafael — Profissional sênior de tech/produto (7+ anos)
- Muito bom no que faz, entregou muito em startups, scale-ups e contextos variados
- **Dor:** nunca conseguiu enxergar o próprio mapa profissional — o que é por skills, onde é realmente forte, qual padrão define sua trajetória; não sabe se é generalista ou especialista muito específico
- **Ganho:** o mapa de carreira visual revela o perfil por especialização (ex: AI-native, 0→1, adaptação rápida em contextos complexos), dando clareza de identidade profissional pela primeira vez

---

## Escopo do v1 (o que está DENTRO)

1. Captura multimodal: texto livre, áudio com transcrição, upload de arquivos (md, pdf, docx, txt)
2. Estruturação: extração de entradas no esquema (o que fiz / decisão / aprendizado / impacto-métrica / data / tags)
3. Espelho: timeline + agrupamento por forças + busca em linguagem natural + leitura "onde você manda bem / onde pode crescer"
4. Geração de conteúdo: rascunho guiado por 2–3 perguntas, a partir de uma entrada/tema
5. Revisão e uso: a pessoa edita e copia — sem publicação automática

---

## O que está FORA do v1 (não implementar)

- Publicação automática no LinkedIn
- Currículo por vaga, portfólio completo, artigo longo
- Integrações automáticas com Jira, CRM ou ferramentas de trabalho
- Recursos de time ou colaboração
- Gamificação ou relatórios visuais
- App mobile dedicado
- Outros idiomas além do português

---

## Marca e tom de voz

**Nome:** Borogodó — palavra brasileira para o charme indefinível, "aquele quê".
O produto revela o borogodó profissional da pessoa.

**Tom:** brasileiro, espirituoso e caloroso. Nunca corporativo, nunca SaaS genérico de IA.
Humor sutil quando cabe. Direto. Como conversa, não como pitch.

**Identidade visual:**
- Paleta: roxo-jambo (primary), coral-faísca (accent), mel (warm), verde-água (teal), creme (background)
- Tipografia: Fraunces (display/títulos) + Geist Sans (corpo)
- Ritmo visual por seção: cada seção muda de temperatura cromática ao rolar
- Proibido: gradiente roxo-azul genérico, Inter como única fonte, cards dentro de cards, fundo escuro com texto neon

**O que o produto nunca deve parecer:** template de SaaS de 2022, tradução de produto gringo, IA genérica.

---

## Princípios do produto (guiam cada decisão de design e feature)

1. A captura precisa ser quase invisível. Se exige esforço, falha.
2. O valor está em **revelar** — não em escrever no lugar da pessoa.
3. A voz e os dados são sempre da pessoa. O produto nunca soa como IA genérica.
4. Insight honesto, não bajulação. Mostrar lacunas com cuidado é parte do valor.
5. Brasileiro de verdade: idioma, jeito, humor e referências. Não é tradução.
