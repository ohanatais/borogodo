# Plano de batch — implementar as próximas features no auto

> **Para quê serve este doc:** define a **ordem**, o que dá pra **paralelizar**, onde ficam os
> **gates humanos** e como o **pipeline mecânico** roda — para que as próximas features sejam
> implementadas o mais autônomo possível, sem o batch descarrilar. Par do `inputs-de-qualidade.md`
> (aquele é o combustível; este é o motor).

## Estado atual (checado em 13/jun/2026)

- ✅ Mergeado na `main`: **001** (landing), **002** (auth), **003** (capture), **004** (espelho v1).
- 🟡 Em andamento: **005** (painel) na branch `005-panel-dashboard` — fechar como está (não redesenhar).
- ⚠️ O espelho v1 (004) gera o **output clichê** que vamos consertar — por isso ele vem antes do redesign do painel.

## O princípio que evita o batch descarrilar

**Este roadmap é uma corrente, não um leque.** Subagente em paralelo só acelera trabalho
**independente**. Quase tudo aqui depende do anterior:

```
006 espelho honesto ──▶ 007 painel redesign ──▶ 008 provar (link) ──▶ 009 usar (conteúdo)
   (engine + schema)      (mostra o espelho)       (evidência ext.)      (depende de tudo)
```

Então a regra é: **paralelizar DENTRO de cada feature, serializar ENTRE features.** E manter
3 gates humanos que o auto não pode pular.

## Os 3 gates humanos (inegociáveis)

| Gate | Quando | Por quê |
|---|---|---|
| **1. Spec aprovada** | depois de `/speckit-tasks`, antes de implementar | garante que o agente coda a coisa certa |
| **2. Revelação validada** | só na 006 — antes de construir a engine | nenhum agente decide "isso emociona"; pular = clichê em escala |
| **3. PR + verify** | antes de cada merge | `/pr-review` (estático) + `/verify` (runtime) pegam coisas diferentes |

## A ordem das features

