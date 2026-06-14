# Research: Espelho Honesto

**Nota**: decisões consolidadas retroativamente a partir da implementação (PR #13) e do planejamento em `docs/mvp/`.

## Decisão 1 — Validação determinística além do schema

- **Decisão**: Além da validação de forma (Zod, em `schemas.ts`), aplicar um validador de **conteúdo** (`validateMirrorRuleset`) que checa 9 regras objetivas por string/regex, sem IA.
- **Rationale**: Schema garante que os campos existem e têm o tipo certo, mas não garante *qualidade* — não pega clichê, antítese, tom de coach de LinkedIn, travessão, "?" no fechamento. A "honestidade" precisava virar propriedade verificável e barata (sem custo de IA), testável em CI contra fixtures.
- **Alternativas consideradas**:
  - *Só prompt*: rejeitada — deixa a qualidade refém da variação do LLM a cada chamada, sem rede.
  - *Um segundo LLM como juiz*: rejeitada para o v1 — custo, latência e não-determinismo; o juiz precisaria ele mesmo de validação.

## Decisão 2 — `closing` (afirmação) no lugar de `closing_question` (pergunta)

- **Decisão**: O fechamento do espelho passou a ser uma **afirmação** (`closing`, sem "?"), e o campo legado `closing_question` é proibido (assert 9).
- **Rationale**: Fechar com pergunta ("isso ressoa?") empurrava o tom para coach. Uma afirmação honesta soa mais como um amigo inteligente constatando algo — alinhado à identidade da marca.
- **Alternativas consideradas**: manter pergunta de fechamento — rejeitada por tom; a captura de ressonância foi movida para os botões de feedback da UI, não para o texto.

## Decisão 3 — Lista de termos banidos específica de pt-BR

- **Decisão**: Buzzwords (`data-driven`, `orientado a resultados`, `proativo`, `jornada`…), gírias de elogio (`mandou bem`, `arrasou`, `fera`…) e padrões de antítese (`não é X, é Y`) são banidos por regex pt-BR.
- **Rationale**: O público é o profissional brasileiro; os clichês a evitar são os de LinkedIn em português. Regex permissivo o suficiente para pegar variações de gênero (`apaixonado/a`) e frases multi-palavra.
- **Alternativas consideradas**: lista em inglês — irrelevante para a saída; classificador ML — exagero para o v1.

## Decisão 4 — Validação resiliente a saída malformada

- **Decisão**: O validador trata campos ausentes como string vazia (`?? ''`) em vez de quebrar.
- **Rationale**: A saída do LLM pode vir incompleta; o validador deve reportar violações, não lançar exceção, para ser usável em teste e em runtime.

## Decisão 5 — Fixtures de qualidade como contrato de teste

- **Decisão**: 4 fixtures de perfis de PM (`tests/fixtures/mirror/`) servem de referência — espelhos bons (zero violações) e casos ruins (violações esperadas por assert).
- **Rationale**: Congela exemplos-ouro e exemplos-ruins, permitindo regressão objetiva quando o prompt ou as regras evoluírem.
