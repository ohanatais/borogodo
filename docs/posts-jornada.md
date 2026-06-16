# Jornada Build-in-Public — Borogodó

Registro dos posts da série "PM autodidata na era da IA" e da estratégia por trás
deles. Objetivo duplo: (1) manter consistência de tom e arco entre os episódios;
(2) servir de case real para a futura feature de geração de conteúdo do produto
(quality in = quality out: bons posts aqui viram bom material de exemplo lá).

---

## Status atual e como retomar (handoff pra novo chat)

Onde paramos (atualizado nesta sessão):
- Episódio 01: publicado.
- Episódios 02, 03 e 04: fechados e prontos (texto final na seção "Posts finais").
- Próximos a escrever: Episódio 05 (a IA que concorda demais) e Episódio 06 (o dilema
  de quando lançar). Resumo de cada um no "Backlog".

Pra retomar em outro chat, basta dizer: "leia docs/posts-jornada.md e vamos continuar
a série de posts". As regras e o contexto estão todos aqui neste arquivo.

Regras de escrita (importantes, não esquecer):
- Sem travessão. Usar vírgula, conector ou parênteses no lugar.
- Sem jargão de IA e sem figuras de linguagem de IA.
- Sem a antítese "não é X, é Y" (estrutura típica de IA). Preferir narrativa natural.
- Tom de diário profissional, na voz da Ohana (casual, caloroso, autodepreciativo na
  medida, emojis com parcimônia, CAPS pra dar ênfase em palavras pontuais).
- Cada post fecha com uma virada honesta ou uma pergunta aberta, nunca com lacinho.

---

## Track de publicações e performance

| Post | Dia | Horário | Impressões | Likes | Coments | Imagem | Observações |
|---|---|---|---|---|---|---|---|
| Pré-série: PR PostHog + GTM | ~2 semanas atrás | n/d | 841 | 15 | 1 | sim (print do PR) | post de trabalho |
| Pré-série: pasta Downloads | ~2 semanas atrás | n/d | 866 | 19 | 3 | sim (print do Finder) | tema leve e relacionável |
| Ep 01: PM autodidata na era da IA | segunda passada | ~10h | 838 | 19 | n/d | n/d | melhor da série, formato manifesto |
| Ep 02: virei meu próprio stakeholder | segunda | 11h30 | 221 | 2 | n/d | não | só texto, introspectivo, queda forte |
| Ep 03: nome brasileiro (com molho) | terça | (preencher) | (preencher) | (preencher) | (preencher) | não | só texto |
| Ep 04: não tinha conta no GitHub | quarta (hoje) | 8h30 | 38 (parcial) | 0 (parcial) | n/d | não | só texto, horário fraco, medido cedo |

> Colunas "(preencher)" são pra Ohana completar quando tiver os números fechados.

Leitura dos dados (até agora):
- Os 3 melhores tinham imagem; os 3 fracos são só texto. Queda de alcance de ~4x. Imagem
  parece ser o maior lever, e é dado próprio.
- Passar de semanal pra diário derrubou o alcance. No LinkedIn, post fraco entrega o
  próximo pra menos gente, então postar todo dia com base pequena vira cascata pra baixo.
- Trocar o horário a cada dia (8h30 num dia, 11h30 noutro) impede de ler sinal. O Ep 01,
  o melhor, saiu segunda ~10h.

Hipóteses a testar nos próximos (uma variável de cada vez):
1. Colocar imagem em todo post (print de terminal, docs, card com a frase, foto do processo).
2. Voltar pra 2x por semana (ex.: terça e quinta), deixando cada post respirar 48h.
3. Fixar horário ~10h-11h, terça a quinta, por algumas semanas antes de mexer.
4. Gancho de primeira linha mais largo (que pega além de PM) + mais valor/takeaway por post.

---

## Estratégia da série

### Posts = ecossistema de repos (build-from-zero)

