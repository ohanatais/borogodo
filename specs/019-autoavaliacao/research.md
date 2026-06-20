# Research — Autoavaliação de Desempenho (019, modelo cockpit)

**Reescrito em 2026-06-19** para o redesign cockpit (`docs/estrategia-autoavaliacao-cockpit.md`). As
decisões do kickoff (modelo "gerar 2 variações") estão **superadas**; o que sobrevive é a fundação de
**período** (seed por intervalo, presets+range) e a **persistência em `drafts`** isolada do espelho.

A spec já fechou o produto nas Clarifications de 2026-06-19. O trabalho aqui é decidir a **arquitetura
técnica** do cockpit — em especial onde a IA entra (e onde NÃO entra) e como o texto **escrito pela
pessoa** é persistido sem reabrir a disciplina anti-invenção.

## D1 — A autoavaliação deixa de ser gerada: `generateDraft` sai do caminho

**Decisão:** **remover** o ramo `self_assessment` de `generateDraft` (as 2 variações), o
`SELF_ASSESSMENT_SYSTEM_PROMPT`/`buildSelfAssessmentUserPrompt` e a extensão `self_assessment` da rota
`POST /api/content/generate`. A autoavaliação é **escrita pela pessoa** (superfície "pra dentro"); a
IA nunca gera o bloco. O motor da 013 continua dono só das superfícies "pra fora" (post/bio/resumo).

**Rationale:** é o coração do redesign (estratégia §1–3). Manter o ramo de geração conviveria com o
modelo certo e tentaria a reintroduzir o "não é meu". O motor `generateDraft` permanece intacto para
os outros formatos — só perde o destino `self_assessment`.

**O que sobrevive da PR 46:** `loadPeriodSeed` + `period.ts` (`parsePeriodSeedRef`/presets) +
`PeriodPicker` (alimentam o recap e a trilha de evidências), `drafts.format='self_assessment'` +
`seed_type='period'` (persistência), colunas de recorrência em `profiles`, entrypoint na nav, e
`SelfAssessmentHistory` (US3). **O que sai:** prompt de geração, ramo de `generateDraft`, e a tela
estilo `GenerateSheet`/`DraftCard` como superfície da autoavaliação.

**Alternativa rejeitada:** manter `generateDraft self_assessment` como "modo opcional de gerar" — viola
a tese dos dois modos e mantém o anti-padrão que o discovery proíbe.

## D2 — Recap "o seu ano, em fatos": determinístico, sem LLM

**Decisão:** o recap é montado **deterministicamente** a partir do `loadPeriodSeed` — uma lista enxuta
dos registros do período, **cada item com a fonte** (chip clicável que aponta para a `entry` de
origem), **zero adjetivo**. Sem chamada de LLM.

**Rationale:** "auxílio de memória, não a avaliação" (estratégia §3.2). Render determinístico **garante
por construção** os dois guarda-corpos mais importantes: zero invenção e zero floreio — a máquina não
pode inflar o que ela só está listando. É também o caminho mais barato e o mais fácil de testar. A
evidência já vem estruturada do seed (`SeedEvidence.evidence[]`), então o recap é uma transformação de
apresentação, não de conteúdo.

**Alternativa rejeitada:** condensar o período com Haiku. Adiciona custo, latência e — pior — um ponto
onde a IA poderia introduzir adjetivo/síntese interpretativa num lugar que precisa ser factual. Fica
como fast-follow **só** se períodos enormes exigirem agrupamento (YAGNI agora; o `MAX_PERIOD_EVIDENCE`
já limita o volume).

## D3 — Onde a IA entra na superfície de escrita (e os guarda-corpos)

A IA assiste a escrita com **três ajudas pequenas e opt-in**, nenhuma gera bloco nem insere/sobrescreve
(provenance-at-decision: a pessoa aceita/rejeita/edita). Todas ficam em um módulo novo
`src/lib/ai/content/assist.ts` — **fora** de `generateDraft`.

