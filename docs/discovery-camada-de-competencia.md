# Discovery — A camada durável de competência (inteligência de carreira)

> **Propósito:** documento de discovery + diagnóstico + pesquisa que alimenta a decisão de
> reformular a estrutura de **voz e registro** do Borogodó para que ela entregue de verdade
> "inteligência de carreira" — e não só um espelho bonito que esquece.
>
> **Status:** discovery + frame fechados (via `/product-north`). **Pesquisa de mercado
> concluída** (seção 8 — 5 frentes, fontes citadas). Ainda **não** é um decision record —
> vira `docs/decisions/NNN-*.md` depois que a Ohana escolher o caminho.
>
> **Autoria:** sessão `/product-north` — Ohana (PM) + Claude (par estratégico). Julho/2026.

---

## 0. TL;DR (o que este documento diz)

As três dúvidas que a Ohana trouxe — (1) evidência fraca/inflada, (2) falta de
gráfico/evolução, (3) falta de agrupamento por área/frente — **são o mesmo buraco visto de
três ângulos**: o espelho é uma redação linda que **não acumula**. Não existe, embaixo dele,
uma camada durável de competência que fortaleça a evidência de forma honesta ao longo do
tempo.

**Reframe central:** a estrutura de hoje captura bem o **passado**, mas não tem espinha para
o **futuro que a pessoa está mirando**. Inteligência de carreira é inerentemente
**direcional** (evidência a serviço do próximo movimento), e o produto hoje é
**retrospectivo**.

**Recomendação (a validar com a pesquisa):** construir uma **camada de competência durável**
(um "ledger" que acumula evidência por competência ao longo de toda a história, com tier
ancorado em regra e histórico para evolução real), com **frentes** entrando como uma *lente
opcional por cima* — de forma que **descoberta serendipítica e direção coexistam** em vez de
uma comer a outra.

**Decisões já tomadas pela Ohana nesta sessão:**
- O problema-raiz a atacar é **a camada durável que falta** (não um dos sintomas isolados).
- O design precisa fazer **descoberta e direção coexistirem** — não escolher um lado.

---

## 1. As dúvidas e conflitos da Ohana (o input original)

Contexto: a Ohana está posicionando o Borogodó como **inteligência de carreira do white-collar
brasileiro** e reformulando toda a estrutura de voz e registro "pra ficar poderosa". A pergunta
de fundo: *a estrutura realmente traz tudo que importa para inteligência de carreira?*

### Tensão 1 — Dados/métricas + força da evidência (fraca)
> "Dados/métricas visíveis e claras, associadas às evidências. Temos algumas coisas, mas ficam
> misturadas no meio do espelho e não têm uma força grande às evidências — ou seja, se tem 1 ou
> 2 registros, já chega como consistente ou até comprovado. Fraco."

### Tensão 2 — Falta de "gráficos" / evolução
> "Não tem 'gráficos'. Não quero métricas vazias nem vaidade, mas acho relevante ter algo que
> dê pra ir evoluindo — dados concretos como inteligência de carreira. Nada caro demais, mas
> nada bobo demais."

### Tensão 3 — Agrupamento por área/tema/frente
> "Estou mirando posição sênior na CKL e, para isso, atuo em frentes específicas: **Product
> Analytics, Comunicação, referência em IA e Mentoria**. Criei um PDI no Qulture (ferramenta
> que a empresa usa) e vou registrar evidências lá. Não acho que o Borogodó precise estar
> super robusto agora, mas sinto que, se eu quisesse ver todas as minhas evidências por um
> grupo de área/tema como esse, não conseguiria."

**O exemplo do PDI é o diagnóstico inteiro** (ver seção 3): ela não pediu um filtro — pediu
que a evidência fosse organizada em torno de **onde ela está indo**.

---

## 2. Como o sistema funciona hoje (diagnóstico técnico)

> Fonte: varredura do código (migrations, `src/lib/ai/mirror`, `src/lib/panel`, `src/types`,
> `src/lib/feed`). Citações em `arquivo:linha`.

### 2.1 Modelo de dados

**`entries` (registro bruto)** — `supabase/migrations/001_entries.sql:4-22`,
`src/types/entry.ts:1-27`
- `what_i_did`, `decision`, `learning`, `impact`, `metric` — o feito + enriquecimento
- `tags` (text[]) — skills/temas atribuídos **pela IA** na extração (ex: `["API", "performance"]`)
- `company`, `role_title`, `project_name` — contexto profissional
- `entry_date` (quando aconteceu) vs `created_at` (quando foi capturado)
- `embedding` (vector) — dedup semântico
- `evidences` (JSONB) — **campo alocado mas sem uso ativo** (existe no schema, ninguém escreve)

