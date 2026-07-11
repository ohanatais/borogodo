# 001 — Rebuild da Landing Page (narrativa dos 4 verbos + Provas + camada SEO/GEO + mídia real)

- **Data:** 2026-06-27
- **Status:** decidido
- **Objetivo core que isso serve:** adesão. A única ação a converter é signup real (cai no onboarding, que entrega um primeiro borogodó em ~5 min). Não waitlist, não newsletter.

> Recriação da direção que vivia neste mesmo caminho e foi perdida ao limpar um worktree.
> Agora atualizada com a mescla decidida: issue #36 manda na narrativa/estrutura/voz; a
> auditoria de mercado entra como camada técnica de SEO/GEO e como reforço dos diferenciais
> (Provas + propriedade do dado); os mockups fake dão lugar a mídia real do produto.

## Contexto

A LP no ar conta a história antiga (3 cores: Espelho, Mapa, Geração), lidera com a palavra
opaca "borogodó" (falha o teste dos 5 segundos no tráfego frio de LinkedIn) e esconde o melhor
ativo no mobile (`hidden md:flex`). O produto já repositionou para os **4 verbos** (Descobrir,
Entender, Provar, Usar) e para o wedge "base de evidências com payoff episódico". Falta o pilar
**Provas** inteiro, que é o diferencial defensável.

Estudado antes de decidir: issue #36 (brief decidido), auditoria externa de LP/SEO/GEO (pesquisa
de mercado robusta), `product-context.md` (espinha dos 4 verbos, wedge, premissa brasileira),
e a LP real (`src/components/features/landing/*` — confirmados os mockups fake `MirrorMockup` e
`CareerMapMockup`, o CTA duplo e o visual escondido no mobile).

**Risco de produto já checado:** o onboarding (`CaptureLoopStep`) força input suficiente e
entrega um primeiro espelho ali mesmo. O dia 1 garante resultado mínimo, então a LP pode
prometer o espelho sem furar no primeiro uso.

## Decisão

Rebuild da LP em **11 seções**, contando a espinha dos 4 verbos com o pilar **Provas** presente,
liderando pela **dor** (não pela palavra "borogodó"), com **mídia real do produto** substituindo
os mockups fake em dois lugares cirúrgicos (demo do hero e card de Provas), **CTA único** pra
signup, e a **camada técnica de SEO/GEO** completa (JSON-LD, llms.txt, SSR, crawlers de IA).

A divisão de autoridade entre os dois materiais:
- **Issue #36 vence** em headline, voz, CTA único, ausência de depoimento fake, ausência de
  seção de preço dedicada.
- **Auditoria vence (absorvida)** na infraestrutura de SEO/GEO, na frase definitória front-loaded
  pra IA, e no reforço explícito de dois diferenciais: **Provas** e **propriedade do dado**
  ("seu, não da sua empresa").
- **Hub de conteúdo (blog/guias) e consenso off-site (Reddit/LinkedIn/PR) ficam FORA deste
  rebuild** — são uma trilha de GTM separada (ver "Próximo passo").

---

## A LP final, seção por seção

> Regra de voz (não-negociável, vale pra toda a copy): sem travessão; sem "não é X, é Y"; sem
> lista de três pra dar ritmo; sem frases emparelhadas; sem metáfora enfeitada. Voz de gente
> brasileira, direta, benefício em cada frase, mais informativa que vendedora. Tudo passa no
> teste "duvido que foi IA que escreveu".

> Preservar o craft visual atual: paleta oklch, Fraunces + Geist, e a temperatura cromática
> mudando por seção ao rolar. Rebuild de narrativa e estrutura, não de identidade visual.

### Seção 0 — Navbar
- Logo: borogodó (com a faísca no ó).
- Âncoras (scroll suave): Como funciona · Provas · Privacidade · Perguntas.
- À direita: **Entrar** (link discreto, não botão concorrente).
- UI: sticky, fundo transparente que ganha background ao rolar.
- **Mudança vs hoje:** hoje não há navegação âncora. Em página longa, âncora reduz bounce.
  O "Criar conta" sai da navbar pra não competir com o CTA do hero (CTA único).

