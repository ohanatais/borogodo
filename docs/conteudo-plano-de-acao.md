# Plano de ação: bloco de Geração de Conteúdo (Presença)

**Versão:** 0.1 (epic plan, pré-speckit)
**Data:** 15 de junho de 2026
**Autora:** Ohana (planejamento com Claude Code)

## Contexto

O Borogodó vai entregar o segundo core do produto: o verbo **Usar** da espinha (Descobrir, Entender, Provar, **Usar**). A pesquisa e o produto já apontaram a direção: post de LinkedIn primeiro, ancorado na evidência das entradas e do espelho, na voz da pessoa, e um segundo formato (resumo de impacto) que serve o wedge episódico (review, entrevista, promoção). Decisões de produto já travadas:

- **Primeiro recorte = post de LinkedIn + resumo de impacto juntos**, no mesmo motor.
- **Calibração de voz híbrida**: inferir uma base do `raw_content` das capturas, refinar com 1 a 2 amostras explícitas.

Embasamento de pesquisa (jun/2026): só 12% dos brasileiros publicam semanalmente no LinkedIn e 32% nunca publicaram (Opinion Box 2025); a dificuldade nº1 é falar das próprias conquistas, e o caminho aceito é focar em processo, aprendizado e em quem participou, que é a tese de marca do Borogodó. A crítica nº1 aos concorrentes (Taplio) é soar genérico por partir de template; o diferencial é partir do trabalho real estruturado. Texto puro perde alcance, mas o wedge do produto é payoff episódico, não viralização.

A pergunta que este documento responde **não é "o que construir"** (já pesquisado e decidido), e sim **"como planejar e construir esse bloco com robustez técnica e de UX, sem que o speckit achate a jornada"**. A resposta é uma arquitetura de planejamento em camadas, com a fundação compartilhada travada antes do primeiro speckit e uma cadeia de features, cada uma com seu ciclo speckit + impeccable.

> Este arquivo é o **plano do bloco (epic)**. Ele não substitui os ciclos speckit por feature; ele os coordena. Cada feature da cadeia roda specify, clarify, plan, tasks, shape, implement, audit normalmente.

---

## Por que speckit sozinho não segura a jornada

Aterrado nos artefatos reais do repo:

- **Um ciclo speckit cabe cerca de 3 a 5 user stories e 30 a 50 tasks** (005-panel-dashboard tem 37 tasks em 6 fases; 006-espelho-honesto é o teto de complexidade, com checklists e contracts). O bloco de conteúdo tem motor de voz, dois formatos, hub, pontos de entrada, nudge proativo, persistência e harness de qualidade. Isso é claramente mais de uma feature.
- `shape.md` é **por feature** (`/impeccable shape` grava em `specs/[feature]/shape.md`). `/impeccable audit` não cria arquivo, vira tasks (foi assim que nasceu 010-produto-polish).
- O **Constitution Check** dentro do `/speckit-plan` é o que garante consistência técnica **por feature** (TS strict, server-first, IA validada por Zod, RLS, a11y, TDD). Ele não enxerga o bloco inteiro.

Conclusão: speckit, impeccable e constitution dão rigor **dentro** de cada feature. A costura **entre** features (modelo de dados compartilhado, motor de voz reusado, princípio de UX, espinha de design, sequenciamento) é responsabilidade deste epic plan.

---

## A arquitetura de planejamento em 4 camadas

1. **Epic plan (este arquivo)** trava a fundação compartilhada e a ordem da cadeia. Decisão de bloco, não de feature.
2. **Speckit por elo da cadeia** (specify, clarify, plan, tasks): cada feature é um ciclo. O Constitution Check de cada `/speckit-plan` é o gate técnico.
3. **Impeccable por elo com UI** (`/impeccable shape` antes de codar, `/impeccable audit` antes do PR), ancorado no `.impeccable/design.json` compartilhado, garante consistência de UI/UX entre os elos.
4. **Code review por fase** (`/code-review low` no fim de cada fase, `/code-review high` antes do PR), conforme convenção já adotada.

A consistência **técnica** vem de: fundação travada aqui, mais Constitution Check por feature, mais golden set de qualidade compartilhado. A consistência de **UI/UX** vem de: espinha de design travada aqui, mais `/impeccable shape` por feature, mais `.impeccable/design.json` compartilhado.

---

## Fundação compartilhada (travar ANTES do primeiro speckit)

Isto não é uma feature; é a tubulação que todos os elos reusam. Deve ser decidido e documentado antes do primeiro elo, e implementado na fase 1 (Foundational) dele.

