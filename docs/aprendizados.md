# Aprendizados — construindo o Borogodó

Registro dos momentos em que algo me surpreendeu, destravou ou exigiu uma decisão
não-óbvia durante o desenvolvimento. Não é changelog técnico (isso já está nos commits
e PRs) — é o "isso eu não esperava" em linguagem simples, pensado para virar conteúdo
real no ecossistema (`build-with-claude`, `product-thinking`) quando fizer sentido.

## Como usar

- Um aprendizado entra aqui quando vale a pena lembrar depois — não tudo que acontece
  numa sessão merece registro.
- Formato: data, o que aconteceu, o que aprendi, por que importa.
- Quando um aprendizado amadurecer o suficiente para virar conteúdo público, ele migra
  (manualmente, por decisão da Ohana) para o repo do ecossistema correspondente.

---

## 2026-06-07 — Um CI "verde" pode estar verde porque não está testando nada

**O que aconteceu:** o PR #6 começou a falhar no CI com 6 testes quebrados, e a
pergunta natural foi "por que só agora, se os PRs anteriores passaram?". Investigando,
descobri que o `package.json` nunca teve um script `test` antes desta feature. O passo
de CI rodava `npm test --if-present` — a flag `--if-present` faz o comando simplesmente
não fazer nada (e retornar sucesso) quando o script não existe. Ou seja: **o CI estava
"passando" há duas features inteiras sem nunca ter executado um teste sequer**. Os 6
testes que falharam agora sempre estiveram quebrados — só nunca tinham sido rodados de
verdade. Corrigi os 6 (eram bugs nos próprios testes: faltava mockar `IntersectionObserver`
no jsdom para o Framer Motion, e um teste de cadastro não preenchia o campo de confirmar
senha) e fechei as issues #4 e #5.

**O que aprendi:** "está verde" não é a mesma coisa que "está sendo testado". Um pipeline
de CI pode reportar sucesso de boa-fé enquanto pula silenciosamente a parte mais
importante — e isso é mais comum do que parece, porque flags como `--if-present` existem
justamente para "não quebrar quando não tem nada para rodar", o que é ótimo... até o dia
em que você espera que aquilo rode. Vale a pena, de tempos em tempos, abrir o log do CI e
confirmar que cada etapa está fazendo o que você acha que está fazendo — não só olhar o
selo verde.

**Por que importa:** esse é o tipo de armadilha que ninguém ensina a procurar — porque
"deu certo" é exatamente o sinal que nos faz parar de olhar. Para quem está aprendendo a
configurar CI pela primeira vez, vale mostrar como ler o log de uma execução "bem
sucedida" e confirmar que ela rodou o que deveria, não só que terminou sem erro.

---

## 2026-06-07 — Branches "esquecidas" deixam o repo parecer mais bagunçado do que é

**O que aconteceu:** revisei a estrutura do repo e apontei o README e o CLAUDE.md raiz
como desatualizados — pareciam um sintoma de bagunça. Na investigação seguinte, descobri
que ambos já tinham sido corrigidos na `main` (PR mergeado antes), só que minha branch de
trabalho (`003-capture-pipeline`) tinha sido criada *antes* desse merge, então ainda
carregava as versões antigas.

**O que aprendi:** "o código está desatualizado" e "o código está bagunçado" são
diagnósticos diferentes — o primeiro geralmente é só uma branch que ficou para trás, e se
resolve com um merge, não com retrabalho. Antes de classificar algo como problema
estrutural, vale checar se aquilo já não foi resolvido em outro lugar (`git log --all`,
`git branch --contains`).