### Seção 1 — Hero
- **Eyebrow (estilo dicionário, resolve a opacidade da palavra):**
  borogodó (substantivo): aquele quê que só você tem.
- **H1 (a dor, único H1 da página):**
  Você sabe trabalhar. Falar do seu trabalho é que trava.
- **Subheadline (carrega a frase definitória que SEO e GEO precisam, autocontida nos
  primeiros 200 palavras):**
  O Borogodó é a primeira inteligência de carreira com IA em português. Ele junta tudo que
  você já fez no trabalho, te mostra no que você é bom e por quê, e guarda com a prova junto.
  Quando você precisar falar de você, numa entrevista ou numa avaliação, a história já tá pronta.
- **CTA único:** Ver o meu borogodó. (leva a `/login?mode=signup`)
- **Microcopy abaixo do CTA:** É de graça. Em uns 5 minutos você já vê o primeiro resultado.
- **Linha de micro-trust:** Feito no Brasil · Seus dados são seus.
- **Visual / demo (MÍDIA REAL — substitui o `HeroVisual` desenhado à mão):**
  vídeo/animação curto e real do output do onboarding, mostrando a entrada bruta virando uma
  força **com a evidência citada**. Topo (o que a pessoa contou): "Organizei a força-tarefa
  na crise do servidor e alinhei os times em tempo real." Base (o que o Borogodó viu): força
  "Liderança sob pressão", com a linha de prova: você mesma contou: "alinhei os times em tempo
  real na crise do servidor".
- **Correção crítica:** o visual aparece **no mobile** (remover `hidden md:flex`). É onde mora
  o tráfego de LinkedIn.
- **Por quê:** o hero atual é forte de emoção mas sem keyword, esconde a demo no mobile, e a
  força mostrada não cita a evidência (que é o que prova que não é IA genérica).

### Seção 2 — Dores
- **Título:** Você já sabe que tem mais pra mostrar.
- **Dor 1 — Você entrega muito e o mundo vê pouco.** Tem anos de trabalho bom acumulado, mas
  quem não te acompanha de perto não faz ideia. O problema não tá no que você fez. Tá no fato
  de que isso nunca ficou registrado em lugar nenhum.
- **Dor 2 — Na hora de falar de você, dá branco.** Você sabe que segurou aquele projeto quase
  sozinha. Aí chega na conversa de avaliação e os detalhes somem. Fica sem o número, sem o
  exemplo, sem o argumento na mão.
- **Dor 3 — Você tem o que dizer, mas não sai.** A experiência tá toda aí. Transformar isso
  num texto que parece você falando, e não um robô, trava antes mesmo de começar.
- **Dor 4 — Você cresceu muito e não sabe explicar como.** Hoje você é uma profissional bem
  diferente da que começou. Mas essa evolução tá só na sua cabeça, sem forma e sem nome.
- **Por quê:** ancora o viés de recência (dor 2) e a tensão cultural brasileira, que nenhum
  concorrente gringo copia. Mantém as 4 dores da issue #36 (a auditoria cortava pra 3; as 4
  da #36 são mais afiadas e já estão na voz certa).

### Seção 3 — Como funciona (os 4 verbos, como jornada, não grid de cards)
- **Título:** Do silêncio ao "é isso que eu faço de melhor".
- **Descobrir** — "Eu não sabia que era boa nisso." Você conta o que fez, do seu jeito. O
  Borogodó acha a força que tava ali e você nem tinha percebido.
- **Entender** — "Agora vejo a forma da minha carreira." Suas forças aparecem organizadas por
  tipo, cada uma com o exemplo real que provou ela.
- **Provar** — "Tenho como comprovar." Toda força vem de algo que aconteceu de verdade. Quando
  não tem como comprovar, o Borogodó te pergunta em vez de inventar.
- **Usar** — "Sei mostrar do meu jeito." Numa entrevista, numa avaliação, num post. Você pega
  o que precisa e fala com as suas palavras.
- **Mídia:** ilustração/visual leve (NÃO screenshot). Acoplar 4 telas reais aqui envelhece
  rápido e é caro de manter.