Os episódios são a versão narrativa dos repos do ecossistema. Cada fase da jornada
alimenta um repo. Só product-thinking está pronto hoje.

| Fase da jornada | Repo de destino | Status do repo |
|---|---|---|
| Ideia, pesquisa, posicionamento, PRD | product-thinking | pronto |
| Nome e identidade | brand-and-copy | a fazer |
| Construir com IA sendo não-técnica | build-with-claude | a fazer |
| Lançamento, primeiros usuários | go-to-market | a fazer |

Disciplina: não prometer repo que ainda não existe (mesma regra da landing). Plantar a
missão/pergunta agora, plugar o repo só quando ele existir.

### Regra de sigilo

Pode revelar a área (carreira/profissional) e a tese. Segura nome, escopo fino e
mecânica. O sigilo é nomeado dentro da narrativa (ex.: "tô guardando o nome de
propósito"), pra virar promessa e não enrolação. O reveal do nome acontece num marco
(landing/waitlist no ar, produto funcionando), não numa data.

### Paleta de tons (pra não soar tudo igual)

- Confissão: vulnerável e engraçado. Erros e vergonhas. (ex.: o Ep 04)
- Ensaio: profundo, humor mínimo. Uma decisão de produto não-óbvia, defendida.
- Lampejo: leve, curtíssimo. Um insight só.
- Bastidor: tempo real. O dilema vivido agora, sem resposta pronta.

### Horários de publicação (LinkedIn, fuso de Brasília)

Melhor janela geral: terça a quinta, 10h às 14h, com 11h sendo pico. Segunda começa
fraca de manhã (evitar antes das 9h), melhora a partir das 10h. Estar online na
primeira hora depois de postar (responder cedo puxa alcance). Anotar horário e números
de cada post pra achar o melhor horário com dados próprios.

Plano de postagem: Ep 02 na segunda (testado ~11h30), Ep 03 na terça (~11h, mantendo
horário parecido pra isolar o efeito do dia da semana).

---

## Runway da semana (seg–sex)

| Dia | Episódio | Registro | Repo |
|---|---|---|---|
| Seg | 02: O dia em que virei meu próprio stakeholder | Ensaio | product-thinking |
| Ter | 03: Caçando um nome brasileiro (com molho) | Confissão leve | brand-and-copy |
| Qua | 04: Eu não tinha nem conta no GitHub | Confissão (humor) | build-with-claude |
| Qui | 05: A IA que concorda demais é cilada | Ensaio | build-with-claude |
| Sex | 06: Tô travada em quando lançar | Bastidor (tempo real) | go-to-market |

Nota: o Ep 04 mudou de tema. Antes seria o "CI verde que mentia" (testes); virou a
história do pavor de setup e do não ter conta no GitHub. O CI verde virou episódio
futuro (ver backlog). Guardados também: Lampejo "métrica é convite" e o Balanço.

---

## Posts finais

### Episódio 01 (publicado)

PM autodidata na era da IA: Episódio 01 🎬

Decidi criar meu primeiro produto digital solo. Antes eu nem cogitava usar meu precioso
tempo fora do trabalho com isso, mas a necessidade de buscar mais liberdade falou mais
alto. E tem outra: no meu dia a dia como PM, eu costumo "gerenciar" e olhar por diversas
lentes (marketing, design, engenharia...). Por mais que eu entenda o papel de todos, me
pego sentindo falta de entender exatamente como é sentar na cadeira deles. Como eu tenho
pavor de ter que assistir a cursos sem nem saber se vão me ajudar de fato, e como
descobri que aprendo MUITO mais na prática, não tinha muito como fugir disso, né? 🤷‍♀️
Tô muito curiosa pra saber exatamente como é ser um Product Builder e um Vibe Coder hoje.
E sim, o produto vai ser AI-based e AI-driven, ou seja, me colocando à prova pra entender
tudo isso profundamente (especialista que diz? amém 🙏) Vou compartilhar essa "novela"
publicamente para registrar a evolução, os insights, as ferramentas, o que deu muito
certo e o que ficou uma bosta absoluta. Let's see como que vai desenrolar esse negócio?
Próximos episódios estão no forninho...

### Episódio 02 (final)

🎬 Episódio 02: O dia em que virei meu próprio stakeholder

Tem uma dor que meus stakeholders sentem faz anos, e que eu só fui sentir semana passada.

O PM vê o produto fazer sentido na cabeça muito antes de existir uma tela, já quem está
de fora não tem essa visão. Ou seja, confiar em um caminho que ainda não dá pra ver, que
não é palpável, pesa. Dessa vez, quem estava de "fora" era eu.

Comecei meu primeiro produto como mandava o figurino: pesquisa e análise de mercado. Meu
instinto foi focar no público global e ser inglês-first (mais alcance, mais receita), mas
conforme eu pesquisava (com o Cláudio me confrontando), percebi que a dor é mais crua e
latente aqui no Brasil, e que quase ninguém resolve exatamente o que estou buscando por
aqui.

Então decidi começar em casa, já que esse primeiro produto é, acima de tudo, aprendizado
e, de quebra, fica mais fácil lançar, testar e iterar.

Até aqui, a decisão foi fácil de escrever. O difícil veio depois.

Eu, com três documentos de pesquisa e nenhuma tela, senti uma vontade quase FÍSICA de
desenhar e shipar qualquer coisa, só pra ter algo palpável, algo que mostrasse que eu
tinha escolhido o caminho certo, algo que provasse que eu estava andando.

A ficha caiu alguns dias depois: continuar sem nada visível não queria dizer que eu
estava perdida. Na verdade, querer criar o produto antes da fundação estar 100% definida
era pura ansiedade, me empurrando a fazer qualquer coisa só pra sentir que eu estava no
caminho certo.

### Episódio 03 (final)

> Título: "Caçando um nome brasileiro (com molho)". A Ohana floou "(com o molho)"; o
> "com molho" soa um tiquinho mais natural. Trocar é fio de cabelo, escolha dela.

🎬 Episódio 03: Caçando um nome brasileiro (com molho)

Existe um jeito um tanto que preguiçoso de fazer uma marca parecer brasileira: bota
verde, amarelo e um tucano, e tá resolvido. Eu queria o contrário disso.

Marca é a parte que eu curto e julgo extremamente importante, então me joguei. Precisava
de um nome:

• fácil de falar no telefone;
• que arrancasse um sorriso;
• que tivesse essência brasileira, sem virar Brasil de cartão postal.

Foram listas e mais listas de nomes, dezenas de opções testadas, e checagem de domínio e
marca em cada uma. Vários nomes ótimos caíram porque já existiam. Foi cansativo e cheguei
a achar que nunca ia encontrar um nome bom de verdade, mas... no fim, cheguei numa palavra
que eu não troco por nada. Ela é muito NOSSA, tem charme, e diz o que o produto faz quase
sem precisar explicar 🤩

O lado ruim? Sinto ter que decepcioná-los nesse momento, mas vou segurar o nome mais um
pouquinho 🤏 Não é suspense à toa, é que ele é bom demais pra aparecer pela primeira vez
num post, e vale muito a pena soltar ele junto com o produto de pé, funcionando, e ter a
obra completa.

No fim, brasilidade boa pra mim é isso: o jeito como a coisa soa, o que ela escolhe
valorizar, o sorriso que arranca de quem ouve. É suingue, é molho, é aquele quê que
ninguém explica, mas todo mundo sente.

### Episódio 04 (final)

🎬 Episódio 04: Eu não tinha nem conta no GitHub

Tem uma diferença GRANDE entre saber o que construir e saber construir, e nas últimas
semanas eu senti essa diferença na pele. Eu tinha o produto inteiro na cabeça, mas não
sabia colocar UMA única coisa no ar.

Pra você ter ideia do meu ponto de partida: eu não tinha nem conta própria no GitHub (só
a da empresa, onde aprendi o kit de sobrevivência de pipeline e olhe lá 🫠). E como é que
eu ia saber o que era rodar uma migration no Supabase, ou como chegar no SQL? Supabase,
Vercel, deploy, env...

E PIOR: o que diabos é npm run dev? cd não sei o quê? SOCORRO 😭

Aí eu fiz a única coisa que eu sabia fazer: perguntar. MUITO. Tipo "Cláudio, onde é que
eu pego essa key?" e "pera ai, me explica o que é migration e como faço isso?", "gera o
comando pro terminal pra mim", umas 50 vezes 😂

E é assim que eu tô aprendendo: na hora, clicando no botão errado e depois, no certo.
Nada de curso antes pra "me preparar" (vocês já sabem do meu pavor de curso lá do
Episódio 01).

Agora, não paro de me perguntar: se foi assustador pra mim, que já tenho uma bagagem
técnica leve e 6 anos de produto na veia, como é que tá sendo pra quem tá vibe codando do
zero total, sem conceito técnico, de produto, de design, de marketing... Como dar pra
essa galera um chão mais firme?

---

## Backlog de próximos episódios

### Ep 05: A IA que concorda demais é cilada · Ensaio · build-with-claude
Pra quem aprende, IA que concorda rápido valida premissa errada com confiança. Configurar
ela pra contrapor com fundamento. Plot: a crise que parecia pedir pivô era o produto
pedindo clareza (não pivotei, entendi). Registro em docs/aprendizados.md (2026-06-13).

### Ep 06: Tô travada em quando lançar · Bastidor · go-to-market
Dilema real e atual: produto acessível mas sem analytics, sem conteúdo, LP promete o que
não existe. Medo de lançar cedo demais e tarde demais. A ideia: tratar lançamento como
botão de volume (beta fechado primeiro), não penhasco.

### Identidade visual · brand-and-copy
Continuação do Ep 03. A paleta fora do clichê (roxo-jambo, coral, mel, verde-água,
creme, nada de verde-amarelo), o acento que virou faísca, a faísca como o instante da
descoberta. Cuidado pra não revelar a tese do produto cedo demais.

### O selo verde que mentia (CI) · Confissão · build-with-claude
Era o antigo Ep 04. O CI ficou "verde" por duas features inteiras sem rodar teste nenhum
(flag que não quebra quando não tem o que rodar). Lição: "tá passando" não é "tá sendo
testado". Abre o log. Registro em docs/aprendizados.md (2026-06-07).

### Lampejo: métrica é convite, não cobrança · Lampejo · product-thinking
Brasilidade de substância: no Brasil, ausência de métrica costuma ser contexto, não
incompetência. O produto convida a quantificar com leveza, aceita o gap sem punir.
Registro em docs/aprendizados.md (2026-06-13).

### Speckit: uma ferramenta não segura o produto inteiro · Confissão/Ensaio · build-with-claude
Nota técnica da Ohana: speckit sozinho não segura a jornada (cabe ~3-5 user stories por
ciclo). O modelo certo é em camadas:
- o epic plan (doc no main) trava a fundação compartilhada que garante consistência entre
  features;
- cada elo (013, 014, 015) roda seu próprio speckit, e o Constitution Check do
  /speckit-plan garante consistência técnica dentro dele;
- /impeccable shape por feature + o design.json compartilhado garantem UI/UX coerente.
Roda speckit por elo, com o plano de cima coordenando. Ângulo do post: "achei que uma
ferramenta resolveria tudo, e aprendi a empilhar as camadas certas."

### Balanço: o que deu certo e o que ficou uma bosta · Confissão
Fecho de temporada: cortar escopo, aprender na marra, configurar a IA pra confrontar
(bom); espelho clichê, duplicatas em dois idiomas, corrigir código não limpa dado antigo
(ruim). Lição: simular o resultado na mão antes de codar.
