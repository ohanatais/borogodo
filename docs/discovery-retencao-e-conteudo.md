# Discovery: retenção, captura e evolução de conteúdo

**Versão:** 0.1 (discovery, pré-speckit)
**Data:** 15 de junho de 2026
**Autora:** Ohana (discovery com Claude Code)
**Status:** insumo de decisão — nada aqui é implementação. Cada feature ainda roda o
ciclo speckit completo (specify → clarify → plan → tasks → shape → implement → audit).

> Este documento consolida um discovery de retenção feito sobre o produto (Hooked +
> pesquisa de mercado + análise dos artefatos do repo) e duas propostas de design
> (feed de registros e expansão de conteúdo) produzidas por agentes de design ancorados
> no código real. Serve de matéria-prima para os próximos ciclos speckit.

---

## 1. Diagnóstico de retenção (a tensão central)

O Borogodó tem um paradoxo de retenção que precisa ficar explícito:

- O PRD diz que a retenção é "hábito de captura recorrente (semanal)".
- O reposicionamento (jun/2026) diz que o valor é **episódico** (entrevista, review,
  promoção) e que "frequência alta vem depois, se vier".

As duas coisas brigam: não se sustenta um hábito semanal de disciplina pura para um
payoff que só chega meses depois — essa é a armadilha da vitamina que o produto já
decidiu evitar. E o efeito colateral é fatal: se a alimentação de dados depende de
motivação, os dados estarão velhos exatamente no momento episódico em que importam (o
problema clássico do brag doc).

**Conclusão de produto:** o gargalo de retenção está no **input** (alimentar dados), não
no output. A cadeia 013→014→015 sofistica o lado "Usar" (gerar conteúdo). Mas se a
alimentação seca, o motor gera em cima de dado velho e o output fica genérico — a mesma
crítica que o produto faz ao Taplio. A próxima aposta de retenção tem maior ROI no input.

**O loop Hooked aplicado, com o elo fraco marcado:**

- Gatilho → momento de carreira / calendário
- Ação → capturar 1 vitória, quase invisível
- Recompensa → **elo fraco: episódica, atrasada**
- Investimento → cada captura melhora espelho e voz

A correção é dupla: **encurtar a recompensa** para ser imediata (um aha por captura; ver
a pilha crescer) e **prender o gatilho à rotina que já existe** (não criar um ritual novo).

---

## 2. Backlog sequenciado pós-015

Numeração **provisória** — confirmar o próximo número livre no kickoff de cada elo
(convenção do `conteudo-plano-de-acao.md`). 013 mergeada; 014 em implementação; 015
planejada.

| # provisório | Feature | Por que nessa posição |
|---|---|---|
| **016** | **Captura v2 — sem atrito** | O gargalo real. Sem dado fresco, todo o resto degrada. |
| **017** | **Feed de registros** | Fecha o loop "ver a pilha crescer" (recompensa do investimento). |
| **018** | **Seeds expandidos de post** | Amplia o output (opinião/externo/estudo). Depende de dado fresco pra valer. |
| **019** | **Autoavaliação de desempenho** | 2º payoff episódico, ancorado em calendário. Reusa o motor de síntese. |

Mais a **adição à 015** (seção 7): qualidade de formato do post — não compete, é barra de
qualidade contínua e pertence à 015.

---

## 3. Captura v2 — sem atrito (016)

**Princípio:** o diferenciador não é áudio vs. texto. É **trazer o material que a pessoa
já produz em outro lugar** em vez de pedir um diário. Régua de canais, do mais barato/
universal ao mais caro:

1. **Colar/importar artefato** (MVP, universal, zero infra): um campo "cole aqui uma
   transcrição de reunião, um e-mail, uma conversa" → o pipeline de extração que já existe
   (`claude-haiku-4-5` + schema) quebra em entradas. Atende quem odeia áudio e odeia
   escrever do zero (Ana, Rafael).
2. **Áudio in-app** (perfil oral, Bruno/Clara): botão de microfone usando a **Web Speech
   API do navegador** — transcrição grátis, sem backend. Ressalva honesta de UX: fraca no
   iPhone/Safari, então lá o texto continua sendo o caminho principal e o áudio é um plus
   onde funciona bem (Android/Chrome/desktop). _Decisão tomada: começar pela Web Speech
   gratuita; migrar pra transcrição no servidor só se a qualidade incomodar._
