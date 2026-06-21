# Estratégia — Autoavaliação e o modelo "cabine de reflexão" (cockpit)

**Data:** 2026-06-19
**Status:** direção aprovada para re-especificar a 019. Substitui o modelo de interação da spec original
(`specs/019-autoavaliacao/spec.md`, que reusava o fluxo de post: gerar 2 variações → editar → copiar).
**Origem:** pesquisa profunda de mercado em 5 frentes (com fontes). Dados/números de mkt em
`mercado.md` e `mapa-competitivo.md`.

---

## 1. O problema com o modelo original

A 019 foi plugada no motor de conteúdo da 013/014 ("um motor, vários destinos"). Com isso herdou, de
graça, affordances de **post**: "soa como você?", chips de tom ("menos formal", "tira jargão"),
copiar-pra-publicar, e um fluxo de **mão única** (a IA gera, você consome).

Três fraturas:
1. **Ninguém posta uma autoavaliação.** As affordances de publicação são ruído.
2. **A autopercepção é o coração, não input opcional.** A IA só vê o que foi registrado; não vê
   intenção, esforço invisível, contexto, ambição. Tratar a leitura da máquina como verdade e a sua
   como ajuste fino **inverte a hierarquia** e produz o "não é meu".
3. **A página em branco era o inimigo original** — mas a solução não é a IA escrever por você; é a
   IA **lembrar você dos fatos** e você escrever ancorado neles.

## 2. A tese unificadora: o produto tem dois modos

> **O usuário é o autor; a IA é o espelho ancorado em fato e a assistente não-invasiva — nunca a
> ghostwriter do "eu".**

- **Superfícies "pra dentro"** (quem sou eu / o que fiz — **espelho, autoavaliação**): escritas pela
  pessoa, ancoradas pela IA. Aqui ghostwriting gera o "não sou eu".
- **Superfícies "pra fora"** (mostrar ao mundo — **post, bio, presença**): assistidas pela IA, dona a
  pessoa. Aqui ajudar na craft é legítimo (um post é performance).