| Ordem | Feature | Verbo | Depende de | Migration? |
|---|---|---|---|---|
| 0 | Fechar **005** (painel atual) | — | — | não |
| 1 | **006 — espelho honesto** (prompt anti-clichê/anti-IA, evidência vinculada, foco Ana) | Descobrir + Entender | 004 | **não** (o `mirror` é jsonb — o shape já cabe) · ver breakdown abaixo |
| 2 | **dedup fuzzy de entradas (issue #9)** — base de qualidade pro espelho e o histórico | base de Entender | 003 (`saveEntries`) | depende da abordagem (ver nota #9 abaixo) |
| 3 | **007 — painel redesign** (cartão do borogodó, highlights) | (a casa) | 006 | talvez |
| 4 | **Histórico / linha do tempo de carreira** (sob "Mapa & Histórico") | Entender | 003, #9 | não |
| 5 | **008 — provar** (link de validação externa em entradas) | Provar | 006 | sim (`artifacts`/link) |
| 6 | **009 — usar** (geração de conteúdo lastreada, anti-gabação, superfícies BR) | Usar | 006, 008 | talvez |
| depois | álbum completo de artefatos · perfil verificável | Provar/norte | — | — |

### 006 em detalhe (revisado pós exemplos-ouro + leitura do código real, jun/2026)

**Descoberta-chave:** o espelho mergeado (004) guarda o conteúdo num campo `mirror jsonb`, e o
Zod já tem `primary_strength`, `invisible_skill`, `context_pattern`, `closing_question`,
`strength_themes`. Ou seja: **o shape já existe, não precisa de migration pra o core.** O
problema é de **prompt e de regras**, não de schema. Logo a 006 se divide em fatias finas:

| Fatia | O que faz | Migration | Validável com |
|---|---|---|---|
| **006a — Voz honesta** | Reescreve o `firstMirror` prompt com o ruleset dos exemplos-ouro (Frente 1 anti-clichê + Frente 2 anti-IA + métrica-convite). Adiciona **testes determinísticos** (banir travessão + lista de buzzwords). Corrige o defeito atual: **o prompt hoje literalmente ensina o travessão** ("…stakeholders — aparece em 4 entradas"). | não | exemplos-ouro + 2 testes-régua. **Do-or-die, primeira fatia.** |
| **006b — Evidência vinculada** | Estrutura `evidence` como `{ text, entry_ids[] }` no jsonb (hoje é prosa solta). Torna a evidência clicável (Decisão B) e planta a semente do pilar Provar. | não (jsonb) | clicar de uma afirmação → entrada de origem |
| **006c — Página detalhada (5 macros)** | A página exclusiva do espelho com as 5 macro-categorias + tiers. UI maior; pode exigir dado por-skill mais rico. | talvez | render das 5 macros com evidência por skill |

**Caveats que a análise levantou (entram na spec da 006):**
- **Teto da extração:** a qualidade do espelho é limitada pela extração (003). Input de *valor
  enterrado* (lista de responsabilidade, sem métrica) pode exigir ajuste na extração pra
  preservar nuance — não só no prompt de síntese.
- **Experiência não-PM conta:** juniores vêm de RH, QA, suporte, antifraude, moderação, CS, e
  se chamam APM/PO. A engine precisa reconhecer experiência pré-PM/não-PM como evidência de
  produto (ponte negócio↔tech, instinto de qualidade/risco), não descartar por título.
- **Falta o exemplo-ouro #4 (júnior/sem métrica):** os 3 exemplos atuais são ricos em evidência.
  O caso mais difícil e mais comum (valor enterrado, sem número) ainda não tem ouro. Criar antes
  de codar a 006a — é o caso que mais testa o anti-clichê + o métrica-convite.
- **Reconciliar 3 estruturas de categoria:** mirror = 3-4 cards (revelação); página detalhada =
  5 macros (Decisão A); os exemplos usam 4 labels de PM. Decisão: cards no espelho-resumo, 5
  macros na página detalhada. Decidir se **Fluência técnica/IA** vira macro de 1ª classe (foi o
  🔑 em 2 dos 3 exemplos + é pilar de marca).

**Test harness da 006:** os exemplos-ouro viram fixtures; os 2 testes-régua ("sem o histórico" /
"qualquer PM") + os asserts determinísticos (travessão, buzzwords) são o guardrail barato que
deixa a 006a rodar quase no auto.

### Histórico (linha do tempo de carreira) — nova feature
- Vive sob a nav **"Mapa & Histórico"**. Lê `entries` (003) ordenado por data. **Versão simples
  primeiro** (lista cronológica), como combinado.
- **Hierarquia visual de referência** (print de uma receita numerada, jun/2026): nó na lateral +
  **linha conectora pontilhada** + título em destaque + meta curta em itálico + descrição com
  trechos em negrito. **Adaptação obrigatória:** como é carreira e não receita, os nós são
  **marcadores de TEMPO (ano/período), não números 1/2/3** — número decorativo em não-sequência é
  anti-padrão; aqui o eixo é o tempo.
- Cada item é uma experiência/entrada, agrupável por empresa/período; clicar expande. Na
  **008 (Provar)**, o item passa a mostrar as provas anexadas (álbum).
- Depende de **#9** pra não exibir duplicata (LinkedIn + CV).

### Issue #9 — dedup fuzzy (recomendação de abordagem)
A issue oferece dois caminhos. Recomendação de founder (KISS/YAGNI + custo + constituição):
- **Comece pela alternativa simples:** normalização de texto (lowercase, stopwords) + Jaccard/TF-IDF
  dentro de `saveEntries`. Cobre ~80% dos casos (LinkedIn vs CV) com **custo zero, sem migration,
  sem dep nova, sem provider de embedding**.
- **Adie o pgvector + embeddings** (migration `vector(1536)`, pgvector, provider de embedding,
  custo por chamada) até a abordagem simples provar que não basta. Evita complexidade e custo
  prematuros.
- **Por que entra agora:** entrada duplicada suja o espelho **e** o histórico. Dedup é base de
  qualidade pros dois, por isso vem cedo (perto da 006 / antes do histórico).
- **Onde:** `src/lib/db/entries.ts` (`saveEntries`), como a issue #9 aponta. Fechar a issue no PR.

### UX das telas — resumo (detalhe em `decisoes-ux-painel-espelho-historico.md`)
Decisões de layout travadas pra **007** (painel), **006c** (espelho detalhado) e o **histórico**:
- **Painel:** cartão do borogodó (especialidades + **skills destaque em pílulas** + padrão
  específico); **highlights resultado-primeiro** (sem gerúndio burocrático nem verbo genérico);
  **mini linha do tempo** na lateral direita (cargo · empresa · duração); **sem** label de status
  estático.
- **Espelho detalhado:** rótulos BR ("No que você manda bem" / "Seu borogodó" / "O fio da sua
  carreira"); evidência curta (~2 linhas); **5 categorias em ABAS com contador** (não cards lado a
  lado); **usuário pode ajustar a classificação** ("não me reconheço nisso") = controle + sinal de
  feedback; status vira convite no rodapé.
- **Histórico:** timeline com **nó = marcador de tempo** (ano/período, não 1/2/3), item
  expansível, espaço "Provas (em breve)" pra 008.
- **Transversal:** menos texto e menos scroll; tier = pílula com rótulo (nunca barra); abas viram
  **accordion** no mobile; mini-timeline colapsa pro fim.

## O pipeline mecânico (por feature)

Cada feature roda este ciclo. As etapas marcadas **[auto]** rodam quase sem você; **[gate]** param pra você.

```
/speckit-specify   →  o quê/por quê (puxa inputs de qualidade já travados)
/speckit-clarify   →  você responde (rápido, porque os inputs já foram decididos)
/speckit-plan      →  arquitetura, data model, contracts
/speckit-tasks     →  breakdown TDD
   [gate 1: você aprova a spec/tasks]
/impeccable shape  →  UX antes de codar (só features de UI)
   [gate 2: só na 006 — validar revelação com PMs reais]
/speckit-implement →  [auto] TDD: testes falham → implementa → passam
/code-review high  →  [auto] pass de qualidade
/impeccable audit  →  [auto] a11y/design (features de UI)
/pr-review         →  [auto] 6 subagentes (segurança, qualidade, arquitetura, perf, req, regressão)
/verify            →  [auto] runtime nos dois idiomas
   [gate 3: você roda migration no Supabase + aprova o merge]
merge → rebase da próxima feature
```

## O que paraleliza (subagentes / worktrees)

Use `Agent` com `isolation: worktree` (cópia isolada do repo, sem colisão) e/ou
`run_in_background` **só pra trabalho independente**:

- **Pesquisa** (Explore/general-purpose): mapear código existente, achar padrões — paralelo, barato.
- **Dentro de uma feature**: scaffolding de componentes irmãos, escrever fixtures de teste,
  rascunhar migration enquanto outro escreve tipos — desde que não toquem o mesmo arquivo.
- **NÃO paralelize features dependentes** (006→007→008→009): o segundo agente cold-starta sem o
  que o primeiro ainda não mergeou e produz lixo integrado.

> Custo: cada subagente parte do zero e re-deriva contexto (caro). Vale quando o trabalho é
> genuinamente independente e volumoso — não pra microtarefas.

## Como "deixar codando" de verdade

A forma honesta de auto, dado o acima:
1. **Sessão de front-load** (comigo + você): travar inputs de qualidade + specs das 006–009 em sequência.
2. **Execução encadeada**: rodar o pipeline mecânico por feature, em ordem, parando só nos 3 gates.
   - Opcional: `/loop` pode encadear etapas e me re-acordar a cada checkpoint.
3. **Você aparece nos gates** (aprovar spec, validar revelação, rodar migration + aprovar merge).

Resultado: o mecânico roda no escuro com TDD de guardrail; o gosto e o risco ficam com você.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Erro na 006 contamina 007–009 | gates entre features; nunca encadear sem merge verde |
| Auto escala o clichê | gate 2 (validação humana) antes da engine |
| Migration quebra em prod | gate 3: você roda à mão e confere |
| Spec ambígua → improviso | inputs de qualidade travados antes; clarify obrigatório |
| Subagente cold-start gera lixo | só paralelizar trabalho independente; revisão em todo PR |

## Próximo movimento
1. Gerar fixture #1 anonimizado (seus currículos) + draft de taxonomia via web research.
2. Validar a revelação à mão (gate 2 antecipado).
3. Abrir a spec da **006** com tudo travado e rodar o pipeline.

---

## Mapa dos documentos (pra não espalhar md nem se perder)
Todo o planejamento vive em lugares fixos. **Antes de criar um md novo, veja se cabe num destes.**

| Conteúdo | Onde mora | Papel |
|---|---|---|
| Estratégia/contexto do produto | `.specify/memory/product-context.md` | espinha (Descobrir/Entender/Provar/Usar), wedge, brasilidade — lido toda sessão |
| Mensagem de marca / LP | `docs/marca.md` | os 4 verbos pra marketing |
| Plano de batch (este doc) | `docs/mvp/batch-de-implementacao.md` | ordem das features, breakdown, gates |
| Inputs de qualidade | `docs/mvp/inputs-de-qualidade.md` | o combustível do auto |
| Taxonomia / níveis / critérios | `docs/mvp/draft-taxonomia-niveis-criterios.md` | decisões A–F |
| Prompt do espelho | `docs/mvp/draft-firstmirror-prompt.md` | input da 006a |
| Decisões de UX (painel/espelho/histórico) | `docs/mvp/decisoes-ux-painel-espelho-historico.md` | input de 007 / 006c / histórico |
| Exemplos-ouro | `docs/fixtures/exemplos-ouro.md` + `exemplo-ouro-4-junior.md` | régua e fixtures |
| Aprendizados | `docs/aprendizados.md` | o que vira conteúdo (build-with-claude / product-thinking) |
| Specs de feature | `specs/00X-*/` | geradas pelo speckit, não à mão |

**Regra:** não criar md novo se o conteúdo cabe num existente.

> **Princípio de trabalho** (ver `.claude/CLAUDE.md`): o Claude deve **contrapor com fundamento**,
> não concordar por padrão. Vale pra cada decisão deste plano.