**Por que importa:** para quem está aprendendo a trabalhar com branches pela primeira
vez, esse é exatamente o tipo de momento que gera pânico desnecessário ("meu repo virou
bagunça!") quando na real é só falta de sincronizar. Bom material para explicar branches
de um jeito que reduz ansiedade.

---

## 2026-06-07 — Ferramentas de medição também têm bugs (e isso não significa que o código está errado)

**O que aconteceu:** o relatório de cobertura de testes não mostrava o arquivo da rota
`enrich/[id]` — parecia que o código não estava sendo testado. Investigando, descobri que
era um bug cosmético do *reporter* de texto do Vitest com pastas de nome entre colchetes
(`[id]`, convenção do Next.js para rotas dinâmicas). Trocando para outro formato de
relatório (`json-summary`), a cobertura aparecia corretamente — 100%.

**O que aprendi:** quando uma ferramenta de medição mostra um resultado estranho, a
primeira pergunta não deveria ser "o que eu fiz de errado", e sim "será que é a
ferramenta que está com dificuldade de mostrar isso". Confirmar com uma segunda fonte
(outro reporter, outro comando) antes de mexer no código é mais barato do que sair
"corrigindo" algo que já estava certo.

**Por que importa:** para quem não é técnico, um número "errado" na tela costuma soar
como "eu quebrei algo". Vale mostrar que isso também acontece com gente experiente, e
que checar a ferramenta antes de duvidar do trabalho é uma habilidade, não uma desculpa.

---

## 2026-06-13 — `/pr-review` e `/verify` enxergam coisas diferentes, e isso não é redundância

**O que aconteceu:** o `/pr-review` (6 subagentes lendo o diff do PR #8) aprovou as
mudanças sem apontar nada crítico. Em seguida, ao rodar `/verify` — criando uma conta de
teste real, logando no `/painel` e disparando `/api/capture` de verdade, em pt-BR e em
inglês — apareceu um problema que nenhum dos subagentes de review tinha visto: o
placeholder do composer agora respeitava o idioma do usuário (era exatamente o que o PR
corrigia), mas as mensagens de erro da própria `/api/capture` ("Conta um pouco mais...",
"Tipo de captura inválido" etc.) continuavam fixas em pt-BR, mesmo com o cookie
`NEXT_LOCALE=en`. Resultado: um usuário em inglês via a tela toda em inglês, mas qualquer
erro de captura aparecia em português — uma inconsistência que só fica visível
*executando* o fluxo nos dois idiomas, não lendo o código.

**O que aprendi:** revisão de código (estática, lendo o diff) responde "esse código está
correto, isolado?" — e o `/pr-review` fez exatamente isso bem. Verificação em runtime
(`/verify`) responde uma pergunta diferente: "a experiência, de ponta a ponta, é
coerente?". As mensagens de erro nem tinham mudado no diff — por isso nenhum revisor de
código tinha motivo para olhar para elas. Só apareceram como problema quando colocadas ao
lado do que *tinha* mudado. Um passo não substitui o outro: cada um tem um ângulo cego
que é exatamente o ponto forte do outro.

**Por que importa:** para quem está montando um processo de revisão, é tentador pensar
"já passou no review, não precisa rodar de verdade" (ou o contrário). Esse caso mostra um
exemplo concreto e pequeno de um bug que só existe na junção das duas mudanças — uma
delas nem estava no PR. Bom exemplo para `product-thinking`: "funciona" e "a jornada faz
sentido" são perguntas diferentes, e a segunda só se responde usando o produto.

---

## 2026-06-13 — `next-intl`: o idioma da requisição não chega nas Route Handlers

**O que aconteceu:** ao corrigir o placeholder do composer para respeitar o idioma
(`getTranslations` + cookie `NEXT_LOCALE`), funcionou de primeira no `/painel` (uma
página). Mas a mesma chamada `getTranslations()` dentro de `/api/capture/route.ts` (uma
Route Handler) sempre voltava em pt-BR, mesmo com `NEXT_LOCALE=en`. Olhando o código-fonte
do `next-intl`, o idioma da requisição (`requestLocale`) é lido de um header
(`X-NEXT-INTL-LOCALE`) que o *middleware* do next-intl injeta — e este projeto não tem
`middleware.ts` (usa `localePrefix: 'never'` e negocia o idioma só na renderização de
páginas, via o plugin do Next). Route Handlers nunca recebem esse header, então
`getTranslations()` cai silenciosamente no idioma padrão (pt-BR), pra sempre, em qualquer
rota de API.

**O que aprendi:** "internacionalizei a tela" e "internacionalizei o produto" não são a
mesma garantia quando a tela e a API são coisas tecnicamente separadas — mesmo
compartilhando a mesma lib de i18n. A correção (ler o cookie `NEXT_LOCALE` direto via
`cookies()` e passar `{ locale, namespace }` para `getTranslations`) é simples, mas só
aparece se alguém testar especificamente "uma chamada de API responde no idioma certo?".

**Por que importa:** qualquer rota de API nova que devolva texto para o usuário vai cair
nessa mesma armadilha por padrão. Vale documentar esse padrão (`getApiErrors()` em
`src/app/api/capture/route.ts`) como referência para a próxima rota que precisar de i18n,
e considerar extrair para um helper compartilhado quando a segunda rota precisar disso.

---

## 2026-06-13 — O nome do produto já continha a estratégia (e o "pivô" não era pivô)

**O que aconteceu:** numa sessão que começou como "reorganizar a UI do painel", a conversa
escalou para "qual é a estratégia do produto". Três coisas se acumularam: (1) o output da IA
do espelho estava clichê ("você transforma ambiguidade em entrega concreta"), (2) a ideia de
vincular artefatos de evidência (reviews, protótipos, sites) à história de carreira, e (3)
uma crítica honesta de que o produto, como vitamina de autoconhecimento, tinha um problema de
retenção (você não volta toda semana pra rever quem você é). Ao tentar reposicionar para "base
de evidências que paga nos momentos de carreira", parecia que íamos pivotar o produto. Até
perceber que o nome — Borogodó, "aquilo em que você é bom sem saber nomear" — já continha
quatro movimentos: **Descobrir, Entender, Provar e Usar** o seu borogodó. O reposicionamento
não era pivô; era a marca levada a sério (borogodó guardado não serve de nada — existe pra ser
usado).

**O que aprendi:** quando um produto tem um nome forte e carregado de sentido, esse nome
costuma já conter a estrutura da proposta de valor — vale "interrogar o nome" antes de inventar
framework novo. Os quatro verbos não foram criados, foram extraídos do que a palavra já
significava. E resolveram de uma vez quatro problemas que pareciam separados: clichê (Provar =
evidência mata o genérico), retenção (Usar = motivo de voltar nos momentos de carreira), os
dois jobs do produto (introspecção vs. projeção, ambos contidos no nome) e a brasilidade
(mostrar sem se gabar é o antídoto cultural, não um recurso). A disciplina de founder aqui foi
não aceitar de cara a ideia mais brilhante (o álbum de artefatos) e perguntar primeiro "o que
precisa estar sólido antes disso" — a fundação (a inteligência que classifica bem) é o produto;
o álbum pendura nela.

**Por que importa:** é um caso forte de `product-thinking` — a diferença entre *inventar*
posicionamento e *descobrir* o que já estava ali. Para quem constrói, mostra que uma crise
aparente ("preciso pivotar?") pode ser o produto pedindo pra ser ele mesmo com mais clareza. E
vira a base de toda a mensagem futura (LP, marketing, vendas), por isso foi persistido em
`product-context.md` (produto) e `docs/marca.md` (mensagem).

---

## 2026-06-13 — Para quem não é técnica, concordância é um risco: o Claude precisa contrapor

**O que aconteceu:** numa sessão longa de produto e design, várias ideias minhas (Ohana) que
pareciam ótimas teriam virado caminho ruim se o Claude tivesse só concordado: login com LinkedIn
que não traz dado rico, transformar artefatos de evidência num quase-pivô antes da fundação
estar pronta, tratar três "cores" do produto como peso igual (dispersão), público amplo demais
cedo demais, e um espelho que soava clichê. Em cada um, ele contrapôs com análise e pesquisa
antes de aceitar, e o resultado ficou melhor.

**O que aprendi:** quem é PM e não-técnica corre um risco específico: a IA que concorda rápido
parece prestativa, mas valida premissa errada com confiança, e isso custa caro (retrabalho,
pivôs, features fadadas). O valor real está no pushback honesto e de alto nível: questionar a
premissa, apontar o risco, estudar antes de assumir. "Discordar com fundamento" é mais útil que
"executar rápido". Virou regra de trabalho no `.claude/CLAUDE.md`.

**Por que importa:** é um dos aprendizados centrais de `build-with-claude` pra não-devs: configure
o Claude como par crítico, não executor obediente. É a diferença entre um produto que sobrevive e
um que falha bonito.

---

## 2026-06-13 — Validar "à mão" antes de codar pega o que o código esconderia

**O que aconteceu:** antes de escrever uma linha do novo espelho, o Claude "rodou o prompt na
mão" (fez o papel do modelo contra os exemplos-ouro e gerou as saídas). Isso, de graça, pegou
problemas que só apareceriam depois de implementado: a pergunta de fechamento virando fôrma
repetida (novo tell), o exagero na regra do "Você", a falta de brasilidade, e até o fato de que o
prompt atual ensina o travessão (o tell que a gente quer matar) no próprio exemplo.

**O que aprendi:** num produto onde o valor é gosto (a revelação emociona ou não?), o teste mais
barato e mais decisivo é simular o output à mão contra exemplos-padrão, antes de qualquer código.
E parte da qualidade de voz (sem travessão, sem buzzword, sem antítese) vira **teste
determinístico** — assert barato no CI. Dá pra encurralar slop com regex.

**Por que importa:** inverte a ordem natural ("codar e ver"). Pra features de IA, validar a régua
antes economiza dias e evita escalar clichê. Bom material de `build-with-claude`.

---

## 2026-06-13 — "Sem métrica" no Brasil costuma ser contexto, não incompetência

**O que aconteceu:** ao desenhar como o espelho mostra força, a tentação era exigir número
(impacto quantificado, como recrutador gringo valoriza). Mas muita empresa BR não é gerida por
dado e muito PM/PO atua apagando incêndio, então a ausência de métrica quase sempre é do contexto,
não da pessoa. Viramos a regra: métrica é **convite, não cobrança** (a IA convida a quantificar
uma vez, com leveza, aceita o gap sem punir, e nunca inventa número).

**O que aprendi:** brasilidade de verdade não é gíria por cima, é o que você decide enxergar como
força. Importar a régua data-driven gringa sem traduzir o contexto faz o produto julgar justo quem
mais precisa dele. O mesmo vale pra caminho não-linear (RH→QA→produto) e versatilidade na escassez:
força, não falta de foco.

**Por que importa:** é o fosso de marca (brasilidade de substância) e um princípio de produto que
cruza espelho, captura e conteúdo. Bom pra `product-thinking`.

---

## 2026-06-14 — Extração é estruturação, não enriquecimento — e isso tem consequências de produto

**O que aconteceu:** ao subir o Career Master Document e ver o resultado na linha do tempo, o
conteúdo era essencialmente uma cópia do documento original — parágrafos longos, em inglês, no
fraseado exato de como foram escritos. O sistema foi propositalmente instruído a "preservar a voz
da pessoa e não reescrever em corporês." O resultado: quality in = quality out. Documentos bem
escritos geram timeline boa. Documentos verbosos geram bullets de cinco linhas.

**O que aprendi:** "capturar" e "melhorar" são dois produtos diferentes. Hoje o Borogodó captura
com estrutura (company, role, project_name, metric extraído) mas não distila o conteúdo. O Espelho
é a única camada que sintetiza — e ele opera sobre o conjunto, não sobre cada entrada individual.
Existe uma decisão de produto não tomada conscientemente até aqui: o pipeline de extração poderia
distilir o `what_i_did` para 1–2 frases enquanto preserva a voz, antes mesmo de chegar no Espelho.
O trade-off é real: distilir sem aprovação da pessoa é arriscado (e se o modelo distilir errado?),
mas não distilir deixa o valor do produto dependente da qualidade do documento que ela trouxe.

**Por que importa:** se o produto promete "te devolver sua carreira mais clara do que você consegue
ver", a timeline deveria ser mais clara do que o documento original, não uma cópia. É uma promessa
que hoje o produto não cumpre na camada de entrada — só cumpre no Espelho. Bom material de
`product-thinking`: a diferença entre um pipeline que estrutura e um pipeline que agrega valor.

---

## 2026-06-14 — Dois arquivos sobre a mesma carreira geram duplicatas que dedup textual não pega

**O que aconteceu:** a usuária subiu dois PDFs sobre a mesma carreira — um em inglês (Career Master
Document), outro em português (export de LinkedIn/portfólio). O pipeline extraiu entradas de ambos.
A deduplicação implementada (comparar os primeiros 120 chars do `what_i_did`) não pegou porque o
conteúdo era semanticamente idêntico mas textualmente diferente. Resultado: cada projeto aparecia
duas vezes no painel, uma versão em cada idioma. Além disso, um dos PDFs extraiu "Cheesake Labs"
(typo) em vez de "Cheesecake Labs", criando duas empresas separadas na timeline porque o
agrupamento é por texto exato.

**O que aprendi:** para um produto que aceita "suba o que você tiver", dedup textual é insuficiente.
O mesmo `what_i_did` em inglês e português têm 0% de sobreposição de texto mas 100% de sobreposição
semântica. A solução certa é embeddings: gerar um vetor para cada entrada e checar similaridade
coseno contra entradas existentes do mesmo usuário+empresa+projeto antes de salvar. Modelos de
embedding multilíngues capturam que "Led end-to-end Discovery & Definition" e "Liderou Discovery
& Definition end-to-end" são a mesma coisa. Para nomes de empresa com typo, a solução é separada
e mais simples: fuzzy match com distância de Levenshtein ≤ 2 no momento de agrupar.

**Por que importa:** "o usuário pode subir mil coisas" é uma promessa de produto. Para honrá-la
sem criar caos na timeline, o sistema precisa de dedup semântico, não só textual. Essa suposição
implícita (dedup por texto é suficiente) só ficou visível quando uma usuária real subiu dois
arquivos sobre o mesmo período. É o tipo de decisão de arquitetura que deveria ter sido feita
antes da feature de captura, e que agora entra no backlog como dívida técnica com nome.

---

## 2026-06-14 — Corrigir lógica não limpa dados antigos — duas camadas, dois fixes

**O que aconteceu:** corrigimos a deduplicação em `groupCompanies` para usar chave por ano em vez
de data exata, evitando que o mesmo cargo aparecesse três vezes. Mas ao abrir o app, as duplicatas
continuavam. A lógica estava certa — os dados já existiam no banco com os campos duplicados. A
função `groupCompanies` opera sobre o que vem do SELECT; não tem como retroativamente limpar o que
já foi inserido. A solução foi apagar as entradas do banco e reimportar.

**O que aprendi:** lógica de display e dados persistidos são camadas independentes. Uma correção
no agrupamento melhora como novos dados são apresentados, mas não toca o que já está armazenado.
Para bugs que geraram dados inválidos, o fix precisa de duas partes: a correção na lógica E um
script/migration que corrija (ou apague) os dados existentes. Quando o dado errado é simples
demais para valer uma migration elaborada, "delete e reimporte de fonte limpa" é uma decisão
válida — desde que a fonte limpa exista.

**Por que importa:** parece óbvio, mas não é intuitivo quando você está desenvolvendo — você
corrige o código, recarrega a página e espera que o problema suma. Não some, porque o dado ruim
ainda está no banco. É um padrão de debugging importante para comunicar e um lembrete de que
"corrigir o bug" e "corrigir os dados que o bug gerou" são duas tarefas distintas.

---

## 2026-06-14 — Componentes em árvores React separadas precisam de canal explícito de comunicação

**O que aconteceu:** o botão "Adicionar via captura" dentro do `ProjectDetailPanel` (renderizado
dentro de `HistoricoTimeline` dentro de `HistoricoPageClient`) precisava acionar a barra de captura
no rodapé, que vive no `AppShellClient` — o componente de layout raiz. No App Router do Next.js,
layout e page são renderizados como irmãos pelo mesmo nó, não como pai-filho no sentido de props.
Não tem como passar callback de filho para cima atravessando um layout. O `AppShellClient` não
conhece o `HistoricoPageClient` e vice-versa.

A solução foi um custom event do browser: `window.dispatchEvent(new CustomEvent('borogodo:capture-context', { detail: { name, company } }))` no clique do botão, e `window.addEventListener('borogodo:capture-context', handler)` no `AppShellClient`. O layout escuta, atualiza seu estado e a barra de captura ganha o contexto do projeto — com foco automático no textarea.

**O que aprendi:** quando dois client components precisam se comunicar mas não compartilham
ancestral comum acessível via props (ou o ancestral comum é server component), um event bus via
`window` é a solução mais simples e explícita. Alternativas — Context API global, estado no URL
via query params, Zustand — têm mais cerimônia sem ganho real para casos pontuais como este.
O padrão de nomear o evento com prefixo do produto (`borogodo:`) evita colisão com eventos de
libs de terceiros.

**Por que importa:** é um padrão que vai aparecer toda vez que uma feature precisar cruzar a
fronteira layout↔page no App Router. Vale ter o padrão estabelecido e nomeado para não reinventar
a cada vez — e para explicar para não-devs por que "mas não dá pra só passar como prop?" tem uma
resposta de arquitetura, não de descuido.

---

## 2026-06-15 — "Implementar o plano" não era escrever o código — era reconhecer que ele coordena uma cadeia

**O que aconteceu:** pedi para o Claude "pegar o `docs/conteudo-plano-de-acao.md` e implementar,
seguindo todo o padrão que o claude.md exige". O reflexo natural seria começar a codar uma feature
gigante. Em vez disso, ele parou e contrapôs: aquele documento não é uma feature, é um *epic plan*
que ele mesmo declara (linha 18) que "não substitui os ciclos speckit por feature; ele os coordena".
Ele orquestra uma cadeia de três features (013 motor de voz, 014 Presença, 015 refino), cada uma com
seu próprio ciclo speckit + checkpoint de validação meu. Ou seja: "implementar tudo seguindo o
padrão" era contraditório — o próprio padrão (speckit por feature, com checkpoint entre elas) proíbe
achatar três features num passo só. O caminho fiel era começar a cadeia certo: re-validar a fundação
depois que a 012 mergeou, resolver as decisões de kickoff (nome da nav, onde guardar a voz, número da
migration) e então planejar a 013, parando antes de codar.

**O que aprendi:** documentos têm "altitude". Um epic plan, uma spec de feature e uma task são camadas
diferentes, e tratar um pelo outro gera erro caro: implementar um plano de bloco como se fosse uma
feature teria virado um mega-PR sem checkpoints, sem validação por elo, sem os gates de constituição
por feature — exatamente o que o processo existe para evitar. A pista estava no próprio documento
("ele os coordena"), mas era fácil passar reto, animada para "ver código saindo". O instinto certo foi
ler a *intenção do artefato* antes de executar o verbo "implementar".

**Por que importa:** é material de `build-with-claude` e de `product-thinking`. Para quem usa IA para
construir, o reflexo "implementa isso para mim" assume que todo documento é executável do mesmo jeito
— e a IA prestativa demais obedece. O valor apareceu no Claude perguntando "isto é uma feature ou um
plano de várias?" antes de teclar. Reforça a regra que já está no `.claude/CLAUDE.md`: contrapor vale
mais que executar rápido — aqui, o "executar rápido" custaria reorganizar três features depois.

---

## 2026-06-15 — Uma régua "anti-IA" determinística troca cobertura por precisão (e o trade-off é a decisão)

**O que aconteceu:** a fundação da 013 (motor de geração de conteúdo) precisava de um validador que
reprova texto "com cara de IA" sem chamar IA, para rodar barato em teste e travar regressão de voz. A
forma é regex determinística (sem travessão, sem antítese, sem jargão de LinkedIn, número sempre com
janela de tempo). Ao implementar a regra "número sempre com janela de tempo", percebi a armadilha: uma
regex agressiva o bastante para pegar todo número solto também reprova texto legítimo, tipo "9 produtos
em 3 países" ou "100% remoto". Em vez de tentar uma regra perfeita, escopei estreito de propósito: só
pega percentual ou "de X para Y" sem janela de tempo (o caso canônico da marca, "de 41% para 58% em 4
trimestres"). Contagens comuns passam. O golden set de 10 casos bons virou a rede: se a régua começasse
a reprovar texto bom, esses testes ficariam vermelhos na hora.

**O que aprendi:** um validador determinístico de qualidade subjetiva ("soa como IA?") nunca tem
recall e precisão ao mesmo tempo. A escolha real não é "como pego tudo", é "qual erro eu prefiro". Aqui,
falso-positivo (reprovar texto bom da pessoa) é pior que falso-negativo (deixar passar um número solto):
o primeiro quebra a confiança e bloqueia geração legítima; o segundo é pego depois pela regeneração ou
pelo olho humano. Então a régua é deliberadamente conservadora, e o golden set documenta o que ela
promete pegar. "Anti-IA" virou propriedade verificável e honesta sobre os próprios limites, não uma
promessa de que nada ruim passa.

**Por que importa:** é material de `build-with-claude`. Todo mundo que constrói com IA acaba querendo um
"guard rail barato" que valide a saída do modelo sem outra chamada de modelo. O reflexo é tentar a regra
abrangente e descobrir em produção que ela reprova o output bom. A lição que vale conteúdo: comece pela
pergunta "qual falha eu tolero?", escope a regra para alta precisão, e deixe uma suíte de exemplos bons
ser a rede que avisa quando você apertou demais. Guard rail determinístico é um contrato sobre o que ele
garante, não uma muralha.

---

## 2026-06-15 — O gargalo de retenção estava no input, não no output

**O que aconteceu:** num discovery de retenção (sobre Hooked e pesquisa de mercado), eu vinha planejando
o bloco de conteúdo como três features do lado "Usar" (gerar post, hub, refino). Ao mapear o loop de
retenção, ficou claro um paradoxo que os próprios docs carregavam: o PRD diz que a retenção é "hábito
semanal de captura", mas o reposicionamento diz que o valor é episódico (entrevista, review). As duas
coisas brigam — não se sustenta disciplina semanal por um payoff que só chega em meses. E a conclusão que
eu não tinha visto: eu estava construindo três features no lado do output, enquanto o elo fraco do loop
(alimentar dados) estava do jeito que estava desde a captura inicial. Se a alimentação seca, todo o motor
gera em cima de dado velho — a mesma crítica que faço ao Taplio.

**O que aprendi:** num produto cujo valor é episódico, a recompensa atrasada é o elo fraco do loop Hooked.
A correção não é forçar hábito (vira a "vitamina" que a gente já decidiu não ser), é dupla: encurtar a
recompensa pra ser imediata (um aha por captura, ver a pilha crescer) e prender o gatilho à rotina que já
existe, em vez de criar um ritual novo. E, estrategicamente: o maior ROI de retenção estava no input
(captura), não em mais um formato de output.

**Por que importa:** é fácil investir onde o trabalho é visível (gerar conteúdo bonito) e negligenciar o
cano que alimenta tudo. Bom material de `product-thinking`: antes de sofisticar o output, pergunte se o
que abastece ele está vivo.

---

## 2026-06-15 — Uma mecânica de engajamento tem dois abismos opostos: fofo e genérico

**O que aconteceu:** explorando uma mecânica de "ver sua atividade crescer" (estilo constelação de
faíscas), meu medo foi "isso não vai ficar infantil e afastar uns usuários?". O reflexo seria deixar tudo
sóbrio. Mas ao desenhar a versão sóbria, apareceu o risco oposto e igualmente fatal: ela beirava o "SaaS
cinza de 2022" — genérico, sem identidade, exatamente o que a marca proíbe tanto quanto proíbe o infantil.
A saída não foi nenhum dos extremos: foi um híbrido (grade estilo GitHub, que empresta credibilidade, com
a faísca/paleta/serifa nos detalhes), e a decisão de validar com as personas reais, não com o meu gosto.

**O que aprendi:** quando você adiciona uma camada de deleite/gamificação a um produto sério, existem dois
abismos, não um. Cair no fofo afasta o usuário cético (o Bruno); cair no genérico mata a identidade, que é
a única defesa contra "parecer IA". Nomear os dois abismos foi o que destravou o meio-termo. E mecânica
visual só vira adulta quando é útil (navegar o tempo, filtrar) — quando é só "estrelinha pra dar dopamina",
vira brinquedo.

**Por que importa:** o instinto é mirar um perigo só ("não ficar infantil") e cair no outro sem perceber.
Bom pra `product-thinking`: a marca existe pra andar no fio entre os dois abismos, e "validar com a persona,
não com o meu gosto" vale especialmente quando eu (a fundadora) não sou o público-alvo médio.

---

## 2026-06-15 — Duas sessões de Claude na mesma pasta colidem (e o hook não sabe de quem é a mudança)

**O que aconteceu:** eu estava rodando duas janelas do Claude Code no mesmo repositório — uma fazendo
discovery comigo (só leitura + docs), outra implementando a feature em `src/` (eu tocando 013, 14 e 15 uma
atrás da outra). A cada vez que a sessão de discovery tentava encerrar, um Stop hook bloqueava ("você mexeu
em `src/` mas não atualizou o tasks.md") — só que aquela sessão não tinha tocado em `src/`. As mudanças
eram da outra janela. As duas compartilham a mesma pasta no disco, então o hook olhava a árvore inteira e
não tinha como saber de quem era a alteração. Confirmamos pelos timestamps (arquivos aparecendo segundo a
segundo) e por haver dois processos `claude` rodando.

**O que aprendi:** sessões de Claude Code numa mesma pasta dividem o working tree do git — então trocar de
branch ou editar arquivos numa janela afeta a outra, e hooks de guardrail dão falso positivo numa sessão
inocente. Discovery em paralelo é tranquilo (é leitura); o problema é duas sessões **escrevendo** ao mesmo
tempo. Rodar features em série (uma fecha, a próxima abre) não colide; pra paralelizar de verdade, a
ferramenta certa é `git worktree` (uma pasta por branch). E doc de discovery se commita isolado
(`git add <arquivo>` específico), pra não ser varrido pro PR da feature errada.

**Por que importa:** é um aprendizado central de `build-with-claude` pra quem usa mais de uma janela. O
reflexo "abro vários chats e toco tudo em paralelo" parece produtivo e na real cria colisão silenciosa. A
regra: uma feature/branch por pasta por vez; pra paralelo real, worktrees.

---

## 2026-06-16 — Subagents em pipeline TDD: o handoff é o produto, não a paralelização

**O que aconteceu:** quis testar se dava pra implementar uma fase inteira (US2 da 018: opinião com lastro,
guardrail, 2 componentes novos, rota, i18n) delegando a subagents, de um jeito replicável pras próximas
features. Montei dois papéis em `.claude/agents/`: um **test-author** (escreve só os testes RED e confirma
que falham) e um **implementer** (recebe os RED e implementa até GREEN, sem regressão). Rodei em série:
test-author primeiro, implementer depois. Deu certo na primeira — 701 testes verdes, tsc e eslint limpos,
nenhum teste ajustado pra passar. O detalhe que fez funcionar: o test-author não só escreveu os testes, ele
devolveu um **briefing com as assinaturas exatas** que o implementer teria que criar (props de cada
componente, mudanças na rota e no motor). Esse briefing virou o contrato. O implementer não teve que
adivinhar nada.

**O que aprendi:** o valor do subagent aqui não foi rodar coisas em paralelo (a fase tinha dependências, foi
tudo em série) — foi o **handoff estruturado**. Em TDD, o teste JÁ é a especificação executável; fazer um
agente escrever o teste primeiro força o contrato a existir antes da implementação, e um segundo agente
preenche esse contrato sem deriva de escopo. Também aprendi um limite da ferramenta: agente custom criado no
meio de uma sessão não é carregado — o `.md` em `.claude/agents/` só vale em sessão nova; no meio do caminho
tem que embutir o papel no prompt do general-purpose. E o orquestrador (eu) ainda precisa revisar o que
volta: validei de novo a rota (auth + custo de IA) e o contrato do `/api/capture` que o implementer assumiu,
porque "veio do subagent" não substitui revisão de superfície sensível.

**Por que importa:** é o molde replicável pras próximas features e material direto de `build-with-claude`. A
lição contraintuitiva: não delegue "implemente a feature" num agente só; quebre em **autor de teste → 
implementador**, e exija que o autor de teste devolva as assinaturas. O gargalo de qualidade some quando o
contrato vem antes do código. Paralelizar é bônus ocasional; o ganho real é o RED→GREEN com handoff limpo.

---

## 2026-06-22 — Skill de projeto só roda de dentro do projeto

**O que aconteceu:** comecei uma sessão na minha home (`~/Users/ohanatais`) e pedi `/product-north`
aplicado a uma issue. O comando deu "Unknown skill", mesmo o skill existindo em
`~/Documents/borogodo/.claude/skills/product-north`. O Claude carrega os skills a partir do
diretório onde a sessão foi aberta — e a home não é o repo. Tive que rodar todo o pipeline
(`product-north`, `speckit-specify`, `speckit-plan`, `speckit-tasks`, `impeccable shape`) na mão,
lendo cada `SKILL.md` e executando os passos manualmente. Funcionou, mas é o caminho difícil.

**O que aprendi:** os `/comandos` do projeto não são globais — eles vivem em `.claude/skills/` do
repo e só viram comando de verdade quando o Claude é iniciado de dentro do repo (ou de uma worktree
dele). Regra de bolso: antes de digitar `/qualquercoisa`, conferir com `pwd` se estou em
`~/Documents/borogodo` (ou worktree). Se aparecer a home, `cd` pro repo e reabrir.

**Por que importa:** explica um erro confuso ("o skill existe, por que não roda?") que custa tempo
e abala a confiança de quem não é dev. O conserto é trivial uma vez que você sabe a causa — e a
causa é onde você abriu o terminal, não o skill estar quebrado. Bom material de `build-with-claude`:
"por que meu slash command sumiu?".

---

## 2026-06-27 — "Redundante" engana: pergunte o job do componente antes de deletar

**O que aconteceu:** numa revisão de design da 021 pedi pra cortar tudo que parecia redundante no
Painel, Espelho e menu Usar. Três cortes "óbvios" deram errado de jeitos diferentes — e cada erro
ensinou a mesma coisa por um ângulo:
1. **A porta de chat do Painel.** Parecia duplicar o "Perguntar" da barra global (os dois abrem o
   mesmo chat). Removi. Estava errado: a redundância de *acesso* era real, mas a porta fazia outro
   job — **descoberta** ("dá pra perguntar qualquer coisa?"). O conserto não foi trazer de volta
   igual, foi trazer com copy que ensina, com exemplo de pergunta.
2. **O splash /usar.** Parecia redundante com o Repertório (os dois separam mostrar/preparar).
   Removi e mandei o menu direto pro /presenca. Errado de novo: o problema nunca foi o splash —
   era o **destino não escopar** (clicava num caminho e via os dois hubs, "tudo tudo"). O splash
   dava clareza; o bug era a tela seguinte. Voltei o splash e fiz cada caminho abrir só o seu hub.
3. **A bio ancorada num tema.** A UI mostrava "Baseado em: <um tema>", então assumi que a geração
   era estreita e ia redesenhar o seed. Fui ler o `loadSeed` antes: a evidência **já era ampla**
   (entradas recentes) — o tema só dava o rótulo e o ângulo. O "redesign" virou uma mudança de
   frontend de 20 linhas (deixar a pessoa escolher o foco), zero backend.

**O que aprendi:** redundância *estrutural* (duas coisas que fazem a mesma ação) não é razão
suficiente pra deletar. Antes de cortar, pergunte **qual job aquele elemento faz pro usuário** —
acesso e descoberta são jobs diferentes; um splash de intenção e a tela que ele abre são jobs
diferentes. E quando a UI sugere um comportamento "burro", **leia a camada de dados antes de
redesenhar** — várias vezes o motor já fazia a coisa certa e o problema era só o rótulo. O loop que
funcionou foi: analisar → propor e **confirmar** com a Ohana → implementar → reanalisar com ela
olhando a tela real. Os erros só não viraram regressão porque cada corte voltou pra validação visual.

**Por que importa:** "simplificar removendo o que parece repetido" é o conselho de design mais fácil
de dar e o mais fácil de errar. O custo de deletar o que dá descoberta ou clareza só aparece quando
um usuário real se perde — e aí já é tarde. Material direto de `product-thinking`: *a redundância
boa existe* (reforço, descoberta, escopo progressivo); o trabalho é distinguir repetição de
reforço, não caçar duplicatas. E de `build-with-claude`: peça pro agente ler o data layer antes de
aceitar um redesenho baseado no que a tela aparenta.