- **Por quê:** substitui os "3 passos" genéricos e a promessa de currículo/portfólio (fora do
  v1). Cada heading carrega keyword natural (descobrir, entender, provar, usar, carreira).

### Seção 4 — Provas (NOVA, o diferencial; "Provas" é a palavra da Ohana nesta versão)
- **Título:** Não inventa. Mostra a prova.
- **Corpo:** IA generativa é boa em inventar coisa bonita sobre você. O Borogodó faz o
  contrário. Cada força que ele aponta nasce de algo que você registrou, e vem com a prova do
  lado. Se ele diz que você lidera bem na incerteza, é porque tem no seu registro três projetos
  de crise entregues no prazo e quatro feedbacks falando de "calma sob pressão". Quando falta
  prova pra sustentar uma força, ele te pergunta em vez de chutar.
- **Visual (MÍDIA REAL):** screenshot real do card de força com a linha "você mesma contou: …".
- **Por quê:** este é o maior diferencial competitivo (nenhum concorrente faz ancoragem
  anti-fabricação com rastreabilidade). A LP atual mostra a mecânica mas nunca a nomeia.
  Nomear é o que faz a pessoa lembrar e repetir pro colega.

### Seção 5 — Seu, não da sua empresa (NOVA, propriedade e privacidade)
- **Título:** Seu. Não da sua empresa.
- **Corpo:** Ferramentas de avaliação trabalham pro empregador. Existem pra alimentar a decisão
  de calibração e salário que a empresa controla, e quando você sai, o dado fica lá. O Borogodó
  trabalha pra você. Seu registro é privado e portátil, e ninguém da empresa lê. Na hora da
  avaliação corporativa, você copia o que quiser pro sistema deles. A fonte continua sua.
- **Ícones de confiança (inline):** Dados criptografados · Só você vê · Exportável quando quiser
  · Sem acesso do empregador.