**`mirror_snapshots` (o espelho gerado)** — `supabase/migrations/002_mirror_snapshots.sql:4-22`
- `mirror` (JSONB) — a estrutura completa do espelho
- `strength_themes` (text[]) — 3–6 temas de força (ex: `["produto 0→1", "fluência técnica"]`)
- `entry_count` (int) — quantas entradas alimentaram
- `resonated`, `feedback_text` — feedback do usuário
- `primary_strength` duplicado no snapshot para acesso rápido do painel

**Estrutura do `mirror` (JSON)** — `src/types/mirror.ts:38-46`
- 3 cards de prosa: `primary_strength`, `invisible_skill`, `context_pattern` — cada um com
  `evidence.text` (prosa) + `evidence.entry_ids` (UUIDs das entradas que sustentam)
- `categories` (MacroCategory[]) — 5 macro-áreas ("Execução", "Insight e Diagnóstico",
  "Estratégia e Visão", "Influência e Liderança", "Domínio"), cada uma com `skills`
- Cada `SkillItem`: `name`, `tier` (`"Emergente" | "Consistente" | "Comprovada"`),
  `evidence_text` (1 linha), `entry_ids` (UUID[])

### 2.2 Como o espelho é gerado — `src/lib/ai/mirror/generateMirror.ts:88-128`

1. Carrega as **últimas 20 entradas** (`MAX_ENTRIES = 20`, linha 14), ordenadas por
   `created_at DESC`.
2. Rotula E1, E2… → UUID (mapa de resolução) e monta o prompt.
3. Chama o **Sonnet** com o system prompt de `prompts/firstMirror.ts:19-259`.
4. Valida e resolve `entry_ids` (descarta labels inválidos).
5. Persiste um **novo snapshot** (não atualiza — cria outro).

> **Achado crítico nº1 — amnésia:** o espelho enxerga só as **últimas 20 entradas**. Para um
> produto vendido como *"camada de evidência durável embaixo dos momentos que importam"*, o
> espelho esquecer os primeiros meses é uma contradição de raiz.
>
> **Achado crítico nº2 — sobrescrita:** cada geração re-sintetiza do zero e cria um snapshot
> novo. Nada de competência **persiste** entre gerações. Não há o que plotar no tempo.

### 2.3 Como o tier é atribuído — `prompts/firstMirror.ts:88-95`

Os tiers são **qualitativos, atribuídos pelo Sonnet no olho**, guiados por texto no prompt:
- **Emergente:** skill presente mas pouco evidenciada (1–2 exemplos, sem resultado externo)
- **Consistente:** evidenciada com regularidade (3+ exemplos OU resultado documentado)
- **Comprovada:** prova robusta (resultado externo, reconhecimento, impacto mensurável)
- *"Comprovada guard" (linha 95):* sem evidência externa explícita, o teto é "Consistente".

