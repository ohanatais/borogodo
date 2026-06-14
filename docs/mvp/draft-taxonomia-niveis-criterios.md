# Draft — Taxonomia de skills, comunicação de nível e critérios de recrutador

> **Status:** draft de pesquisa (jun/2026) para a Ohana refinar. É o **Input 3** do
> `inputs-de-qualidade.md`. Fundamentado em frameworks reais de mercado (fontes no fim).
> Decisões marcadas com 🔲 precisam do seu aval antes de virar input travado de spec.

---

## Parte 0 — O princípio extensível (leia primeiro)

Você pediu uma estrutura que sirva de **guideline base também pra outras áreas no futuro**.
O mercado resolve isso com um modelo de **3 camadas** — e é o que recomendo copiar:

| Camada | O que é | Exemplo no mercado |
|---|---|---|
| **1. Estrutura-base universal** | O esqueleto que vale pra qualquer profissão: macro-categorias + skill + evidência | O*NET, ESCO (occupations ↔ skills ↔ qualifications, hierárquico) |
| **2. Taxonomia por área** | Instancia a base para uma profissão (PM primeiro) | Reforge (12 competências de PM), SFIA (TI) |
| **3. Camada emergente** | Skills que frameworks formais ainda não catalogaram (ex.: AI-native) | LinkedIn Skills Graph (atualizado em tempo real sobre vagas) |

> Padrão de mercado confirmado: empresas usam **O*NET/ESCO como base** e **layeram uma fonte
> em tempo real (LinkedIn/vagas)** pra capturar skills emergentes. O Borogodó faz o mesmo: base
> estável + camada emergente extraída do trabalho real da pessoa.

---

## Parte 1 — Taxonomia de skills

### 1a. A estrutura-base (guideline pra qualquer área)

**Esquema de dados de cada skill** (espelhando os campos de um skills graph sério: id, aliases,
tipo, relações):

```
skill:
  nome
  categoria_macro      ← uma das 5 abaixo (universal)
  tipo                 ← técnica | comportamental | domínio
  aliases[]            ← sinônimos (pra a IA agrupar "discovery" e "descoberta de produto")
  evidencias[]         ← entradas reais que sustentam (NUNCA vazio)
  area                 ← PM | Vendas | Financeiro... (camada 2)
```

**As 5 macro-categorias universais** (derivadas dos frameworks, mas área-agnósticas — esse é o
guideline base):

| Macro-categoria | Pergunta que responde | Vale pra qualquer área? |
|---|---|---|
| **Execução** | Você entrega? Com qualidade e no prazo? | Sim |
| **Insight / Diagnóstico** | Você entende o problema, o dado, o usuário? | Sim |
| **Estratégia / Visão** | Você gera direção e impacto no negócio? | Sim |
| **Influência / Liderança** | Você mobiliza pessoas (com ou sem autoridade)? | Sim |
| **Domínio** | Você conhece o setor/mercado a fundo? | Sim |

**Por que generaliza (prova rápida com 3 áreas):**

| Macro | PM | Vendas | Financeiro |
|---|---|---|---|
| Execução | shipar produto | fechar negócio | fechar o mês/relatório |
| Insight | discovery, dados de uso | ler o cliente, pipeline | análise, diagnóstico de números |
| Estratégia | visão de produto | estratégia de conta | planejamento, alocação |
| Influência | stakeholders sem autoridade | negociação | convencer liderança com dado |
| Domínio | mercado/segmento | setor do cliente | regulação, normas |

→ A base é a mesma; só muda a **instanciação** (camada 2). É isso que te dá o guideline reusável.

### 1b. Instanciação para PM (camada 2)

Mapeando Reforge (4 áreas / 12 competências) + dimensões de entrevista Meta/Google nas 5 macro:

| Macro-categoria | Skills de PM (instância) |
|---|---|
| **Execução** | Qualidade de produto · Entrega/delivery · Especificação de feature |
| **Insight / Diagnóstico** | Fluência com dados · Voz do cliente · Pesquisa/discovery · UX |
| **Estratégia / Visão** | Visão de produto · Roadmap · Impacto no negócio · Métricas (North Star + guardrails) |
| **Influência / Liderança** | Stakeholders · Influência sem autoridade · Comunicação · Ownership |
| **Domínio** | Conhecimento de mercado/segmento (HealthTech, AgTech, regulado...) |

### 1c. A camada emergente (camada 3)

Frameworks formais **atrasam** em skills novas. O diferencial do Borogodó é capturar as
emergentes a partir do trabalho real — ex.: **AI-native** (usar IA como infraestrutura de PM),
**0→1 em consultoria**, **produto em mercado regulado**. Não force essas dentro de uma caixa
antiga; deixe a taxonomia respirar.