### Modelo de dados (net-new)
- **`drafts`** (tabela própria, não JSONB): lifecycle de rascunho exige tabela. Campos: `id`, `user_id`, `format` ('post' ou 'impact_summary'), `seed_type` ('entry', 'theme' ou 'project'), `seed_ref` (id da entrada/tema), `angle` (texto), `body` (texto), `status` ('generated', 'edited', 'copied' ou 'discarded'), `voice_feedback` ('soa', 'nao_soa' ou null), `qa` (jsonb, o ângulo/perguntas que guiaram), timestamps. RLS por `user_id`, igual a `entries` e `mirror_snapshots`.
- **`voice_profile`** (jsonb em `profiles`, não tabela nova): perfil único por usuário, comporta-se como blob de settings. Campos sugeridos: `tone`, `length_pref`, `samples` (1 a 2 textos colados), `inferred_summary` (síntese da voz a partir do raw_content das capturas), `updated_at`.
- **Números de migration são provisórios**: a última hoje é a 008, mas a feature 012-chat (em andamento) pode adicionar migrations antes. Conferir o próximo número livre na hora.
- **Reuso**: `entries` (seed e evidência), `mirror_snapshots.JSONB` (strength_themes, categories, que são seeds de tema), `entry_embeddings` (achar evidência relacionada a um tema), `entry_evidences` (prova externa para o ângulo Provar), `proactive_insights` (infra do nudge "isso daria um post").

### Módulo de IA (seguir o padrão de `mirror/`)
Criar `src/lib/ai/content/`:
- `schemas.ts` — Zod do output de cada formato (post, resumo de impacto). Output validado antes de persistir, igual ao mirror.
- `generateDraft.ts` — orquestrador (synthesis/sonnet): seed mais voice_profile mais evidência geram 2 rascunhos, valida com Zod.
- `buildVoiceProfile.ts` — infere a voz do `raw_content` das capturas e funde com amostras explícitas.
- `prompts/post.ts`, `prompts/impactSummary.ts` — herdam **integralmente a disciplina anti-IA do `MIRROR_SYSTEM_PROMPT`** (sem travessão, sem antítese "não é X é Y", sem advérbio de ênfase vazio, sem jargão de LinkedIn, brasilidade como substância). O `firstMirror.ts` é o template de referência.
- `__tests__/` — validação de schema e regressão de voz contra o golden set.
- Usar `src/lib/ai/client.ts` direto; sem novo provider.

### Princípio de UX do bloco (auditável no `/impeccable shape`)
**Nunca uma página em branco.** Todo ponto de entrada de geração carrega evidência (uma entrada, um tema, um projeto). Nenhum elo da cadeia pode introduzir um prompt vazio estilo Taplio. Este é o critério que diferencia o produto e deve ser checado no shape de cada feature com UI.

### Espinha de design (travar para os elos não divergirem)
- Nova aba/rota **Presença** (`/presenca`) e item de nav no `AppShellClient.tsx` (`NAV_ITEMS` hoje tem painel, espelho, historico). Ícone e label a confirmar ("Presença" é o termo de marca; alternativas: "Contar", "Mostrar").
- Componentes compartilhados pelos elos: o card de rascunho, a tela de geração (escolha de ângulo, 2 rascunhos, chips de ajuste, "soa como você?"), o botão "Usar" reaproveitável. Definir esses no shape do primeiro elo para os seguintes reusarem.
- **Coordenar com a 012-chat**: a barra de captura já tem o toggle registrar/perguntar no AppShell. O chat (012) e a Presença (este bloco) são irmãos da próxima onda e dividem superfície de app; conferir a nav e a barra na hora de implementar para não brigarem.

### Harness de qualidade (compartilhado, existencial)
Golden set de 10 a 15 casos reais (como o `plano-de-acao.md` já previu e os testes do espelho fazem): dado um seed mais voice_profile, o output passa nas regras anti-IA e cita evidência real. Trava regressão de voz quando qualquer prompt do bloco mudar. Vive em `src/lib/ai/content/__tests__/` mais fixtures.

---

## A cadeia de features