> **Achado crítico nº3 — inflação:** **não existe cálculo.** O `entry_ids.length` é só a
> cardinalidade de entradas linkadas; nenhuma regra determinística amarra tier a quantidade/
> qualidade de evidência. O Sonnet interpreta "soa forte" — e por isso 1–2 registros viram
> "Consistente". **Isso viola o princípio anti-clichê do próprio produto** ("específico +
> citado > grandioso + vago", `product-context.md`).

### 2.4 Agrupamento por área/tema — o que existe e o que falta

- **Existe:** `tags` (array na entry), `company`, `project_name` — dá pra agrupar por esses.
- **Existe (efêmero):** `strength_themes` — 3–6 palavras que o **Sonnet inventa** a cada
  geração e que **somem no próximo snapshot**.
- **Não existe:** entidade "área/frente/tema" persistente. "Product Analytics", "Comunicação"
  etc. **não existem como objeto** — são no máximo strings soltas em `tags`.
- **Não existe:** o caminho inverso evidência→força. Uma skill tem `entry_ids`, mas as
  entradas não sabem em qual força/categoria foram usadas. Não dá pra perguntar "me mostra
  todas as evidências de Product Analytics" sem parsear o JSON inteiro do espelho.

### 2.5 Dados quantitativos visíveis hoje

- **Grade-faísca** (`src/lib/feed/getActivityData.ts:6-33`, `ActivityGrid.tsx`): heatmap tipo
  GitHub — conta **entradas capturadas por dia**. É **volume de captura**, não progresso de
  carreira. ⚠️ Mede a coisa que a própria North Star **não** conta como ação de valor.
- **Skill summary** (`src/lib/panel/getPanelData.ts:175-186`): contagem por tier
  (comprovadas/consistentes/emergentes) — **do último snapshot apenas**, sem evolução.
- **Trajectory highlights** (`getPanelData.ts:140-146`): 3 entradas com `impact` preenchido.
  Não é cálculo de força — é filtro.
- **Strength themes:** as 3–6 palavras do último snapshot.

### 2.6 Resumo dos buracos

| Buraco | Consequência |
|---|---|
| Sem cálculo de força por quantidade/qualidade de evidência | Tier infla (tensão 1) |
| Sem persistência de competência entre gerações (só snapshot) | Sem evolução no tempo (tensão 2) |
| Só últimas 20 entradas alimentam o espelho | Amnésia da história |
| Sem entidade "frente/área"; sem caminho evidência→força | Sem agrupamento direcional (tensão 3) |
| `evidences` JSONB existe mas não é usado | Slot pronto, subutilizado |
| Grade-faísca premia captura, não progresso | Métrica-vaidade latente |

---

## 3. O diagnóstico de produto (o reframe)

### 3.1 As três tensões são a mesma raiz

**O espelho é uma redação linda que esquece.** Falta embaixo dele uma **camada de competência
que acumula evidência ao longo do tempo.** Em cascata:

| Tensão da Ohana | Raiz única |
|---|---|
| Evidência infla (1–2 registros → "comprovado") | Tier é chute do modelo, não contagem durável |
| Falta evolução/gráfico | Cada espelho sobrescreve o anterior; nada persiste |
| Não vejo evidências por frente | "Frente" não existe como entidade; só tags soltas |

### 3.2 Retrospectivo vs. direcional (o coração)

- **Arquivo retrospectivo** (o que existe): "o que eu fiz", agrupado por projeto/empresa/tag.
- **Instrumento direcional** (o que falta): evidência organizada em torno do **caso que estou
  montando pro meu próximo movimento.**

O exemplo do PDI da Ohana é a prova: ela tem um **objetivo** (sênior na CKL), definiu
**frentes** (Product Analytics, Comunicação, referência em IA, Mentoria) e quer a evidência
organizada em torno de **onde está indo** — não de onde esteve. **Inteligência de carreira é
inerentemente direcional.**

### 3.3 JTBD (lente Jobs-to-be-Done)

- **Funcional:** "montar e enxergar o caso das minhas competências rumo a um objetivo."
- **Emocional:** "me sentir no controle da minha narrativa; não esquecer o que fiz; ter
  segurança de que mereço o próximo passo."
- **Social:** "provar meu valor pra quem decide (chefe, recrutador) sem parecer que me gabo."

O job dominante num produto de carreira é **emocional/social** — e é direcional por natureza.

---

## 4. A tensão central a navegar

> **O verdadeiro problema não é "adicionar gráficos". É:**
>
> **Como dar ao Borogodó a camada de acumulação/rigor que inteligência de carreira exige —
> evidência que se fortalece de verdade no tempo, organizável por direção — SEM virar a matriz
> de competência corporativa que a marca existe para recusar?**

Duas forças em tensão, ambas legítimas:

- **Descoberta** (serendipítica, bottom-up, o que emerge): a joia da coroa é o card
  *invisible_skill* — "como você viu isso em mim?". Ela só existe porque a pessoa **não
  declarou**. Direção top-down demais cria **viés de confirmação** e mata a descoberta.
- **Direção** (goal-oriented, top-down, o que estou mirando): sem ela, não há inteligência de
  carreira acionável — só um álbum de recortes.

**O anticorpo da marca (steelman do "não fazer"):** o `product-context.md` lista
explicitamente, no que está FORA do v1: *"Gamificação ou **relatórios visuais**"*. E a North
Star é *"ações de valor"* = consultar insight OU publicar — **capturar não conta.** Ou seja:
a marca tem imunidade contra exatamente o que a tensão 2 ingenuamente pede. Esse instinto da
Ohana ("nada de vaidade") está certo e deve guiar o design.

**Decisão da Ohana (registrada):** as duas coexistem — o design tem que **resolver** essa
tensão, não escolher um lado.

---

## 5. As opções (frame — trade-offs honestos)

> Lente de priorização: **RICE** (Reach = todas as personas; Impact = credibilidade +
> retenção; Confidence alto pelos próprios sintomas; Effort é o que separa as opções).

### Opção A — Só rigor (piso de tier)
Regra determinística ("nunca 'Comprovada' sem resultado externo citado; nunca 'Consistente'
com <3 evidências") + mostrar a contagem de evidência por força.
- ✅ Barato; mata a inflação (tensão 1); protege credibilidade já.
- ❌ Não entrega direção nem evolução. Ataca 1/3 da raiz. Como o tier ainda vive só no
  snapshot, a regra reaplica do zero toda vez — sem memória.

### Opção B — Camada de competência durável (a raiz) ⭐ recomendada
Entidade persistente **Competência**: acumula evidência da **história inteira**, tier ancorado
em regra, **guarda histórico** (evolução real). **Frentes** entram como *lente fina por cima*;
competências também **flutuam livres** (descoberta preservada).
- ✅ Resolve as três tensões de uma vez; único desenho onde descoberta e direção **coexistem
  por construção**.
- ❌ Maior mudança técnica desde o bloco Presença: muda como o espelho é gerado, adiciona
  tabela, migra snapshots. Risco de virar epic de 3 features se não fatiar.

### Opção C — Direção primeiro (frentes como atalho)
Deixar declarar frentes e pendurar evidência nelas — rápido pro caso do PDI.
- ✅ Entrega o uso pessoal já.
- ❌ Sem o ledger embaixo, "frente" vira só mais uma tag — retrabalho em ~2 meses. Feito
  top-down primeiro, cai no viés de confirmação e mata a descoberta. **Ordem errada.**

### Opção D — Não fazer / só apertar o prompt
Mexer no texto do prompt pra inflar menos.
- ✅ Custo quase zero.
- ❌ *Steelman:* talvez ainda não haja escala de dados pra doer, e a marca resiste a
  "relatórios visuais". **Mas** o exemplo do PDI mostra que a dor é real e presente, não
  hipotética.

---

## 6. Recomendação (a validar com a pesquisa)

**Opção B, fatiada.** O ledger de competência é a espinha; o rigor de tier vem **embutido**
nele; frentes e evolução são as lentes que ele destrava. O **primeiro slice** precisa ser
carvado com cuidado pra não virar epic de 3 meses.

### 6.1 Como a Opção B faz descoberta + direção coexistirem
- **Competências emergem bottom-up** da evidência → o espelho continua surpreendendo com a
  *skill invisível*. Descoberta intacta.
- **Frentes são lente opcional por cima** → uma competência pode pertencer a uma frente *ou*
  flutuar solta. A frente organiza pro momento de carreira; as soltas continuam aparecendo pra
  descoberta.
- **O "gráfico" honesto cai fora sozinho** → não é heatmap de atividade (vaidade), é a **barra
  de evidência de cada competência enchendo** conforme prova real se acumula, e o tier subindo
  Emergente→Consistente→Comprovada *porque foi merecido*. Evolução = "3 competências subiram de
  tier nos últimos 90 dias." Earned, não contado.

### 6.2 Efeito de 2ª ordem (a Ohana precisa saber antes de topar)
Muda a **semântica da regeneração**: hoje "regenerar" = jogar fora e reescrever; com o ledger,
"regenerar" = **atualizar** competências e **acrescentar** ao histórico. Exige migrar snapshots
existentes e repensar o botão de regenerar. É a maior peça técnica desde a Presença.

### 6.3 O maior risco (o que, se der errado, invalida tudo)
**Transformar o espelho caloroso num banco de dados que a pessoa tem que manter.** Se pendurar
evidência numa frente exigir trabalho manual, a captura deixa de ser invisível e quebra o
Princípio nº1 ("captura quase invisível; se exige esforço, falha"). **Regra inegociável:** a IA
atribui competência e frente sozinha; a pessoa no máximo **corrige com um toque**. Zero
bookkeeping. Sem essa garantia, a Opção B vira a Opção C disfarçada — melhor não fazer.

### 6.4 Risco novo revelado pela pesquisa — a barra vazia desmotiva o iniciante
A pesquisa de *earned vs. endowed progress* (Stanford) mostra que um medidor **quase vazio
atribuído ao próprio usuário** pode **reduzir** a motivação de quem está no começo (sinaliza "é
difícil"). Ou seja: mostrar "0/3 evidências pra comprovar" pra quem acabou de chegar pode
machucar em vez de motivar. **Implicação de design:** no começo, enfatizar o que **já emergiu**
(descoberta: "olha essa força que apareceu") e o **próximo passo pequeno**, não o quanto falta.
A barra de força é pra quem já tem tração; pro novato, o gancho é a revelação. Isso reforça, de
novo, que descoberta e direção têm de conviver — inclusive em momentos diferentes da jornada.

### 6.5 A régua de tier, ancorada em evidência (traduzida das 4 Regras de Evidência)
A pesquisa deu a regra determinística que faltava. Proposta a validar no `prototype`:

| Tier | Regra (o piso; o contexto/IA ajusta pra cima ou pra baixo) |
|---|---|
| **Emergente** | ≥1 evidência **direta e recente** no escopo daquela força. Basta aparecer. |
| **Consistente** | **Múltiplas** evidências em **contextos/ocasiões diferentes** (regra da *Sufficiency* — não a mesma situação repetida). É "opera habitualmente ali", não "fez uma vez". |
| **Comprovada** | Evidência **atribuível a terceiros / resultado externo** (número de negócio, reconhecimento, alguém que a pessoa orientou). Passa de "eu digo" pra "o mundo confirma" (*Authenticity* + o marcador Dreyfus/NIH de "virou referência"). |

Dois princípios que impedem a régua de virar burocracia:
- **Currency (decaimento):** um tier **enfraquece com o tempo** sem evidência nova — evita
  "Comprovada em 2019, parada desde então". A força tem que respirar com a carreira.
- **Regra + julgamento:** a régua dá o **piso** (mata a inflação de hoje), mas "quanto basta" é
  calibrado pelo contexto — desempenho claramente forte cedo pode subir com menos. Não é
  checklist rígido; é chão honesto. E o tier sempre carrega **a evidência que o justifica** do
  lado (narrativa defensável, não nota solta).

---

## 7. Hipóteses falsificáveis (testar, não assumir)

1. **A força honesta não é gráfico, é a barra de evidência ganhando peso.** O "gráfico" que
   não é vaidade é uma competência subindo de tier *porque* juntou prova real. *Erramos se* a
   Ohana olhar e sentir "métrica boba".
2. **A "frente" é o eixo direcional que falta — mas como lente, não como gaiola.** *Erramos se*
   declarar frentes matar o momento de descoberta.
3. **O rigor do tier precisa virar regra, não vibe do modelo.** Piso determinístico protege a
   credibilidade. *Erramos se* a rigidez fizer o espelho parecer burro/injusto com quem tem
   pouca evidência.
4. **O usuário volta pela frente ativa, não pelo espelho geral.** A retenção vem de "estou
   construindo meu caso pra X e vejo ele engordar". *Erramos se* ninguém criar uma frente.

---

## 8. Pesquisa de mercado e comportamento

> ⏳ **Em andamento** — rodando via harness de deep-research (5 ângulos, busca paralela,
> verificação adversarial, síntese citada). Esta seção será preenchida com o relatório citado.

Frentes investigadas:
1. **Concorrentes e análogos** — inteligência de carreira, brag documents, portfólio de
   evidências, competency/skills tracking pessoal, career journaling (Teal, Rezi, Torre,
   LinkedIn, Lattice/CultureAmp, 15Five; BR: Qulture.Rocks, Feedz, Gupy). Como tratam força de
   evidência, tiers, evolução no tempo, e como evitam (ou caem em) vaidade.
2. **Comportamento e retenção** — o "problema-vitamina" em produtos de reflexão/journaling/
   self-tracking; o que faz a pessoa **voltar**; gatilhos em momentos de carreira.
3. **Métricas honestas** — o que sinaliza progresso real de carreira sem vaidade; frameworks de
   "evidência de competência".
4. **Como orgs modelam prova de competência** — competency frameworks, career ladders, Dreyfus,
   9-box, PDI/IDP; quando uma competência está "comprovada".
5. **White-collar brasileiro** — auto-promoção "sem se gabar"; cultura de PDI no Brasil.

### 8.1 Achados por frente

#### Frente 1 — Concorrentes e análogos: ninguém entrega a camada de evidência durável
- **A própria LinkedIn validou nossa tese.** Os **Skill Assessments** (teste + badge) foram
  **descontinuados** — a justificativa oficial é que recrutadores preferem *"exemplos reais de
  como o candidato aplicou a skill"* a resultado de teste ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a507663)).
  E **endorsements têm R²≈0 com habilidade real** — a linguagem mais endossada bate com a de
  fato usada em <50% dos casos; é vaidade pura porque endossar é um clique sem custo nem prova
  ([interviewing.io](https://interviewing.io/blog/linkedin-endorsements-useless)). **[Confiança: alta]**
- **Brag document (Julia Evans) é o análogo conceitual mais próximo** — registro contínuo de
  conquistas "porque o gestor não lembra o que você fez". Funciona por ser evidência concreta em
  primeira pessoa; a armadilha é ser manual e disciplina-dependente — quase ninguém mantém
  ([jvns.ca](https://jvns.ca/blog/brag-documents/)). **A captura sem fricção é o valor central E o gargalo.**
- **Polywork (badges sociais de "o que você fez") fechou em jan/2025** por não sustentar massa
  crítica — badges de vaidade não retêm produto sozinhos ([HN](https://news.ycombinator.com/item?id=42554740)).
- **Torre.ai** gera aversão por **ranquear/pontuar a pessoa** e pela **opacidade do dado**
  ([Trustpilot](https://www.trustpilot.com/review/torre.ai)) → reforça "seu dado, não da empresa" como diferencial.
- **Teal/Rezi:** IA sem insumo real produz texto genérico e inflado; o dado morre no currículo.
- **Lattice/Culture Amp/Qulture.Rocks/Feedz** = o espelho do que **não** ser: competência vive
  no ciclo de review, dono é a empresa/gestor, tier vira burocracia. **Exceção a copiar:** a
  **leveza da captura do 15Five** (check-in de "15 min pra escrever, 5 pra ler").
- **Linha que separa o Borogodó de todos:** tier só não vira matriz corporativa se cada nível
  for **derivado de evidência acumulada (bottom-up)** em vez de **atribuído por um avaliador
  (top-down)**.

#### Frente 2 — Retenção: acumulação é a alavanca, hábito diário é a armadilha
- **Journaling/self-tracking abandonam por padrão** (retenção D30 ~2–6%); a causa estudada em
  *personal informatics* é **utilidade percebida caindo** + **custo de coleta manual**
  ([Epstein et al., PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5428074/); [Business of Apps](https://www.businessofapps.com/data/app-retention-rates/)). **[Confiança: alta no padrão]**
- **Carreira é produto episódico, não hábito diário.** A dor do brag document é o próprio JTBD:
  a pessoa "corre pra lembrar o que fez" na review. A cadência certa é **"antes de você
  esquecer"** (semanal/quinzenal, 5–10 min), não trimestral ([Fountain Institute](https://www.thefountaininstitute.com/blog/brag-documents)).
  → **Alvo de retenção = ritmo leve de captura + retorno ancorado em momentos** (review,
  promoção, entrevista), não streak diário.
- **Perseguir streak/recompensa variável seria copiar o pior playbook** — a crítica ao *Hooked*
  mostra que apps que vencem o fazem por **consistência de valor**, não manipulação
  ([Behavioral Scientist](https://www.thebehavioralscientist.com/articles/hooked-how-to-build-habit-forming-products-is-wrong)).
- **"Acumulação como retenção" é a alavanca certa** (Readwise/Roam/Obsidian: o valor **compõe**
  com o uso — "quanto mais registro, mais forte fica meu caso") ([Ness Labs](https://nesslabs.com/readwise-featured-tool)).
  Mas só funciona se derrotar os dois algozes: **custo de captura** e **utilidade do acervo já**.

#### Frente 3 — Métricas honestas: earned progress, feedback informacional, sem gamificação
- **Teste de vaidade (Croll/Ries):** "se você não pode agir sobre o dado, é vaidade; métrica
  boa muda comportamento". Vaidade **só sobe** e esconde problema (ex: total de registros, total
  de skills). O antídoto é **razão/mudança no tempo + próxima ação** ([Ries](https://tim.blog/2009/05/19/vanity-metrics-vs-actionable-metrics/)). **[alta]**
- **Achado mais fino, e um alerta de design — earned vs. endowed progress (Stanford, Koo &
  Fishbach):** mostrar progresso conquistado motiva **quando já há tração**, mas com **progresso
  baixo, um medidor quase vazio atribuído ao próprio usuário pode DESMOTIVAR** (sinaliza
  dificuldade) ([Stanford GSB](https://www.gsb.stanford.edu/faculty-research/publications/how-endowed-versus-earned-progress-affects-consumer-goal-commitment)).
  → Cuidado com a barra de evidência vazia no começo (ver risco novo em 6.4). **[alta]**
- **Gamificação é risco alto em produto sério.** A meta-análise **Deci, Koestner & Ryan (1999,
  128 estudos)** mostra que recompensa externa (pontos/badges/streaks) numa atividade
  intrinsecamente motivada **mina a motivação** (overjustification). O que **sustenta**:
  feedback **informacional** (comunica competência real), não **avaliativo/controlador**
  ([SDT/NN.g](https://www.nngroup.com/articles/autonomy-relatedness-competence/)). **[alta]**
- **Como visualizar força de evidência com honestidade:** ancorar em **critério, não em
  contagem**; rotular sobre o *dado* ("força comprovada por X evidências"), não sobre a *pessoa*
  ("sua nota"); **mostrar o que falta pra subir** (torna earned + acionável); **a barra tem que
  poder descer/ficar baixa**.

#### Frente 4 — Como orgs modelam prova: a régua concreta dos tiers
- **Career ladders (Dropbox, CircleCI, Rent the Runway):** um nível não é "sabe fazer X", é
  **"opera consistentemente num escopo de impacto"**. A linguagem recorrente é *"consistently
  demonstrates"* ([swyx](https://www.swyx.io/career-ladders); [progression.fyi](https://progression.fyi/f/rent-the-runway)). **[alta no padrão]**
- **Modelos de proficiência (Dreyfus, NIH):** o eixo é **autonomia decrescente + virar
  referência pros outros**. O marcador mais limpo e difícil de fingir de nível alto é **"ensina/
  orienta os outros naquilo"** ([NIH scale](https://github.com/joelparkerhenderson/maturity-models/blob/main/examples/skill/us-nih-proficiency-scale/index.md)).
- **As 4 Regras de Evidência (assessment por competência):** **Validity, Sufficiency,
  Authenticity, Currency** ([Cloud Assess](https://cloudassess.com/blog/what-are-the-rules-of-evidence-and-why-are-they-so-important/)):
  - *Sufficiency:* uma observação **não basta** — exige **múltiplos contextos/ocasiões** (não a
    mesma situação repetida).
  - *Authenticity:* evidência **direta/atribuível a terceiros** > auto-relato. Auto-declaração
    pura não fecha competência.
  - *Currency:* evidência precisa ser **recente** — competência **decai** sem prova nova.
- **"Quanto basta?" é julgamento qualitativo, não número fixo** — a pesquisa sugere ~6–12
  demonstrações pra estimativa estável, **menos se o desempenho é claramente forte cedo**
  ([NCIEA](https://www.nciea.org/blog/how-much-is-enough/)). → **Regra dá o piso; contexto ajusta.**
- **Como não burocratizar:** regra **+ julgamento** (não checklist); evidência como **narrativa
  defensável, não pontuação**; **documento vivo** (tier sobe/desce), não sentença.

#### Frente 5 — White-collar brasileiro: autopromoção é tabu ativo; "mostrar, não dizer"
- **O desconforto com falar de si é real e quantificado:** **28,8% dos profissionais BR se
  preocupam com o que colegas pensam do que publicam — a maior taxa do mundo**; a cultura ensina
  uma "postura excessivamente humilde, como se o sucesso fosse feio" ([Exame](https://exame.com/carreira/como-fazer-marketing-pessoal-sem-parecer-arrogante/)).
  Há penalidade de gênero (mulheres se autoavaliam mais baixo com desempenho igual). **[alta]**
- **Hofstede explica:** Brasil tem **distância de poder alta (69)**, é **coletivista (indiv. 38)**
  e tem **aversão a incerteza alta (76)** → o valor precisa ser **reconhecido pelo grupo/líder**,
  não declarado pelo indivíduo; e há preferência por estrutura/previsibilidade ([geerthofstede.com](https://geerthofstede.com/culture-geert-hofstede-gert-jan-hofstede/6d-model-of-national-culture/)).
- **O reframe culturalmente aceito:** *"não é dizer que você é competente, é mostrar isso"* —
  **storytelling de realizações, não gabação**; personal branding como **posicionamento** ("o
  problema que você resolve"), não autopromoção ([Correio Braziliense/BBC](https://www.correiobraziliense.com.br/mundo/2021/05/4926272-a-habilidade-chave-no-trabalho-que-ainda-e-vista-como-tabu.html)).
- **Encaixe direto do produto no momento de pleito:** o conselho BR unânime pra pedir promoção/
  aumento é *"baseie em dados, não em sentimentos — lista de realizações concretas e como
  contribuíram pro resultado"* ([Exame](https://exame.com/carreira/como-pedir-aumento-ou-promocao-3-passos-para-negociar-melhor-o-salario/)).
  O profissional é mandado fazer exatamente o que a cultura o ensinou a evitar — sem ter
  registrado nada. **É o buraco que o Borogodó preenche.**
- **PDI é infra conhecida (Qulture, Feedz), mas com peso de RH** — o exemplo do PDI da Ohana é
  culturalmente central, não idiossincrático. Mas o produto precisa se distanciar do
  enquadramento "ferramenta de gestão".

### 8.2 O que a pesquisa mudou / fortaleceu na recomendação

1. **Fortaleceu a Opção B (camada durável) como alavanca de RETENÇÃO, não só de rigor.** A
   evidência de "acumulação como retenção" (Readwise/Roam) + a natureza episódica da carreira
   dizem: o acervo que engorda É o motivo de a pessoa voltar no momento que importa. Isso conecta
   direto ao wedge do `product-context` ("volta pra montar o próprio caso").
2. **Deu a régua concreta dos tiers** (antes era "uma regra qualquer"). Ver 6.5 — as 4 Regras de
   Evidência traduzidas para Emergente/Consistente/Comprovada.
3. **Acendeu um risco novo de design — a barra vazia desmotiva o iniciante** (earned vs. endowed).
   Ver 6.4. Isso não mata a Opção B, mas muda como a evolução é mostrada no começo.
4. **Confirmou o veto a gamificação** (streaks/badges/leaderboards) com meta-análise seminal —
   alinha com o instinto da Ohana e com o anticorpo da marca.
5. **Ancorou o tom e o frame na cultura BR:** "mostrar, não dizer" + "evidência que sustenta uma
   conversa com o gestor" + espaço privado que reduz ansiedade de exposição. A frente/direção
   ganha lastro cultural (casa com o PDI já instalado), desde que não soe como RH.

### 8.3 Convergência entre as frentes (o que apareceu em 3+ pesquisas independentes)

- **Evidência aplicada em primeira pessoa > score/endosso/teste** (LinkedIn, competency
  frameworks, cultura BR) — o "mostrar, não dizer" é ao mesmo tempo o que recrutador quer, o que
  a régua de competência exige, e o que a cultura BR aceita.
- **Tier tem que ser bottom-up, ancorado em evidência, não atribuído por avaliador** (concorrentes
  + modelos de prova) — é a linha que separa Borogodó de matriz corporativa.
- **Captura leve é o gargalo** (retenção + brag doc + 15Five) — se exigir esforço, o acervo não
  acumula e nada disso funciona. Reforça o Princípio nº1 do produto.
- **Nada de vaidade/gamificação** (métricas honestas + concorrentes + marca) — veto convergente.

---

## 9. Perguntas abertas e próximos passos

**Perguntas abertas (a pesquisa deve ajudar a fechar):**
- Qual a regra determinística de tier que soa **justa** e **honesta** (nem inflada, nem cruel)?
- Frente é criada pela pessoa, sugerida pela IA, ou ambos? Quão automático precisa ser?
- Qual a menor fatia shippable da Opção B que já entrega valor e prova a hipótese?
- Onde a evolução aparece sem virar dashboard (no espelho? numa aba? no card da frente)?

**Próximos passos:**
1. Fechar a pesquisa (seção 8).
2. `/product-north prototype` — protótipo visual navegável do ledger + lente de frente + barra
   de evidência (teste barato contra o medo do "vira dashboard").
3. `/product-north stress` — pré-mortem do risco arquitetural, se a Ohana quiser pressionar
   antes de comprometer.
4. `/product-north decide` — decision record em `docs/decisions/` + handoff pro
   `/speckit-specify`.
