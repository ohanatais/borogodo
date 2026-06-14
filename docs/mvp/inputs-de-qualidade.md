# Inputs de qualidade — o combustível do batch autônomo

> **Para quê serve este doc:** lista tudo que você (Ohana) precisa me entregar para que as
> próximas features sejam implementadas no auto e **deem certo de verdade** — não só
> "rodem". Para cada input: o que é, por que é crucial, como construir, e como me entregar.
> Iterável: preencha os templates onde puder; o que ficar em aberto, a IA adivinha — e
> adivinhação, num produto de gosto, é clichê.

## O princípio (leia antes de tudo)

O gargalo das próximas features **não é falta de agente nem de máquina** — é **densidade de
decisão**. Agente é ótimo no mecânico (schema, CRUD, testes, fiação) e péssimo no gosto
(isso soa clichê? a revelação emociona?). Cada decisão que você **trava aqui** é uma decisão
que o agente **não precisa inventar** lá na frente. Quanto mais você front-loada o pensamento,
mais o código roda sozinho com segurança.

> Regra de ouro: **se você não decidir, o agente decide pela média. E a média é genérica.**

## Resumo dos inputs

| # | Input | Quem provê | Status |
|---|---|---|---|
| 1 | **Exemplos-ouro** (espelhos bom × clichê) | Você (eu ajudo) | ⬜ a construir — **o mais importante** |
| 2 | **Fixtures** (históricos reais de carreira) | Você + web research | 🟡 fixture #1 já existe (seus 3 currículos) |
| 3 | **Decisões de gosto** (taxonomia, força, anti-clichê, UI de evidência) | Você (eu pesquiso draft) | ⬜ a decidir |
| 4 | **Spec travada** (sem ambiguidade) | speckit `/clarify` comigo | ⬜ por feature |
| 5 | **Migrations** (rodar SQL no banco) | Você (à mão) ou CLI | 🟢 fluxo definido |
| 6 | **Definition of done** | Já na constituição | 🟢 pronto |

---

## Input 1 — Exemplos-ouro (o mais importante)

### O que é
Pares de **input → output**, anotados, mostrando o que é um espelho **excelente** e o que é
um espelho **clichê**. É o alvo concreto que substitui a instrução vaga "evite clichê".

### Por que é crucial
"Evite clichê" não é testável — a IA não sabe o que você acha clichê. Um exemplo-ouro vira:
1. **Alvo pro agente** — ele tem um norte de "assim que é bom".
2. **Caso de teste** — dá pra escrever teste que compara o output contra o padrão de qualidade.
3. **Régua anti-regressão** — quando mexermos no prompt, comparamos com os exemplos pra não piorar.

Sem isso, **toda geração regride pra média genérica** — exatamente o problema que você quer matar.

### Como construir (o jeito barato)
O produto atual **já produz os exemplos clichê de graça** — é só rodar o espelho hoje. O
trabalho é construir os **excelentes**: pegue um output atual e **edite à mão** até ele te
fazer sentir "ele me viu". Esse texto editado é o ouro.

### Quantos e de quais tipos
- **Mínimo: 3 bons + 3 clichê.** Ideal: cobrir 2 arquétipos de PM (ex.: PM de 0→1 vs. PM de
  plataforma/escala) pra a engine generalizar dentro da persona Ana.

### Template (copie e preencha, um por exemplo)

```
### Exemplo-ouro #N — [arquétipo, ex.: PM de 0→1 em consultoria]

#### Input (histórico bruto, como o usuário forneceria)
[colar o histórico — pode ser um dos currículos, ou entradas soltas]

#### Espelho EXCELENTE (o alvo)
Especialidades: [ex.: Produto 0→1 · Consultoria enterprise · AI-native]
Padrão de carreira: [ex.: 9 produtos em 3 países, discovery em mercados regulados]
Por categoria:
  Discovery & Pesquisa — [skill] · evidência: "[trecho específico do histórico]"
  Liderança & Stakeholders — [skill] · evidência: "[trecho]"
  Fluência técnica / IA — [skill] · evidência: "[trecho]"
  [domínio] — [skill] · evidência: "[trecho]"

#### Por que é EXCELENTE (anotações — isto ensina a IA)
- Específico: [por que não poderia ser de qualquer PM]
- Evidência vinculada: [cada afirmação aponta pra um fato real]
- BR-aware: [nomeia X como força, não como falta de foco]
- Crível pra recrutador: [tem número/escopo/resultado, não buzzword]

#### Espelho CLICHÊ (contra-exemplo — geralmente o output atual)
[colar o output genérico]

#### Por que é CLICHÊ (anotações)
- [poderia ser de qualquer pessoa]
- [reformula auto-avaliação sem prova]
- [buzzword: "transforma ambiguidade em entrega"]
```

---

## Input 2 — Fixtures (históricos reais de carreira)