### 1d. Brasilidade na taxonomia (premissa, não enfeite)

Frameworks globais tratam como "soft" ou como defeito o que é **força brasileira**. Nomeie
como skill evidenciada de primeira classe:

- **Versatilidade forjada na escassez** (vestir vários chapéus por falta de recurso) → não é "falta de foco"
- **Navegação de ambiguidade/instabilidade**
- **Articulação relacional** (resolver via relacionamento, não só processo)

🔲 **Decisão sua:** aprova as 5 macro-categorias como base + a lente BR de primeira classe?

---

## Parte 2 — Como comunicar nível sem virar endosso vazio

### A armadilha (o que NÃO fazer)
- **Endosso do LinkedIn** é o caso-escola do "vazio": é considerado **inútil** justamente porque
  não tem evidência atrás — gente endossa por impulso, sem saber se a pessoa é boa naquilo.
- **CliftonStrengths** é confiável, mas o próprio Gallup reconhece: **auto-relato infla** (viés de
  autopercepção). Ou seja: nota auto/IA-atribuída sem lastro = ruído.

### O princípio: nível = **função da evidência**, não nota atribuída
A pesquisa séria (Evidence-Centered Design) diz: toda afirmação de proficiência precisa de
**observação que a sustente**. Traduzindo pro Borogodó: o nível **emerge da evidência**, não é um
selo que a gente carimba.

### Modelo prático recomendado (tiers de evidência, não estrelas)
Inspirado em Dreyfus (novice→expert) mas reancorado em **evidência**, não em autopercepção:

| Tier | O que significa | Como é calculado |
|---|---|---|
| **Emergente** | aparece, mas pouco | 1 evidência, 1 contexto |
| **Consistente** | recorrente | várias evidências, múltiplos contextos |
| **Comprovada** | validada por fora | evidências **+ validação externa** (Clutch, resultado, depoimento) |

> O tier **Comprovada** é onde o pilar **Provar** se conecta: a evidência externa (suas reviews
> 5★ no Clutch, por ex.) é o que sobe uma skill de "consistente" pra "comprovada". Isso é
> credibilidade de recrutador embutida na mecânica.

**Regra inegociável:** o nível **nunca** aparece sozinho. Sempre ao lado da(s) evidência(s) que o
sustenta(m) — clicável. Sem o "porquê", vira barra de LinkedIn.

🔲 **Decisão sua:** recomendo **abandonar a barra ●●●●○** e usar **rótulo de tier + lista de
evidência**. A barra parece "nota"; o tier+evidência parece "prova". Confirma?

---

## Parte 3 — Critérios de recrutador (PM, com lente BR)

### 3a. O que avaliam (FAANG, como referência de rigor)
- **Meta:** Product Sense · Analytical Thinking (métricas/diagnóstico) · Leadership & Drive (influência sem autoridade).
- **Google:** ~6 dimensões (design de produto, métricas, comportamental, estratégia/"moonshot").

### 3b. Os sinais que QUALQUER recrutador lê (independe de empresa)
1. **Impacto com número** (não responsabilidade: "aumentei X em Y%")
2. **Escopo/escala** (quantos produtos, times, países, usuários, budget)
3. **Progressão** (responsabilidade crescente ao longo do tempo)
4. **Especificidade > buzzword** (alérgicos a "transforma ambiguidade")
5. **Ownership / influência sem autoridade**
6. **Fit** (pro papel e pro contexto)

### 3c. Lente Brasil (o que as vagas BR pedem)
- 5+ anos; **discovery baseado em dado, entrevista e benchmark**; visão/estratégia/roadmap;
  métricas; gestão de stakeholders; **AI agora explicitamente valorizada**; ferramentas
  (Scrum, APIs, BI/Excel); pra sênior, **trabalho upstream** e ser **parceiro estratégico**.
- Cultural: **fit e storytelling pesam mais** que no padrão americano; adaptabilidade/jeitinho
  é lido como qualidade.

### 3d. Como o espelho "fala essa língua"
- Toda afirmação carrega **número + escopo + resultado**, não adjetivo.
- Cada macro-categoria do espelho **mapeia** numa dimensão de recrutador, pra o output ser
  legível por quem avalia:

| Macro do espelho | Dimensão de recrutador |
|---|---|
| Execução | "delivery / ships product" |
| Insight | "product sense / analytical" |
| Estratégia | "strategy / metrics / business impact" |
| Influência | "leadership / stakeholder / sem autoridade" |
| Domínio | "fit de mercado / especialização" |

🔲 **Decisão sua:** aprova mapear cada categoria do espelho numa dimensão de recrutador (pra o
output servir ao pilar **Usar** num processo seletivo)?

---