Nomear essa fronteira é o ganho estratégico. Resolve a tensão do discovery ("não virar coach
genérico"): coaching só entra como o **passo-pra-frente opcional, ancorado em evidência**.

## 3. O novo modelo da autoavaliação (cockpit: lembrar → refletir → planejar)

1. **Período** — escolha (preset/range; já implementado).
2. **"O seu ano, em fatos"** — recap enxuto, cada item **com a fonte do registro** (chip clicável),
   zero adjetivo. Combate viés de recência e a autossubavaliação (ver `mercado.md`). É **auxílio de
   memória, não a avaliação**.
3. **Você escreve** — primeira pessoa, com a **trilha de evidências ao lado** (não chat). A IA faz só
   **microssugestão** + **"reescreve com minhas palavras"**, nunca gera bloco. Página em branco morre
   com **sentence-stems ancorados em fato**, não com texto pré-pronto. **"Me ajuda a destravar"** =
   entrevista opt-in de 1 pergunta que vira *seu* rascunho editável.
   - **Nudge STAR/impacto** ("qual foi o resultado / número / antes-depois?") em vez de aceitar "fiz um
     ótimo trabalho" — a intervenção de UX de maior alavancagem.
4. **A IA é âncora de evidência, nunca avaliadora** — sem nota, sem "sua autoavaliação está fraca". Só
   "você citou X, aqui estão 3 registros que sustentam" e "você esqueceu desse ganho registrado, quer
   incluir?". (Rephrase é percebido como menos crítico que correção.)
5. **Um passo à frente** — oferta **única, in-flow, opcional, ancorada nas suas palavras**
   ("você escreveu que quer afiar X — vira plano de ação?"). Estrutura **GROW (Will)** + **70-20-10**
   (uma ação de **experiência**, não lista de cursos). Segundo artefato paralelo: **prep de conversa
   com o gestor** (talking points / rascunho de caso de promoção). Re-entrada **ética**: data que
   *você* define; sem streak, sem gamificação; **silêncio total se recusar**.

### Guarda-corpos inegociáveis
- **Anti-invenção absoluto.** No instante em que o passo-pra-frente inventar uma área de
  desenvolvimento ou inflar um caso de promoção, vira o coach genérico que o discovery proíbe.
- **A escrita da pessoa não vaza pro espelho como "fato".** Autoavaliação é interpretação; vive em
  `drafts` (ou store próprio), separada de `entries`. O espelho continua só com fato registrado.
- **A IA nunca insere/sobrescreve** — só sugere texto que a pessoa aceita/rejeita/edita
  (provenance-at-decision). Andaime demais aumenta output mas **destrói o senso de autoria**
  ("paradoxo propriedade-eficiência").

## 4. O que sobrevive da PR 46 (fundação reaproveitável)

Refazer o **modelo de interação**, reaproveitar a **fundação**:
- ✅ Mantém: seed por período (`loadPeriodSeed`), formato `self_assessment` + migration 012, motor de
  evidência ancorada, entrypoint na nav, histórico em `drafts` (separado do espelho), estado "base
  limitada".
- ❌ Substitui: o reuso do `GenerateSheet`/`DraftCard` de post (gerar 2 variações → editar → copiar →
  "soa como você") pela superfície de escrita própria com trilha de evidências.

## 5. Onde isso se propaga (cross-feature) e sequência

1. **Re-especificar a 019 no modelo cockpit — agora** (ainda em planning, é de graça). Campo de prova
   da tese.
2. **Espelho v2 — maior alavancagem de marca.** Hoje é veredito da IA; deveria **incorporar a
   autopercepção**: a pessoa confirma/contesta uma força ("isso é real / não sou eu / eu subestimo
   isso") e pode **declarar** uma força pra IA caçar evidência (ou reportar honestamente que não
   achou). É a marca literal — "deixar aparecer o que já é seu" = co-autoria, não veredito.
3. **Prep de 1:1 como passo-pra-frente recorrente** — conserta a retenção episódica melhor que o
   gatilho de calendário anual.
4. **Promotion case builder** — payoff monetizável de maior intenção, depois da fundação provada.
5. **Segurar a geração de conteúdo (013/018) como está** — único lugar onde ghostwriting é correto; só
   rotular a fronteira.

## 6. Posicionamento (resumo; detalhe em `mercado.md`)

- Contra ferramentas do **empregador** (Lattice/15Five/Gupy), não contra journaling: a narrativa é
  sua, portátil, privada — alimenta o ciclo da empresa sem ser controlada por ele.
- **Equidade com lastro:** Exley & Kessler 2022 (gap de autopromoção real e robusto). **Não** usar o
  dado apócrifo "60% vs 100%" da HP.
- **Cultura pt-BR:** "pra quem tem dificuldade de se vender" — a ferramenta marshala o fato pra você
  nunca soar arrogante. Mais afiado no Brasil.
- **Privado/utilitário primeiro** (lição Polywork, encerrou jan/2025).

---

## Fontes-chave
- Exley & Kessler, *The Gender Gap in Self-Promotion*, QJE 2022 — https://academic.oup.com/qje/article/137/3/1345/6513425
- Desmonte do dado HP 60/100 — https://www.bi.team/blogs/women-only-apply-when-100-qualified-fact-or-fake-news/
- Brag document (Julia Evans / GitHub Readme) — https://github.com/readme/guides/document-success
- Polywork (encerramento) — https://www.producthunt.com/products/polywork/alternatives
- "Who Owns the Text?" (autoria em co-escrita IA) — https://arxiv.org/abs/2601.10236 ; paradoxo propriedade-eficiência — https://arxiv.org/pdf/2402.11723
- 70-20-10 / IDP — https://www.deel.com/blog/70-20-10-development-plan/ ; GROW — https://positivepsychology.com/grow-coaching-model/
- SHRM, IA aprofundando 1:1 — https://www.shrm.org/topics-tools/news/hr-trends/ai-coaching
- BragBook (promotion case) — https://bragbook.io/what-is-a-brag-document
- Autoavaliação pt-BR (Gupy) — https://www.gupy.io/blog/autoavaliacao-de-desempenho