### O que é
Históricos de carreira de verdade (anonimizados) pra testar a geração do espelho contra dado
real, não no vácuo.

### Por que é crucial
Espelho testado só com dado inventado parece bom no laboratório e quebra com gente real. E é
o que permite a **validação humana** (o gate do-or-die): mostrar o output pra 5 PMs reais e
ver se emociona.

### O que já temos
**Fixture #1 (pronto):** seus três currículos na raiz do repo — `Ohana Lohmann - Caylent.md`,
`- Toggl.md`, `- pubGENIUS.md`. São ricos (métricas, 0→1, Clutch 5★, multi-país) e você é
literalmente a persona Ana. Vou usá-los como base.
> ⚠️ Eles estão **untracked** (não commitados) e têm **dado pessoal** (telefone, e-mail). Antes
> de commitar qualquer coisa, mova-os pra fora do repo ou adicione ao `.gitignore`. Pra
> fixture de teste, eu uso uma **versão anonimizada** (sem contato).

### Como buscar mais (você está "sem acesso detalhado")
Três caminhos, do mais forte ao mais escalável:
1. **3–5 voluntários reais** — PMs da sua rede/comunidades (a Ana vive em comunidade). Peça o
   currículo ou o export do LinkedIn. É o dado mais valioso e o que valida de verdade.