Numeração provisória: 011 já mergeou (PR #20) e 012 está ocupada pela feature de chat ("Perguntar"). O bloco de conteúdo começa em **013**. Cada elo é um ciclo speckit completo mais impeccable quando tem UI.

| Elo | Feature | Escopo | O que valida | Artefatos |
|---|---|---|---|---|
| 013 | **Motor de voz + geração** | Fundação (data model e `lib/ai/content/`), calibração de voz híbrida, geração de **post** e **resumo de impacto** a partir de um seed (entrada ou tema do espelho), 2 rascunhos, edição, chips de ajuste, copiar. Pontos de entrada **mínimos** (botão "Usar" numa entrada e num tema do espelho). | O aha do conteúdo e o risco nº2 do PRD ("publicar com orgulho"). Cumpre a promessa da LP. | spec, plan (mais data-model, contracts), tasks, **shape**, audit. Golden set entra aqui. |
| 014 | **Presença (hub e costura)** | Rota `/presenca` mais item de nav, lista de rascunhos persistidos, botão "Usar" no **projeto** da Linha do Tempo, **nudge proativo** "isso daria um post" (reusa `proactive_insights`). | Conexão com o ecossistema: deixa de ser silo; mecânica de retorno episódico. | spec, plan, tasks, **shape**, audit. |
| 015 | **Refino de voz e qualidade contínua** | Loop "soa como você?" afinando o `voice_profile` ao longo do tempo, evals do golden set como guardrail no CI, mini-bio como terceiro formato (mesmo motor). | A barra de qualidade ao longo do tempo; amplia formato sem nova superfície. | spec, plan, tasks, audit (UI leve). |

**Dependências**: 013 trava a fundação e precisa vir primeiro. 014 depende do `drafts` e do motor de 013. 015 depende do loop de feedback de 013/014. Mini-bio fica em 015 (não em 013) para manter a primeira entrega focada na barra de qualidade dos dois formatos âncora.

### Detalhe do elo 013 (o primeiro a virar spec)
Estrutura provável de user stories no `/speckit-specify` (3 a 4 stories, dentro do teto de um ciclo):
- **US1 (P1)**: calibrar voz (híbrido: infere do raw_content e cola 1-2 amostras) e gerar 2 rascunhos de **post** a partir de um tema do espelho, com evidência citada.
- **US2 (P1)**: gerar **resumo de impacto** a partir de uma entrada (mesmo motor, schema e prompt próprios).
- **US3 (P2)**: editar no lugar, chips de ajuste ("mais curto", "menos formal", "tira o jargão"), copiar.
- **US4 (P2)**: persistir o rascunho (`drafts`) e o feedback "soa como você?".

Fases típicas do `tasks.md` (espelhando 005/006): Setup, Foundational (migrations mais `lib/ai/content/` skeleton mais golden set), US1, US2, US3, US4, Polish (a11y, anti-IA audit). Cerca de 35 a 45 tasks.

---

## Como a consistência é garantida (mapa para as ferramentas)

- **Técnica, por feature**: Constitution Check no `/speckit-plan` de cada elo.
- **Técnica, entre features**: este epic plan (data model, módulo de IA e golden set travados antes da 013); todos os elos reusam `lib/ai/content/` e `drafts`.
- **Voz/qualidade, entre features**: golden set compartilhado roda em todo elo que toca prompt; herança literal da disciplina do `MIRROR_SYSTEM_PROMPT`.
- **UI/UX, por feature**: `/impeccable shape` antes de codar, `/impeccable audit` mais `web-design-guidelines` antes do PR.
- **UI/UX, entre features**: `.impeccable/design.json` compartilhado mais os componentes de Presença definidos no shape da 013 e reusados por 014/015.
- **Custo de review**: `/code-review low` por fase, `/code-review high` antes do PR. `/security-review` na 013 (toca dado do usuário, novas tabelas e chamada de IA).

---

## Verificação por elo (end-to-end)

- **013**: com a conta QA de teste, calibrar voz, gerar post e resumo de impacto a partir de um tema/entrada reais, confirmar que cada afirmação cita evidência, editar, copiar. Rodar o golden set (`vitest`) e confirmar que nenhum caso quebra as regras anti-IA. Validação manual: "você publicaria isso com orgulho?".
- **014**: navegar `/presenca`, ver rascunhos persistidos, disparar "Usar" de uma entrada/tema/projeto, confirmar que o nudge proativo aparece quando uma entrada forte é capturada.
- **015**: dar feedback "soa/não soa" e confirmar que o `voice_profile` evolui; CI bloqueia regressão do golden set; gerar mini-bio.

---

## Decisões em aberto (resolver no kickoff do bloco, antes da 013)

1. **Label da nav**: "Presença" (termo de marca) vs "Contar" vs "Mostrar". Recomendação: "Presença".
2. **`voice_profile` como JSONB em `profiles`** (recomendado, leve) vs tabela própria. Recomendação: JSONB.
3. **Re-validar a fundação** quando a 012-chat mergear: próximo número de migration livre, mudanças em nav (`AppShellClient`) e em `profiles`. O bloco assume o estado do main de 15/jun/2026 (última migration 008, nav com 3 itens, sem `drafts` nem `voice_profile`).