- **Por quê:** posicionamento central que a Ohana pediu pra incorporar. É o gatilho de
  retenção mais forte ("toda vez que o RH pedir autoavaliação, lembre que o dado é deles, a não
  ser que você tenha o seu"). A LP atual não menciona isso uma vez.

### Seção 6 — Manifesto brasileiro (mantém o melhor da #36)
- **Título:** Mostrar o seu valor não é se gabar.
- **Corpo:** Lá fora ensinam a "se vender". Aqui no Brasil isso dá um desconforto danado, e tem
  razão de dar. Mostrar o seu borogodó é outra coisa. É deixar claro o que você já faz bem, com
  a prova do lado. O Borogodó faz a parte chata disso por você, sem floreio e sem aquele tom de
  IA que todo mundo reconhece de longe.

### Seção 7 — Prova social honesta (build-in-public, SEM depoimento fake)
- **Título:** Feito à vista de todos.
- **Corpo:** O Borogodó tá sendo construído no aberto por uma PM brasileira, que vai postando o
  processo conforme faz. Sem depoimento inventado e sem número de fachada. Se quiser ver como tá
  ficando, é só acompanhar.
- **Link:** Ver os bastidores. (LinkedIn da Ohana)
- **Por quê:** prova social é o maior elemento de conversão que falta. Sem depoimento real, a
  história da founder é o trust signal. A própria auditoria admite isso como caminho válido.
  Quando houver depoimento real, esta seção evolui pra ele.

### Seção 8 — Perguntas (FAQ; vira schema FAQPage)
- **Título:** Perguntas que todo mundo faz.
- **É de graça?** Pra começar, é. Você cria a conta e monta o seu primeiro borogodó sem pagar
  nada.
- **Como funciona na prática?** Você conta o que fez no trabalho, escrevendo, falando ou subindo
  um PDF. O Borogodó organiza, acha seus pontos fortes e guarda tudo com a prova junto.
- **A IA vai escrever por mim e ficar com cara de robô?** Não. Ela parte do que você contou e
  usa as suas palavras. Quando falta informação, ela pergunta em vez de inventar.
- **É diferente de pedir pro ChatGPT?** É. O ChatGPT não conhece a sua trajetória e gera texto
  genérico a partir de um prompt solto. O Borogodó parte do seu registro acumulado e mostra
  quem você é de verdade, com prova e na sua voz.
- **Meus dados ficam seguros?** Ficam. Só você vê o seu borogodó, e nada sai pra lugar nenhum
  sem você mandar. Sua empresa não vê o que você registra.
- **Preciso escrever muito pra valer a pena?** Não. Dá pra começar com uma coisa pequena que
  você fez essa semana e ir somando no seu ritmo.
- **Por quê:** FAQ é o bloco de maior impacto em GEO (formato pergunta-resposta é o que IA
  extrai melhor) e em conversão pra produto novo (responde objeção sem fazer procurar).

### Seção 9 — CTA final (mantém)
- **Título:** O seu borogodó já existe.
- **Sub:** Você só ainda não viu ele inteiro. Começa de graça e leva uns 5 minutos.
- **CTA único:** Ver o meu borogodó.

### Seção 10 — Rodapé (mantém o contato humano da 020)
- Manter o `ContactCard` (e-mail copiável, LinkedIn, SLA) já entregue na 020.
- Adicionar: "Borogodó · feito no Brasil · 2026". Espaço reservado pra links de conteúdo
  (blog/guias) quando a trilha de GTM existir.

---

## Camada técnica de SEO/GEO (absorvida da auditoria)

- **Um H1 só** (o headline da dor). H2 por seção, H3 dentro.
- **JSON-LD no `<head>`:** `SoftwareApplication` + `Organization` + `FAQPage` (este gerado a
  partir da Seção 8).
- **`llms.txt` na raiz do domínio** com definição autocontida, diferenciais (anti-fabricação,
  propriedade do dado, voz autêntica, nativo PT-BR), público, preço e links.
- **SSR garantido** (a LP não pode depender de JS client-side pra renderizar conteúdo, senão
  crawlers e bots de IA não veem nada).
- **Crawlers de IA liberados:** conferir `robots.txt`/Cloudflare pra GPTBot, PerplexityBot,
  ChatGPT-User.
- **Meta tags humanas:**
  - `<title>`: Borogodó: descubra no que você é bom e aprenda a mostrar
  - `description`: O Borogodó organiza o que você já fez no trabalho, mostra seus pontos fortes
    com a prova junto e te ajuda a falar do seu valor sem travar. Comece de graça.
  - `og:title`: Você sabe trabalhar. Falar do seu trabalho é que trava.
  - `og:description`: O Borogodó mostra no que você é bom, com a prova do lado e na sua voz. De
    graça pra começar.
  - `og:image`: a imagem do card de borogodó com a prova (o anúncio grátis do canal).
  - `og:locale`: pt_BR · `twitter:card`: summary_large_image.

## Decisão de mídia real (a restrição nova da Ohana)

Trocar mockup fake por mídia real **só onde o ROI paga o custo de manutenção**:

| Bloco | Mídia | Decisão |
|---|---|---|
| Demo do hero | vídeo/animação real do output do onboarding | **SIM** — é o aha, maior ROI |
| Seção Provas | screenshot real do card de força com evidência citada | **SIM** — é o diferencial |
| Como funciona (4 verbos) | ilustração leve | **NÃO** vira screenshot (acopla 4 telas, envelhece) |
| Mapa de carreira (`CareerMapMockup`) | — | **CORTAR** (o "mapa" saiu da narrativa; não recriar fake) |

Trade-off aceito: screenshot real amarra a LP à UI atual (mexemos na navegação na 021). Por
isso a mídia real fica restrita a 2 peças estáveis, e atualizá-las entra no checklist de todo
redesign de produto futuro.

## Alternativas consideradas

- **A — Só a issue #36, ignorar a auditoria.** Voz consistente, zero retrabalho, mas deixa na
  mesa ganhos reais de SEO/GEO técnico. Rejeitada: a auditoria tem pesquisa que vale absorver.
- **B — Adotar a auditoria por cima da #36.** Rejeitada: ela recomenda manter "borogodó" como
  H1 (palavra opaca derrubada de propósito), adicionar depoimento (não existe nenhum real), e
  a copy dela viola a regra de voz em quase todo parágrafo.
- **C — Mescla com autoridade dividida (ESCOLHIDA).** #36 manda em narrativa/voz; auditoria
  entra como camada técnica + reforço de diferenciais; mídia real troca os mockups.

## Por que esta (e o steelman do oposto)

A #36 já resolveu o difícil (posicionamento, voz, headline da dor, honestidade). A auditoria é
forte exatamente onde a #36 foi rasa (SEO/GEO técnico) e reforça dois diferenciais que a Ohana
quer em destaque (Provas e propriedade do dado). Mesclar pega o melhor sem contaminar a voz.

**Steelman do oposto (manter "Todo mundo tem um borogodó" como H1, jeito da auditoria):** a
palavra é proprietária, memorável e carrega a marca inteira; liderar pela dor pode soar como
mais um SaaS de carreira e perder o que diferencia. **Por que ainda assim lidero pela dor:**
"borogodó" tem busca zero e é opaco pro tráfego frio; o teste dos 5 segundos importa mais do
que a marca na primeira dobra, e a palavra é recuperada logo abaixo no eyebrow estilo dicionário.
Se a conversão provar o contrário, a headline da marca é a primeira candidata de A/B (a própria
#36 já lista as variantes).

## Riscos e o que os mitiga

1. **A UI real não estar digna de palco** (mockup fake você controla 100%; screenshot real
   expõe o que existe). **Mitiga:** antes de produzir qualquer mídia, olhar o output real do
   onboarding/Espelho e julgar se a força aparece com a evidência citada de forma limpa. Se não,
   polir a tela primeiro, ou segurar a mídia real só no hero.
2. **Headline da dor converter pior que a marca.** **Mitiga:** A/B com as variantes da #36 após
   ter volume.
3. **Mídia real envelhecer a cada redesign.** **Mitiga:** limitar a 2 peças estáveis + item no
   checklist de redesign.

## Como saber se acertamos

- Métrica primária: **taxa de conversão visita → conta criada → primeiro borogodó concluído.**
- Secundária: conversão dos links postados (LinkedIn) e indexação/citação por motores de IA em
  queries de teste após ~60 dias.
- Reavaliar a headline se a conversão hero → signup ficar abaixo de ~2–3%.

## Próximo passo

Faixa A (correções objetivas, sem ambiguidade de produto) pode virar PR pequeno já: mostrar o
visual no mobile, CTA único, remover promessa de currículo/portfólio, meta/OG humanas.

Faixa B (rebuild de narrativa) segue o fluxo formal a partir deste record:

```
/speckit-specify "Rebuild da landing page do Borogodó em 11 seções contando a espinha dos 4
verbos (Descobrir, Entender, Provar, Usar) com o pilar Provas presente, liderando pela dor
(headline 'Você sabe trabalhar. Falar do seu trabalho é que trava.') com 'borogodó' recuperado
em eyebrow estilo dicionário. Inclui seção de propriedade do dado ('seu, não da sua empresa'),
manifesto brasileiro, prova social via build-in-public (sem depoimento fake), FAQ com schema
FAQPage, CTA único pra signup. Substituir os mockups fake (MirrorMockup, CareerMapMockup) por
mídia real do produto em dois lugares: demo do hero (output do onboarding com evidência citada)
e card da seção Provas. Camada técnica: H1 único, JSON-LD (SoftwareApplication + Organization +
FAQPage), llms.txt, SSR, crawlers de IA liberados, meta/OG humanas. Preservar o craft visual
atual (oklch, Fraunces, temperatura cromática por seção). Copy obedece a regra de voz: sem
travessão, sem 'não é X, é Y', sem lista de três, sem metáfora enfeitada."
```

Depois: `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/impeccable shape` antes de
codar → `/impeccable audit` + `web-design-guidelines` antes do PR.

**Fora deste rebuild (trilha de GTM separada, não bloqueia a LP):** hub de conteúdo cornerstone
(brag document em PT, guia de autoavaliação, comparações Borogodó vs ChatGPT/Notion) e consenso
off-site (Reddit, cadência de LinkedIn, Product Hunt, PR). Vale virar issues próprias.