2. **Sintéticos ancorados em pesquisa web** — eu posso usar busca na internet pra puxar
   **padrões reais de carreira de PM** (job descriptions, case studies públicos, "career
   ladders", relatos de promoção) e montar 3–4 históricos-arquétipo realistas. Não é dado de
   pessoa real (sem risco de privacidade), mas é fiel a como carreiras de PM realmente se
   parecem. **Isto é "a base de busca na internet" que dá pra criar.**
3. **Perfis públicos** — possível, mas com cuidado de privacidade/ToS. Prefiro sintético-ancorado.

### Bandas de senioridade e eixos de diversidade (calibrado em perfis reais de PMs BR)
> Derivado da análise de 6 perfis reais de PMs brasileiros (jun/2026), **só como padrão
> anonimizado** — nenhum dado individual foi salvo. O fixture set deve cobrir este espectro
> pra a engine não funcionar só com gente sênior.

**3 bandas de senioridade (cubra as três):**

| Banda | Como o perfil se escreve | Sinal-chave |
|---|---|---|
| **Júnior/Pleno** | listas de responsabilidade ("acompanhamento de…", "alinhamento com…"), **quase sem métrica**, foco em tarefa | valor **enterrado** — o caso que mais precisa do Borogodó |
| **Sênior/Staff** | impacto quantificado denso (+200%, −26%, 20 marcas), framing de negócio, "owner de…" | métrica é **o** divisor de senioridade |
| **Group PM/Head** | liderança de times (N PMs/devs), orquestração de vários produtos, comunicação executiva (board, OKRs, defesa de investimento) | escopo e liderança |

**Eixos de diversidade a variar entre fixtures:**
- **Domínio:** fintech/pagamentos/adquirência (domina o mercado BR — apareceu na maioria), e-commerce/marketplace, healthtech, logística, fraude/identidade.
- **Porta de entrada em produto:** engenharia (comp eng é comum), administração/negócios, **vendas**, consultoria/**empresa júnior** (sinal bem BR), design, operações/logística.
- **Estilo de escrita:** lista de responsabilidade × bullets de impacto; resumo em PT × EN; denso em certificação (PM3, Tera — cultura de bootcamp forte no BR).
- **Tamanho:** de 3 a 11 páginas (a engine não pode assumir input curto nem longo).

### O caso mais importante de testar (a sacada da calibração)
A maioria dos perfis — mesmo de gente boa — **default a lista de responsabilidade, não a
impacto**. É exatamente o problema de "valor invisível" que o produto ataca. Então o fixture
set **precisa** incluir perfis estilo "lista de responsabilidade" (valor enterrado), porque é o
caso mais difícil e mais valioso: o espelho tem que **revelar o impacto enterrado sem
inventar** — puxar a pessoa pra como um perfil sênior se lê, mas só com base na evidência que
está lá. Se o espelho só brilha com quem já escreve impacto quantificado, ele falha justamente
com quem mais precisa dele.

### Como me entregar
- Markdown ou texto colado, um arquivo por pessoa, **anonimizado** (sem nome/contato).
- Sugestão de pasta: `docs/fixtures/ana/` (eu crio quando você mandar o primeiro).
- Mínimo recomendado: **1 por banda** (júnior/pleno, sênior/staff, group) + 2 domínios diferentes.

---

## Input 3 — Decisões de gosto (pré-tomadas)

### O que é
As escolhas de produto que o agente **não deve inventar** porque definem se o espelho é bom
ou genérico.

### Por que é crucial
São decisões de **taste e de negócio**, não de engenharia. Se ficarem em aberto, o agente
escolhe a opção mais comum (= a mais genérica).

### As decisões que preciso de você (com o que a web research pode adiantar)

| Decisão | Pergunta a responder | O que eu posso pesquisar pra te dar um draft |
|---|---|---|
| **Taxonomia de skills** | Quais categorias existem pra um PM? (ex.: Discovery, Delivery, Liderança, Fluência técnica/IA, Domínio) | Frameworks reais de competência de PM (career ladders, job specs, o que o mercado usa), adaptados à realidade BR |
| **Nível de força** | Mostra "força" da skill? Como? (Lembra: barra ●●●●○ lê como fluff de LinkedIn pro recrutador) | Como produtos de avaliação sérios comunicam nível sem parecer endosso vazio |
| **Regras anti-clichê** | O que é proibido na copy do espelho? (lista de buzzwords/padrões banidos) | Posso propor a partir dos seus exemplos-ouro |
| **UI de evidência** | Como a evidência aparece atrelada a cada afirmação? | Padrões de "citação/proof point" em produtos de dados |
| **Critério de recrutador** | O que recrutador de PM BR valoriza? (pra o espelho falar essa língua) | Critérios reais de avaliação de PM (impacto, escopo, progressão, fit) |

> **Como funciona:** você diz "pesquisa o draft de X" → eu trago uma proposta fundamentada em
> fontes reais → você refina/aprova. Aprovado, vira input travado da spec.

### Como me entregar
Pode ser direto no chat (a gente decide junto) ou editando este doc com suas respostas.

---

## Input 4 — Spec travada (sem ambiguidade)

### O que é
A spec da feature sem nenhum `[NEEDS CLARIFICATION]` em aberto.

### Por que é crucial
`/speckit-implement` é só tão bom quanto a `tasks.md` que o alimenta. Ambiguidade na spec =
o agente improvisa = retrabalho.

### Como se resolve
Comigo, por feature, via `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
`/speckit-tasks`. Você não prepara nada antes — só responde as perguntas de clarify (e os
inputs 1–3 já tornam essas respostas óbvias).

---

## Input 5 — Migrations (rodar SQL no banco)

### A realidade atual (checada)
- **Não há Supabase MCP conectado aqui** → nada neste ambiente executa SQL no seu banco.
- As **skills `supabase`** são **guia** (escrevem RLS/migration corretos), **não executam**.
- O **Supabase CLI não está instalado** e o projeto **não está linkado** (sem `config.toml`).
- Hoje as migrations vivem como arquivos em `supabase/migrations/` (`001`–`004`) e são rodadas
  **à mão no SQL editor do dashboard** — que é o fluxo que o roadmap já assume.

### Resposta direta à sua pergunta
A skill **não roda** a migration; ela só te dá o SQL certo. Então: **sim, por enquanto é na
mão** — e isso é até **mais seguro** (você quer um olho humano em mudança de schema no banco
de produção).

### Se quiser mais automação depois (opcional)
Dá pra instalar e linkar o **Supabase CLI** uma vez (`supabase init` + `supabase link` +
`supabase db push`). Aí as migrations rodam pelo terminal (eu disparo via Bash) dentro do
pipeline. Requer: CLI instalado + access token + ref do projeto. **Recomendo deixar pra
depois** — manual nos checkpoints é o certo enquanto o batch é pequeno.

### Como me entregar
Nada antecipado. Em cada feature com migration, eu escrevo o `.sql`, te aviso no checkpoint, e
**você cola no dashboard** e confirma antes de seguir.

---

## Input 6 — Definition of done (já pronto)

Já está na constituição e nas rules — não precisa prover, só saber que cada feature só "fecha"
quando: testes ≥ 80% cobertura (TDD), `/impeccable audit` ok, `/pr-review` sem CRITICAL,
`/verify` nos dois idiomas, i18n sem string hardcoded, RLS por `user_id`.

---

## Como me entregar (resumo)

| Input | Onde / formato |
|---|---|
| Exemplos-ouro | `docs/fixtures/exemplos-ouro.md` (template acima) |
| Fixtures | `docs/fixtures/ana/*.md` (anonimizado) |
| Decisões de gosto | no chat, ou editando o Input 3 deste doc |
| Spec | comigo, via speckit (você só responde clarify) |
| Migrations | você cola no dashboard nos checkpoints |

## Próximos passos sugeridos
1. Eu gero **versões anonimizadas** dos seus 3 currículos como fixture #1 da Ana.
2. Eu rodo a **web research** pra te entregar um **draft de taxonomia de skills de PM** +
   **critérios de recrutador** (Input 3) — você refina.
3. Com fixture + um exemplo-ouro inicial, validamos a revelação à mão com 3–5 PMs (o gate).
4. Aí abrimos a primeira spec (`006-espelho-evidencia`) já com tudo travado.