| Ajuda | Como funciona | Modelo | Anti-invenção |
|---|---|---|---|
| **"Reescreve com minhas palavras"** | recebe **a frase que a pessoa já escreveu** e devolve uma reescrita na voz dela; nunca cria afirmação nova | `claude-sonnet-4-6` (voz) | opera só sobre o texto da pessoa; não adiciona fato |
| **"Não sei por onde começar"** (modo `unblock`) | entrevista opt-in de **1 pergunta** ancorada no recap; a resposta da pessoa vira **rascunho dela**, editável. Rótulo escolhido por dizer o que acontece ("destravar" não comunicava o uso) | `claude-sonnet-4-6` | a IA pergunta; a pessoa escreve a resposta |
| **Nudge STAR/impacto** | detecta afirmação vaga ("fiz um ótimo trabalho") e **pergunta** "qual foi o resultado/número/antes-depois?" — não preenche | heurística determinística (detecção) | só pergunta; nunca propõe o número |

**Rationale:** é a intervenção de UX de maior alavancagem (estratégia §3.3) preservando a autoria
("paradoxo propriedade-eficiência"). A IA **nunca dá nota** nem "melhora" a autoavaliação
(anti-IA-juiz, Clarification 2026-06-19). O nudge STAR começa **heurístico** (detecta ausência de
número/resultado por padrão de texto) — determinístico, testável, sem custo; vira AI-light só se a
heurística for fraca demais (YAGNI).

**Alternativa rejeitada:** reusar o motor de chips/ajuste da 013 ("mais conciso", "mais formal"). Esses
são affordances de **post**; "reescreve com minhas palavras" é a única reescrita legítima aqui, e ela é
sobre fidelidade à voz, não sobre craft de publicação.

## D4 — Persistência da autoavaliação escrita: reuso de `drafts`, com status `draft`

**Decisão:** a autoavaliação escrita vive em `drafts`, `format='self_assessment'`, `seed_type='period'`,
`seed_ref='period:::<from>:::<to>'`, `body` = o texto que a pessoa escreveu, **estruturado por seções**
(entregas / impacto / evolução / pontos a desenvolver) como texto puro com cabeçalhos. Como a pessoa
**escreve** (não gera), o status nasce **`draft`** (novo valor do CHECK) e segue para `copied`/
`discarded`. Os campos `angle`, `qa`, `voice_feedback` ficam não usados (exceto `qa.forwardStep`, D5).

**Rationale:** reuso máximo da tabela e da RLS (constituição III), e `drafts` já é **separado de
`entries`/espelho** — exatamente o isolamento que a estratégia exige (a interpretação da pessoa não
vaza como "fato"). `generated` seria mentira semântica (ninguém gerou); `draft` nomeia "rascunho em
andamento, autorado pela pessoa". É a única mudança de status, aditiva e nullable-safe.

**Alternativa rejeitada:** nova tabela `self_assessments`. Over-engineering — é 1:N por usuário, mesmo
shape de `drafts`, mesma RLS. Reusar `body` mantém o histórico (US3) e o isolamento de graça.

## D5 — "Um passo à frente" (plano de ação + prep de 1:1): onde a IA gera e onde guarda

**Decisão (v1):** o passo-pra-frente é **uma oferta única, opcional, in-flow**, gerada por LLM
(`claude-sonnet-4-6`) **ancorada nas palavras que a pessoa escreveu** — plano GROW(Will)+70-20-10 (uma
ação de **experiência**) e/ou talking points de 1:1. No v1, o resultado é guardado **dentro do `qa`
jsonb do próprio draft da autoavaliação** (`qa.forwardStep`), não como artefato separado. A data de
revisão que a pessoa define grava `profiles.review_cycle_*` (gatilho ético da US2/recorrência).

**Rationale (e o flag honesto):** é a única peça de IA que **gera conteúdo novo** nesta feature, então
carrega o guarda-corpo mais forte: só pode usar o que **a pessoa escreveu** como insumo — no instante
em que inventar uma área de desenvolvimento ou inflar um caso, vira o coach genérico que o discovery
proíbe (estratégia §3, guarda-corpos). Guardar no `qa` jsonb evita migration extra e mantém o passo
**atado** à autoavaliação que o originou (ele não é navegado sozinho no v1). **Trade-off:** se depois
quisermos que o plano tenha lifecycle próprio (editar/copiar/marcar concluído independente), promovê-lo
a draft-irmão (`format='action_plan'` + coluna `source_draft_id`) é o fast-follow limpo. Recomendo
`qa` jsonb agora (YAGNI) — é a decisão que vale confirmar com você.