3. **E-mail / MCP** (automatizado, ondas seguintes): encaminhar e-mail destacado, puxar de
   ferramentas. Maior valor, maior risco (governança/LGPD, deliverability). Não é MVP.

**Enriquecimento assíncrono** (peça de consistência de dados, barata): quando uma entrada
chega magra, a IA devolve **uma** pergunta cirúrgica depois ("teve algum número ou prazo
nisso?"). Reusa `ReflectionCard` + `proactive_insights`. Mantém a captura de 1 toque e
empurra a completude pra um segundo momento de baixo custo.

**Nudge sem push — definição fechada** (decisão tomada: in-app por ora, sem PWA/push/email):

O que faz o Readwise não virar lixo de inbox não é o email — é o conteúdo ser **da própria
pessoa** e ser **completo em si** (você consome ali, sem precisar clicar). Isso é replicável
sem email nenhum. Definição do que entra no 016:

> **Ressurgimento in-app, movido por delta.** Ao abrir o app, a primeira coisa que a pessoa
> vê é uma de duas:
> - **tem novidade** → "essa semana você fechou X" + um aha ("reforça sua força em Y") ou um
>   rascunho já pronto;
> - **não tem novidade** → ressurge uma vitória antiga ("há 1 ano você entregou Z") + um
>   convite leve a registrar algo novo.

- Movido por **delta**, não por relógio: só diz "tem novidade" quando há dado novo de verdade
  (mesma lógica do espelho, que regenera a cada 5 entradas). Sem delta → vira gatilho de
  captura. Nunca finge análise vazia.
- Gatilho ancorado em rotina (fim de semana, véspera de 1:1, ciclo de avaliação), não no
  tempo-desde-a-última-entrada.
- **Zero infra, zero risco de spam** — valida a mecânica de graça antes de gastar com email.
  Se engaja in-app, o email se justifica; se não, nunca ia funcionar no inbox mesmo.

**Email inteligente — só depois, e só se o in-app provar valor.** Quatro regras anti-lixo:
1. Disparado por **evento/delta**, nunca por relógio fixo ("toda sexta" vira lixo).
2. **Carrega o valor**, não o lembrete — o email é a coisa útil (um rascunho pronto, um "seu
   mês em 3 conquistas", o pacote pro review) e se consome no próprio inbox.
3. A **frequência se ganha** — começa mensal/episódico, default baixo, a pessoa sobe se quiser.
4. **Um trabalho por email.**

**Newsletter — fora do escopo do produto.** Plataforma de envio/gestão de assinantes é outro
produto (Substack/beehiiv) e fora do wedge. "Newsletter como formato gerado" também saiu do
roadmap (a Ohana esclareceu que o interesse em motor de newsletter é projeto pessoal dela,
não do Borogodó). A newsletter da marca, se existir, é canal de marketing/aquisição — trilha
separada da retenção, não confundir com o nudge.

**Provavelmente sem migration nova** — reusa `entries`, extração, `ReflectionCard`,
`proactive_insights`.

---

## 4. Feed de registros (017)

> Proposta de design ancorada no repo. O `/historico` esconde o dado cru de propósito
> (sintetiza, agrupa, deduplica); falta o feed cru de tudo que foi registrado.

**Jornada / retenção:** é a única superfície onde o investimento (captura) vira
**patrimônio visível e contável** — o equivalente ao histórico de chats do Claude. Ana
prepara um review filtrando o trimestre; Bruno acha os números que esqueceu; Clara vê a
pilha crescer contra o "meu trabalho é invisível"; Rafael ganha a granularidade que o
`/historico` apaga.

**Decisões de design:**
- **Rota nova `/registros`**, sem 5º item de nav (a barra já tem 4). Acesso via "Ver tudo
  →" do painel e link no `/historico`. Modelo mental: histórico de chats.
- **Dois eixos via toggle** (estado na URL, linkável): "quando anotei" (`created_at`, feed
  de atividade) e "quando aconteceu" (`entry_date`, timeline de carreira expandida e
  granular).
- **Card colapsado** (botão `aria-expanded`): título auto + metadados (source, data,
  empresa/cargo) + badge de métrica + tags + thumbnail se houver imagem. **Expandido:**
  campos estruturados existentes, preview maior da imagem, `UsarButton` (fecha o loop
  North Star direto do feed).
- **Título curto:** gerar **no momento da extração** (a IA já roda ali — sem chamada
  extra), persistido em coluna nova `title`. Fallback determinístico (primeiros ~60 chars
  de `what_i_did`) pra nenhum card ficar sem título (princípio "nunca página em branco").
- **Painel:** trocar `TrajectoryHighlights` por seção "Seus registros" (5 mais recentes) +
  "Ver tudo →". Manter `MiniTimeline` (propósito diferente). **Não deletar a curadoria** —
  rebaixar o destaque-por-métrica pra um filtro "com métrica" dentro do feed.
- **`/historico` complementa, não é substituído** — cross-link entre os dois.
- **Busca:** MVP textual (`ilike` + tags); evolução semântica **reusando o `embedding
  vector(1536)` + índice HNSW que já existem** em `entries` (hoje só usados pra dedup).
  Conecta com a promessa "busca em linguagem natural" do v1. Requer gerar embedding pra
  TODA entrada (hoje só as com empresa).
- **Filtros:** período (presets + range), empresa, tags, com-métrica, tipo de origem.
- **Imagens/anexos:** reusa `evidences` JSONB + bucket `evidence-files` (hoje só imagem).
  Anexo genérico (pdf/docx) = evolução (novo bucket + `type:'file'`).

**Backend:** coluna `title` + adicionar ao schema de extração (migration pequena); índice
`entries(user_id, entry_date DESC NULLS LAST)`; módulo `src/lib/feed/getFeedData.ts`
(espelha `getHistoricoData.ts`) + `GET /api/entries` com paginação por cursor.

**Débito a consolidar:** hoje há 3 representações divergentes de "entrada" (`EntryItem`,
`TrajectoryHighlights`, `RecentEntries` — esta nem montada no painel). Vale um
`<EntryCard variant>` único.

**Segurança:** pedir `/security-review` — toca extração, nova coluna e busca semântica
(IA com input do usuário).

---

## 5. Seeds expandidos de post (018)

> Posts não são só "o que eu fiz". São também opinião, conteúdo estudado, reação a algo
> externo. O motor já é mais maduro que os docs sugerem.

**Princípio que protege o moat:** o input externo (tese, link) entra como
**ângulo/intenção**; a **prova continua vindo da evidência real do banco da pessoa**. O
texto só afirma fato sobre o trabalho dela a partir das entradas. Isso transforma "opinião
vazia" (padrão do mercado, segundo a Edelman) em "opinião com lastro" — que é o que engaja.

**Três novos seeds, em ordem de risco:**

| Tipo | `seed_type` | Input externo na geração? | Risco ao moat | Custo |
|---|---|---|---|---|
| Algo estudado | reusa `entry` + `qa.angle_kind` | Não | Baixo — comece aqui | sem migration |
| Opinião/tese | `opinion` (novo) | Sim (tese, 1 linha em `qa.thesis`) | Médio | só estende o CHECK |
| Reação a externo | `external` (novo) | Sim (link/trecho em `qa.external_ref`) | Alto (alucinação + fetch) | só estende o CHECK |

- O campo `qa jsonb` da tabela `drafts` **já existe** e absorve `thesis`/`external_ref`/
  `angle_kind` sem migration. A única migration é estender o CHECK de `seed_type`.
- `external` é P3 e **prefere texto colado a buscar a URL** (evita alucinação sobre o link).
- Fechar de quebra a lacuna da 013: `loadSeedEvidence` hoje retorna `null` para `project`.
- **Não relaxar nenhum dos 9 asserts anti-IA** por causa do formato de opinião. Pelo
  contrário, adicionar termos de opinião-vazia ("hot take", "impopular mas", "ninguém fala
  sobre isso") às listas de `bannedTerms.ts`.

**Risco a vigiar:** scope creep e opinião sem lastro. Mitigação: guardrail de
`evidence_refs` não-vazio em pelo menos uma variante de opinião.

---

## 6. Autoavaliação de desempenho (019)

Segundo payoff episódico, ancorado em calendário (recorrente, alta ansiedade = gatilho
forte). É primo do `impact_summary` que a 013 já entrega — **um motor, vários destinos**,
não um motor novo. Força a alimentação a ficar fresca (não se enche autoavaliação na
véspera; colhe-se o ano). Detalhar em ciclo próprio.

---

## 7. Adição à 015 — qualidade de formato do post (DECIDIDO: entra na 015 agora)

Baseado em pesquisa consolidada (jun/2026) — fontes no fim. As regras entram em **três
camadas** para serem auditáveis, não só sugestão:

1. **Prompt** (`POST_SYSTEM_PROMPT`): gancho nas 2 primeiras linhas (~210 chars antes do
   "ver mais") como manchete (pergunta / estatística da própria evidência / afirmação
   forte); parágrafos de 1-2 linhas com espaço em branco; fechamento que convida reflexão
   (mira comentário — vale ~2x like — e dwell-time) **sem engagement bait**. Refinar a
   linha atual "sem call-to-action de engajamento" para distinguir **bait proibido**
   (comente/marque/bora) de **convite legítimo**. Preservar `ANTI_AI_DISCIPLINE` e
   `OUTPUT_CONTRACT` como prefixo estável (prompt caching).
2. **Ruleset determinístico** (`validateRuleset.ts`, novos asserts 10+): gancho dentro do
   teto de caracteres e não-saudação genérica; sem muro de texto (linhas curtas); sem
   engagement bait (reforça o assert 6). Entram no mesmo fluxo de regeneração única →
   qualidade de formato vira self-healing.
3. **Golden set no CI** (já é o coração da 015): fixtures de post asseveram gancho, linhas
   curtas, zero bait. Regressão de formato **falha o CI**.

**Pesquisa que sustenta (achados-chave):**
- Edelman + LinkedIn (≈3.500 executivos): thought leadership só engaja quando ancorado em
  **fato verificável + prova**; só 15% acham o conteúdo que leem "muito bom" → evidência é
  o moat.
- Algoritmo 2025/26: "golden hour" (1ª hora decide alcance); **dwell time é fator nº1**
  (61+s ≈ 15,6% engajamento vs. 1,2% em 0-3s); **comentário vale ~2x like**; consistência
  num nicho faz o algoritmo marcar como especialista; engagement bait é penalizado.
- Formato: 2 primeiras linhas decisivas; parágrafos curtos + espaço; gancho + lista é a
  estrutura mais compartilhada.
- Pilares que performam: opinião/thought leadership (desafiar senso comum: +30-50%),
  história pessoal/lição (1,8-2x), curadoria/reação a externo, valor/framework, conquistas,
  bastidores.

### Rascunho pronto pra colar na spec da 015 (US + FRs)

> Continuar a numeração da 015 (US1-US3 já existem → estas são US4-US6; FRs continuam de
> FR-012). **Nota de escopo:** se o ciclo ficar grande, extrair US4/US5 (opinião/externo)
> para o elo 018-seeds-expandidos; **US6 (qualidade de formato) fica na 015**.

**US6 — Qualidade de post comprovada pela pesquisa, auditável (P1):** todo post gerado
segue gancho nas 2 primeiras linhas, parágrafos curtos com espaço, e fechamento que
convida reflexão sem bait; regras verificadas por asserts determinísticos e cobertas pelo
golden set no CI.
- _Independent test:_ gerar post → confirmar gancho dentro do teto, parágrafos curtos,
  fechamento sem "comente abaixo/marque/bora"; PR que degrade o gancho → golden set falha.

**FR-019**: `POST_SYSTEM_PROMPT` MUST instruir a estrutura comprovada, preservando
`ANTI_AI_DISCIPLINE` e `OUTPUT_CONTRACT` como prefixo estável.
**FR-020**: `validateRuleset` MUST ganhar asserts de formato determinísticos (gancho no
teto, linhas curtas, sem bait), no fluxo de regeneração única.
**FR-021**: o golden set MUST cobrir as regras de formato como gate de CI.
**FR-022**: a distinção bait (proibido) vs. convite à reflexão (permitido) MUST ser
explícita no prompt e no ruleset, sem reintroduzir jargão de LinkedIn (assert 6).

_(O rascunho completo de US4/US5 e FR-013..018/023-024 para os seeds expandidos está no
histórico do discovery e vai para a spec da 018.)_

---

## 8. Decisões já tomadas

- Áudio: começar com Web Speech API (grátis), migrar pra servidor só se preciso.
- Nudge: in-app por ora (sem PWA/push), modelo "valor, não lembrete", movido por delta.
- Sequência pós-015: 016 captura v2 → 017 feed → 018 seeds → 019 autoavaliação.
- Qualidade de formato do post: entra na 015 agora (US6 acima).

## 9. Riscos e princípios a não violar

- **Não virar coach genérico.** Um eventual "consultor de carreira" (próximos passos, CV,
  entrevista) só é on-strategy se ancorado em evidência real — conectar diagnóstico do
  espelho a destinos de uso, nunca conselho vago. É expansão tardia, não agora.
- **Não relaxar a disciplina anti-IA** para acomodar opinião ou formato.
- **Nunca página em branco** em nenhum ponto de entrada novo.
- **Rodar uma sessão por branch ao implementar** — duas sessões escrevendo na mesma árvore
  colidem (causou ruído no workflow durante este discovery).

---

## 10. Mecânicas de engajamento (UI) — exploradas no discovery

Duas mecânicas escolhidas (simples, não-genéricas, fiéis à marca). Princípio que guia as
duas: **brasilidade é substância, não enfeite** — mora na paleta (jambo/coral/mel/creme),
na Fraunces e no calor da copy; nunca em clichê (samba/futebol/jeitinho/emoji/diminutivo).

### #2 — Medidor de força (dirige a captura)
Não é uma barra de "% completo" genérica. Roda sobre o vocabulário que o espelho já tem:
os tiers **Emergente → Consistente → Comprovada**. Cada força mostra em que tier está e o
que falta pra subir ("mais 2 evidências e sua força em X vira Consistente"). Dirige a
captura pra um gap específico, pelo desejo de "revelar" mais — não pela culpa. Vive no
**espelho/painel**.

### #3 — Consistência visual (a vencedora: grade estilo GitHub com faíscas)
Exploradas duas formas; a escolhida foi a **grade de atividade estilo GitHub** (dias ×
semanas, fundo de células bem claras) com **faíscas preenchendo** os dias que tiveram
registro e célula vazia quando não houve. A constelação "solta" (faíscas livres sobre um
fundo) ficou como conceito-irmão, mas a grade venceu por:
- **credibilidade emprestada**: o formato já é lido como "ferramenta séria de quem produz"
  (Rafael/Bruno reconhecem), e a faísca entra como preenchimento, herdando a sobriedade.
- **vazio é espaço, não falha**: épocas quietas são células claras, sem vermelho de
  vergonha (anti-Duolingo de verdade).
- **leitura macro instantânea**: o ano "ganha densidade" da esquerda pra direita; a
  temperatura (lilás suave → jambo → coral nos recentes) diz "o que importa agora está
  aceso", sem legenda.
- **escala melhor**: funciona com poucos dados (grade mais vazia, sem ficar triste) e com
  muitos (ano denso). A faísca é **clicável** → ponte direta pro feed (filtra o período).

Vive no **feed de registros (017)**: a grade no topo (mapa) + o feed cronológico embaixo
(território), uma alimentando a outra — registrar acende uma faísca e põe um card no topo.

### Os dois abismos a evitar (norte de craft)
O Borogodó tem **dois** riscos opostos, ambos proibidos pela marca:
- **fofo/infantil** (Duolingo): mascote, confete, neon, pontos/troféus, copy "Parabéns!!!".
- **genérico** (SaaS cinza de 2022): sem paleta, sem serifa, vira ferramenta gringa
  traduzida — mata a identidade que é a defesa contra "parecer IA".

**Norte:** sofisticado **com** calor brasileiro — sóbrio na moldura, borogodó nos detalhes
(grade contida + faísca/paleta/Fraunces nos toques certos; um único acento quente, o coral,
com parcimônia). Validar com personas reais no `/impeccable shape`, não cravar do nosso gosto.

### Decisões de craft para o shape (017)
- **Granularidade dia vs. semana**: dia-a-dia é lindo cheio, mas pode parecer ralo pra quem
  captura 1x/semana. Talvez a célula seja a semana. Testar com a frequência real do público.
- **Amadurece com massa crítica**: a mecânica visual aparece quando há registros suficientes
  (com 2-3 faíscas é um céu vazio e triste). No começo, o feed cru e o medidor de força (#2)
  carregam o peso; a grade entra como recompensa de quem já alimentou.
- Mockups de referência (3 registros: quente, sóbrio, híbrido-grade) ficaram no histórico do
  discovery; o híbrido-grade é a direção aprovada.

---

## Fontes (pesquisa de LinkedIn, jun/2026)

- Hootsuite — How the LinkedIn algorithm works in 2025
- meet-lea — LinkedIn Algorithm Explained: Dwell Time, Comments
- Postline — 8 LinkedIn Posts Best Practices 2025
- magicpost — LinkedIn Post Formatting: What the Data Says
- Vulse — Best LinkedIn Post Types for 2025
- Edelman / LinkedIn — B2B Thought Leadership Impact Report (2024)
