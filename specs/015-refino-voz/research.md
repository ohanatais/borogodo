# Research: Refino de Voz e Qualidade Contínua (015)

Fonte: epic plan `docs/conteudo-plano-de-acao.md` + a fundação de 013/014. Decisões de **qualidade
contínua**, não de motor.

## Decisão 1 — Recalibração de voz é híbrida e com consentimento

**Decisão**: O sistema sugere recalibrar quando há sinal acumulado (`voice_feedback` em `drafts`); a
pessoa confirma; a recalibração funde feedback + amostras e atualiza `inferred_summary`/`tone`,
**preservando** as amostras explícitas.

**Rationale**: Mudar a voz da pessoa sem ela saber quebra confiança (é a voz dela). O consentimento
mantém o controle com ela. Preservar as amostras evita que feedback ruidoso apague a âncora de verdade.

**Alternativas rejeitadas**: Recalibração automática silenciosa (perda de controle/confiança); ignorar
o feedback (voz fica estática, quebra a promessa de "melhora com o uso").

## Decisão 2 — Golden set como gate de CI, determinístico

**Decisão**: O golden set (013) é ampliado para os 3 formatos e roda no `ci.yml` como gate obrigatório.
As asserções de regra anti-IA são **determinísticas** (sobre o ruleset); saídas de LLM em fixtures são
**mockadas** — sem chamada real de IA no CI.

**Rationale**: O CI já roda `npm test` em todo PR. Tornar o golden set abrangente e bloqueante converte
a vigilância manual de voz num gate automático. Determinismo evita custo de IA e flakiness no CI (um
teste que chama o LLM de verdade seria caro e instável).

**Alternativas rejeitadas**: LLM-judge no CI (caro, flaky, não-determinístico); golden set só local
(regressão passa no merge).

## Decisão 3 — Mini-bio reusa o motor; só estende o CHECK

**Decisão**: Mini-bio é `format='mini_bio'` no mesmo `generateDraft`, com `miniBioDraftSchema` + prompt
próprio. Única mudança de schema: migration `010` estende o CHECK de `drafts.format`.

**Rationale**: A 013 desenhou o motor parametrizado por formato exatamente para isto. Mini-bio não pede
tela nova; reusa `GenerateSheet`/`DraftCard`/hub. A migration é mínima (um `ALTER` no CHECK).

**Alternativas rejeitadas**: Tabela/superfície nova para bio (desperdício; o motor já serve); coluna de
formato sem CHECK (perde a garantia de integridade que a 013 estabeleceu).

## Decisão 4 — Mini-bio tem regra anti-clichê própria

**Decisão**: O prompt de mini-bio herda a disciplina anti-IA do espelho **e** adiciona uma regra
anti-clichê de bio (proibir "apaixonado por tecnologia", "transformando ideias em realidade",
"profissional movido a desafios"). O ruleset ganha o(s) assert(s) correspondente(s).

**Rationale**: Bio é o formato onde o clichê é mais forte e mais datado. Sem a regra, a mini-bio soaria
genérica — exatamente o que o produto evita.

**Alternativas rejeitadas**: Reusar o ruleset do post sem adição (deixa passar clichê específico de bio).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Feedback ruidoso degrada a voz | Preservar amostras explícitas; recalibração só com sinal acumulado + consentimento |
| Golden set vira flaky no CI | Asserções determinísticas; fixtures mockadas; sem chamada real de IA |
| Mini-bio genérica | Regra anti-clichê de bio no prompt + ruleset; herança da disciplina do espelho |
| Migration 010 fora de ordem num batch | A 015 é o último elo; aplicar 009 (013) antes de 010 (015) |