**Alternativa rejeitada:** draft-irmão já no v1 — 2 valores de enum + FK nova para um artefato P2 que
ainda não precisa de lifecycle independente.

## D6 — Sentence-stems ancorados em fato (matar a página em branco sem texto pronto)

**Decisão:** os stems são **moldes determinísticos** preenchidos com âncoras do recap — ex.: "Em
[mês/projeto], eu…", "O resultado de [registro] foi…" — derivados dos próprios itens do
`loadPeriodSeed`. O texto da pessoa começa do molde; nunca de um parágrafo pré-pronto da IA.

**Rationale:** mata a página em branco (o inimigo original) sem ghostwriting (estratégia §3.3). Como
saem da evidência real do período, são ancorados em fato por construção; determinísticos = testáveis,
sem custo, sem invenção.

**Alternativa rejeitada:** stems genéricos fixos ("Minha maior entrega foi…"). Não ancoram em nada do
período — viram formulário morto. Os do seed puxam a memória do que de fato aconteceu.

## D7 — Gatilho de calendário (US2): `getReviewCycleSignal`, paralelo ao `getReturnSignal` da 016

**Decisão:** novo `getReviewCycleSignal` em `src/lib/panel/`, **paralelo** (não dentro) ao
`getReturnSignal` da 016. Lê `profiles.review_cycle_months`/`review_cycle_anchor`; quando o ciclo se
aproxima, expõe um sinal que `getPanelData` integra como convite no painel. **Só painel** no v1 (sem
e-mail). Com poucos dados recentes, o convite é "registre antes" (alimentar), não "gere agora".

**Rationale:** ressurgimento da 016 é por **delta** (entrada nova); este é por **calendário** (ritmo de
avaliação) — eixos distintos. Função separada mantém cada sinal coeso e testável (constituição II),
reusando a **superfície** de ressurgimento, não a lógica de delta. (Inalterado em relação ao plano da
PR 46 — esta peça da US2 não dependia do modelo de interação.)

**Alternativa rejeitada:** mais um `type` no `getReturnSignal` — mistura delta com calendário numa
função já carregada.

## D8 — Persistência da recorrência: colunas aditivas em `profiles`

**Decisão:** `review_cycle_months` (smallint, nullable; default conceitual trimestral/semestral,
**editável**) e `review_cycle_anchor` (date, nullable). Sem recorrência → o gatilho **não dispara**
(FR-009); escrita/uso sob demanda nunca é bloqueado. Segue o padrão da 016
(`profiles.last_panel_seen`): server-side, cross-device, aditivo, nullable.

**Alternativa rejeitada:** tabela `review_cycles` (over-engineering para config 1:1) e localStorage (não
cross-device, difícil de testar).

## D9 — Migration: número 013 (resolve a colisão de 012)

**Decisão:** **013**. Havia DOIS arquivos `012`: `012_entry_title.sql` (017, **já em `main`**) e a
versão antiga desta feature. Renumerada para `013_self_assessment_and_review_cycle.sql`. Uma migration
coesa: estende `drafts_format_check` (+`self_assessment`), `drafts_seed_type_check` (+`period`),
`drafts_status_check` (+`draft`) e adiciona as duas colunas de recorrência em `profiles`. Aditiva e
idempotente.

**Rationale:** FR-011 manda confirmar o número livre respeitando a ordem de merge dos elos paralelos; o
audit do diretório de migrations confirmou a colisão e que `013` é o próximo livre.

---

**Saída:** decisões de arquitetura do cockpit resolvidas. Sem `NEEDS CLARIFICATION` pendente. Um ponto
a **confirmar com a Ohana** (não bloqueia o plano): D5 — guardar o passo-pra-frente no `qa` jsonb no v1
vs. draft-irmão. Pronto para Phase 1 (data-model, contratos, quickstart).