## Parte 3.5 — Princípio transversal: a métrica é convite, não cobrança (lente BR, aprovado jun/2026)

O brasileiro tem um gap real em metrificar e exibir resultado palpável — mas **muitas vezes
porque o contexto não tinha dado**: empresas não geridas por dados, PM/PO atuando em modo
"apagar incêndio". Ausência de métrica **não é incompetência**, e o espelho nunca pode tratar
como tal.

Como o produto age:
- **Convida, sempre:** quando uma conquista não tem número, o chat pergunta "você lembra de um
  número — antes/depois, tamanho, frequência?" — mostrando que evidência quantificada deixa o
  espelho mais robusto (pode subir pro tier *Comprovada*). O convite é recorrente, não pontual.
- **Aceita o gap sem punir:** sem número, a skill ainda vale por **evidência qualitativa** (o que
  mudou, o problema resolvido, o contexto enfrentado) — fica em *Emergente*/*Consistente*, não some.
- **Nunca inventa:** "sem número" ≠ "sem evidência". Adjetivo vazio é proibido; relato concreto
  sem número é aceito.
- **Guia, não cobra:** o tom é "isso pode ficar ainda mais forte se…", nunca "falta número".
  Brasilidade = ajudar a mostrar valor sem fazer a pessoa se sentir menos.

---

## Parte 4 — O que isso vira no produto (resumo acionável)

| # | Decisão | Recomendação | Status |
|---|---|---|---|
| A | Estrutura-base | 5 macro-categorias universais + esquema skill/evidência | ✅ aprovado (jun/2026) — base da **página de espelho detalhada** |
| B | Nível | tiers (Emergente/Consistente/Comprovada), evidência sempre visível, **sem barra** | ✅ aprovado |
| C | Legibilidade | cada categoria mapeia numa dimensão de recrutador | ✅ aprovado |
| D | Brasilidade | skills BR como primeira classe | ✅ aprovado |
| E | Anti-clichê | adjetivo vazio proibido; toda claim com evidência (número **OU** relato concreto) | ✅ princípio |
| F | Métrica = convite | convidar a quantificar sempre; aceitar ausência sem punir; nunca inventar | ✅ aprovado (Parte 3.5) |

Estas decisões estão **travadas** — viram input da spec da `006-espelho-evidencia`, e o agente
para de adivinhar.

---

## Fontes

- [Reforge — 12 Product Manager Skills (4 competency areas)](https://www.reforge.com/blog/product-manager-skills)
- [Reforge — Maximizing PM Performance (competency model 12 dims × 7 levels)](https://www.reforge.com/blog/maximize-the-performance-of-your-product-managers)
- [Ravi Mehta — What's Your Shape? (PM competency model)](https://www.ravi-mehta.com/product-manager-roles/)
- [Open Skills and Talent Graphs — Guide to Skills-Based Hiring 2025 (O*NET/ESCO base + realtime layer)](https://www.jobspikr.com/blog/open-skills-and-talent-graphs-2025/)
- [LinkedIn — Building the Skills Taxonomy behind the Skills Graph (36k skills)](https://www.linkedin.com/blog/engineering/data/building-maintaining-the-skills-taxonomy-that-powers-linkedins-skills-graph)
- [SFIA — Skills & Competency Framework (7 níveis)](https://umbrex.com/resources/frameworks/organization-frameworks/skills-and-competency-frameworks-e-g-sfia/)
- [Dreyfus Model of Skill Acquisition (novice→expert)](https://en.wikipedia.org/wiki/Dreyfus_model_of_skill_acquisition)
- [CliftonStrengths — Science (e viés de auto-relato)](https://www.gallup.com/cliftonstrengths/en/253790/science-of-cliftonstrengths.aspx)
- [Why LinkedIn endorsements are worthless — CBS News](https://www.cbsnews.com/news/why-linkedin-endorsements-are-worthless/)
- [LinkedIn endorsements are dumb, here's the data — interviewing.io](https://interviewing.io/blog/linkedin-endorsements-useless)
- [Meta PM Interview — Product Sense / Analytical / Leadership (IGotAnOffer)](https://igotanoffer.com/blogs/product-manager/facebook-product-manager-interview)
- [Meta Analytical Thinking / Execution interview (IGotAnOffer)](https://igotanoffer.com/blogs/product-manager/facebook-execution-interview)
- [Senior Product Manager — vagas Brasil (Glassdoor)](https://www.glassdoor.com.br/Vaga/brasil-senior-product-manager-vagas-SRCH_IL.0,6_IN36_KO7,29.htm)
- Evidence-Centered Design — [ETS: Assessing Written Communication (ECD: claim/evidence/task)](https://onlinelibrary.wiley.com/doi/full/10.1002/ets2.12035)
