# PRD — Borogodó: Inteligência de Carreira

**Versão:** 0.3 (estado do produto — jun/2026)
**Data original:** 5 de junho de 2026 | **Última atualização:** 14 de junho de 2026
**Autora:** Ohana
**Nome:** Borogodó — domínio borogodo.io · ver seção 11

> Esta versão substitui a v0.2. Mudanças principais: (1) atualização do estado de
> implementação — 9 features mergeadas em main (001–009) e polish em andamento (010);
> (2) seção nova de estado atual do produto (seção 13) documentando o que está
> implementado, o que está em andamento e o que ainda falta; (3) marca definida —
> "Borogodó" com identidade visual ativa. As seções de visão, posicionamento, personas e
> pilares permanecem válidas.

---

## 1. Visão

A maioria dos profissionais não consegue enxergar nem comunicar o próprio valor. O trabalho real se dilui em entregas esquecidas, e na hora que importa — uma promoção, uma vaga, um post, uma conversa de salário — falta clareza sobre o que se fez, onde se é forte e o que desenvolver.

O produto é uma **camada de memória e inteligência de carreira**: a pessoa alimenta seu trabalho real de forma simples (escrevendo, subindo arquivos) e recebe de volta duas coisas:

1. **Um espelho:** um retrato claro e honesto de onde ela manda muito bem e onde pode crescer — a partir de evidência real, não de autoavaliação chutada nem de classificação boba de skills.
2. **Presença:** quando ela quiser, esse mesmo histórico estruturado vira conteúdo (post, mini-bio, resumo de impacto) na voz dela — bom de verdade, porque parte do trabalho real e não de uma página em branco.

**Frase única:** entenda o seu próprio valor e mostre ele ao mundo, a partir do que você realmente faz.

**Promessa por persona:**

1. Para quem quer crescer onde está: clareza de forças e lacunas para guiar desenvolvimento e provar valor numa promoção.
2. Para quem quer mudar ou ser vista: um banco de evidências e histórias prontas, e presença pública sem soar artificial.
3. Para quem trava na hora de se posicionar: a percepção de que o trabalho "comum" já é digno de nota, e o empurrão pra contar isso.

**North Star Metric:** ações de valor realizadas por usuário ativo por mês — onde "ação de valor" = (a) consultar/receber um insight sobre a própria carreira **ou** (b) publicar um conteúdo gerado a partir do histórico. Mede o loop inteiro: capturar → entender → comunicar.

**Princípios do produto:**

1. A captura precisa ser quase invisível e em qualquer formato. Se exige esforço, falha.
2. O valor está em **revelar** — o que você é, o que vale contar — não em escrever no seu lugar.
3. A voz e os dados são sempre da pessoa. O produto nunca soa como IA genérica.
4. Insight honesto, não bajulação. Mostrar lacunas com cuidado é parte do valor, não um defeito.
5. Brasileiro de verdade: idioma, jeito, humor e referências. Não é tradução de produto gringo.

---

## 2. Posicionamento

**Onde o produto joga:** na interseção entre **memória de carreira** (capturar e estruturar o trabalho real) e **inteligência aplicada** (revelar forças/lacunas e gerar presença), para o **profissional brasileiro** de qualquer área de conhecimento, começando pelos mais propensos a já registrar o próprio trabalho.

**Por que essa interseção é defensável:**

1. Os concorrentes de memória de carreira (brag docs) apontam só pra dentro: review, currículo, promoção. Não revelam padrão nem viram presença.
2. Os geradores de conteúdo partem de um tópico em branco — por isso soam genéricos. O produto parte do histórico estruturado, então o output é fiel e na voz da pessoa.
3. Nenhum deles é **brasileiro de verdade** nem fala com o white-collar amplo em português. Idioma, cultura, preço em real e presença em comunidade local são vantagem injusta.

**Diferenciais:**

1. Parte do trabalho real, capturado em qualquer formato (texto, arquivo).
2. Revela forças e lacunas com evidência — resolve a cegueira do "meu trabalho é comum" e a dúvida "onde devo crescer".
3. A inteligência é também o motor de qualidade do conteúdo: o histórico estruturado é o que faz o post não sair genérico.
4. Marca e experiência genuinamente brasileiras, no espírito Maritaca: tecnologia de ponta com cara, língua e humor do Brasil.

---

## 3. Personas

A ampliação para white-collar exige personas além de tech. Mantemos uma de produto/tech e adicionamos vendas e finanças/administração como representantes do público mais amplo.

### 3.1 Ana, Product Manager (tech, AI native)
- 6 anos de produto, vive em ferramentas de IA, participa de comunidades.
- **Dores:** esquece o que entregou; acha o dia a dia trivial demais; trava pra se posicionar; medo de soar como IA.
- **Ganhos:** presença consistente, banco de histórias pra entrevista, clareza pra pleitear senioridade.

### 3.2 Bruno, executivo de vendas
- Bate (ou não) meta todo mês, troca de empresa com frequência, carreira movida a resultado e relacionamento.
- **Dores:** não documenta as próprias vitórias (deals fechados, contas viradas, negociações difíceis); na hora da entrevista ou da revisão, não lembra dos números; sente que "só vende", sem enxergar a competência por trás.
- **Ganhos:** um histórico de conquistas com números, clareza das próprias forças (negociação? farming? hunting?), e presença que atrai oportunidade e clientes.

### 3.3 Clara, analista/coordenadora financeiro-administrativa
- Competente e confiável, mas pouco visível; pensa em crescer pra liderança ou trocar de área.
- **Dores:** trabalho operacional "invisível"; não sabe articular impacto ("organizei o fechamento" → quanto isso vale?); insegurança pra se posicionar; consome muito conteúdo, publica nada.
- **Ganhos:** enxergar o próprio impacto traduzido, descobrir onde se diferencia, e ganhar confiança e visibilidade pra próxima vaga ou promoção.

**Recorte consciente:** o público é amplo (white-collar BR), mas o beachhead de entrada são os mais propensos a já registrar trabalho e a já estar em comunidades — para o produto ganhar tração antes de atender quem captura com mais atrito.

---

## 4. Pilares do produto

### 4.1 Captura sem atrito e multimodal
Trazer o trabalho real para dentro do produto do jeito que for mais fácil pra pessoa: escrever ou subir arquivo (texto, PDF, docx). *Por que importa:* sem captura quase invisível, o hábito morre.

**Estado atual:** captura por texto (capture bar sempre presente no painel) e upload de PDF/LinkedIn implementados. Áudio está fora de escopo do v1 atual.

### 4.2 Estruturação com detecção de sinal
Transformar material bruto em entradas claras (o que fiz, decisão, aprendizado, impacto) e apontar o que tem valor. *Por que importa:* é a matéria-prima do espelho e do conteúdo.

**Estado atual:** extração via IA (claude-haiku-4-5) com esquema estruturado (what_i_did, decision, learning, impact_metric, date, tags) implementada e em produção.

### 4.3 Espelho de carreira (inteligência)
Revelar, com evidência, onde a pessoa manda bem e onde pode crescer; agrupar por temas/forças; permitir perguntar em linguagem natural. *Por que importa:* é a dor mais profunda do mercado BR e o primeiro core do v1.

**Estado atual:** geração do espelho via claude-sonnet-4-6 implementada, com regeneração automática ao acumular novas entradas. Página do espelho com categorias macro, evidências, seções "onde você manda bem / sem borogodó / o fio da sua carreira". Modo "Perguntar" (chat sobre o histórico) planejado mas sem backend — sinalizado como "Em breve" na interface.

### 4.4 Geração na voz da pessoa
A partir do histórico, produzir conteúdo (post, bio, resumo de impacto) que soa como a pessoa. *Por que importa:* é o segundo core e a ponte pra visibilidade.

**Estado atual:** item de navegação "Conteúdo" existe no app mas está desabilitado (feature não implementada). Previsto para onda seguinte.

### 4.5 Controle, confiança e brasilidade
A pessoa revisa tudo, é dona dos dados (exporta/apaga), e a experiência é em português de verdade. *Por que importa:* sem confiança ninguém alimenta um registro da própria carreira.

**Estado atual:** i18n em pt-BR implementado (next-intl). Identidade visual Borogodó ativa (paleta roxo-jambo + coral-faísca + creme, tipografia Fraunces, acento do "ó" como faísca). Exportação/exclusão de dados ainda não implementada.

---

## 5. Escopo do v1

Fluxo fino, ponta a ponta, com dogfooding desde a semana 1. **App web (destino).**

1. **Captura multimodal:** upload de arquivos (md, pdf, docx, txt) e captura rápida por texto. (Áudio entra em onda seguinte; MCP é experimento paralelo — ver seção 7.)
2. **Estruturação:** o modelo extrai entradas no esquema o que fiz / decisão / aprendizado / impacto-métrica / data / tags.
3. **Espelho:** timeline navegável + agrupamento por temas/forças + uma leitura de "onde você manda bem / onde dá pra crescer" baseada em evidência.
4. **Geração de conteúdo:** a partir de uma entrada/tema, rascunho na voz da pessoa — previsto para onda seguinte ao polish atual.
5. **Revisão e uso:** a pessoa edita, copia ou leva pro LinkedIn. Sem publicação automática.

**Os dois cores (espelho e conteúdo) têm peso igual na visão**, mas o espelho foi construído primeiro e está ativo. A geração de conteúdo é a próxima grande onda.

---

## 6. Fora de escopo no v1

1. Publicação automática no LinkedIn (sempre revisão humana; evita risco de plataforma).
2. Outputs avançados: currículo por vaga, portfólio completo, artigo longo (ondas seguintes).
3. Integrações automáticas pesadas com ferramentas de trabalho (Jira, CRM etc.).
4. Recursos de time/colaboração.
5. Gamificação e relatórios visuais tipo retrospectiva anual.
6. App mobile dedicado.
7. Idiomas além de português (inglês fica pra expansão global futura).
8. Captura por áudio com transcrição (removida do escopo imediato; entra em onda posterior).
9. Exportação e exclusão de dados pelo usuário (previsto, ainda não implementado).

---

## 7. MCP — papel no v1

A autora quer **aprender a criar um MCP** e testar a hipótese de captura conectada (ex.: puxar contexto do Claude/ferramentas que a pessoa já usa). Decisão: o MCP é um **experimento paralelo de aprendizado e um canal de captura opcional**, não um pré-requisito do core. Risco a observar: privacidade e governança de dados corporativos. Critério de sucesso do experimento: conseguir capturar ao menos uma entrada de trabalho via MCP de forma segura, e avaliar se o atrito/valor justifica investir mais.

**Estado atual:** não iniciado.

---

## 8. Métricas de sucesso

**Discovery:** cadastros na lista de espera; % que captura ao menos 1 entrada; % que recebe ao menos 1 insight do espelho; % que gera ao menos 1 conteúdo.

**v1 (ativação e retenção):**
1. Ativação A (espelho): primeira vez que a pessoa vê forças/lacunas a partir do próprio trabalho.
2. Ativação B (conteúdo): primeira publicação a partir de um rascunho do produto.
3. Retenção: hábito de captura recorrente (semanal) e retorno pra consultar o espelho.
4. Conversão free→pago: mais adiante.

---

## 9. Premissas e riscos a validar

1. O espelho (forças/lacunas) entrega valor percebido **acima** de um brag doc comum?
2. A qualidade do conteúdo gerado é boa o bastante pra pessoa publicar com orgulho? (maior medo declarado)
3. A captura por texto livre reduz atrito o suficiente pra atender quem não mantém logs?
4. O público white-collar não-tech adota, ou o beachhead deve começar mais estreito?
5. Disposição a pagar em real, no público amplo.
6. A identidade brasileira ajuda a grudar e diferenciar, ou é só estética?
7. O MCP de captura é viável e seguro o bastante pra valer a pena?

---

## 10. Visão de expansão

A mesma matéria-prima estruturada alimenta, em ondas: geração de conteúdo (post, bio), currículo adaptado por vaga, portfólio público, histórias de entrevista, e — caminho de receita real — expansão **global em inglês**, onde o ARPU é em dólar e o mercado é muito maior. No Brasil, a aposta é alcance e brasilidade; lá fora, é monetização.

---

## 11. Marca e identidade (brasilidade)

Decisão estratégica tomada em 05/jun/2026: a marca é **Borogodó** — palavra brasileira para o charme indefinível, "aquele quê". O produto revela o **borogodó profissional** da pessoa: onde ela brilha e nem sabia nomear.

**Identidade visual ativa:**
- Paleta: roxo-jambo + coral-faísca + creme + lilás-névoa
- Tipografia display: Fraunces (serif)
- Símbolo: o acento do "ó" vira uma faísca (instante da descoberta)
- Tom de voz: brasileiro, espirituoso e caloroso — nunca corporativo

**A espinha de mensagem — os 4 verbos do borogodó:**

| Verbo | Promessa | Tom na LP |
|---|---|---|
| **Descobrir** | revelar o seu borogodó | o espanto, o aha |
| **Entender** | mapear, com evidência | clareza, mapa |
| **Provar** | sustentar com evidência real | credibilidade |
| **Usar** | mostrar onde a carreira pedir | poder, ação |

**Domínio:** `borogodo.io` disponível (confirmado em 05/jun/2026). `borogodo.com.br` registrado por terceiro — não usar.

**A verificar:** marca no INPI (classes 9/35/42) e @handles (Instagram/LinkedIn/X).

O nome provisório anterior (Shippr) está aposentado por ser anglófono e desalinhado da brasilidade.

---

## 12. Rastreabilidade das mudanças (v0.1 → v0.2 → v0.3)

**v0.1 → v0.2:**
1. Core único "post de LinkedIn" → **core duplo de peso igual**: espelho (inteligência) + conteúdo.
2. Público "tech AI native" → **white-collar brasileiro amplo** (tech, vendas, finanças, admin, marketing, RH).
3. Captura por upload de logs → **multimodal** (arquivos, áudio, texto, MCP experimental).
4. Forma indefinida → **app web (destino)**.
5. Marca anglófona (Shippr) → **identidade brasileira** a definir.

**v0.2 → v0.3:**
1. Estado do produto documentado — 9 features implementadas e mergeadas, polish em andamento.
2. Marca finalizada: Borogodó, identidade visual ativa, 4 verbos de mensagem definidos.
3. Captura por áudio movida para fora de escopo imediato (ondas seguintes).
4. Modo "Perguntar" (chat sobre histórico) sinalizado como planejado mas sem backend ativo.
5. Geração de conteúdo confirmada como próxima grande onda após polish.

---

## 13. Estado atual do produto (14/jun/2026)

### 13.1 O que está implementado e mergeado

| Feature | O que entrega |
|---|---|
| **001 — Landing page** | LP pública em pt-BR, design system Borogodó (paleta, tipografia, tokens), i18n com next-intl |
| **002 — Auth** | Login/cadastro com Google OAuth e e-mail/senha, painel protegido por middleware, sessão persistente |
| **003 — Capture pipeline** | Capture bar no painel (texto livre), upload de PDF/LinkedIn, extração estruturada via IA (haiku-4-5), armazenamento no Supabase |
| **004 — Mirror generation** | Geração do espelho via claude-sonnet-4-6 a partir das entradas, regeneração automática ao acumular novas capturas |
| **005 — Panel dashboard** | Painel com composer, indicadores de progresso, insight proativo, entradas recentes |
| **006 — Espelho honesto** | Página `/espelho` com categorias macro (MacroCategoryTabs), evidências por seção, feedback "resonou com você?" |
| **007 — Painel redesign** | BorogodoCard (estado "em formação" / "ativo"), TrajectoryHighlights, MiniTimeline |
| **008 — Histórico/nav** | AppShell com navegação desktop (sidebar) e mobile (bottom nav), Linha do Tempo em `/historico` |
| **009 — Perfil/onboarding** | Central de Configurações em `/configuracoes` (IdentityCard, LinksCard), onboarding WOW/AHA (WelcomeStep, CaptureLoopStep com fases reading/evaluating/generating/revealed) |

### 13.2 Em andamento — 010 Produto Polish

Branch `010-produto-polish`. 17 itens de refinamento resultantes de audit completo (14/jun/2026), organizados em 5 fases:

**Fase 1 — Bugs críticos (T01–T03):**
- T01: Fix middleware — landing page inacessível para visitantes não autenticados (prefixo de locale /pt não mapeado em PUBLIC_ROUTES)
- T02: Remover `textAlign: justify` do intro do Espelho (causa "rios" em PT-BR)
- T03: Desabilitar/sinalizar modo "Perguntar" (backend retorna 501, usuário recebe erro silencioso)

**Fase 2 — Identidade visual (T04–T06):**
- T04: Eliminar padrão ALL CAPS / tiny-eyebrow de todas as seções (anti-referência no PRODUCT.md), substituir por componente `SectionLabel` com traço colorido
- T05: Nav mobile — adicionar labels de texto abaixo dos ícones (Sparkles e GitCommitVertical não comunicam função sozinhos)
- T06: Remover item "Conteúdo" desabilitado da nav principal (sinaliza produto incompleto)

**Fase 3 — UX e empty states (T07–T10):**
- T07: BorogodoCard em formação — adicionar CTA explícito ("Contar uma história agora")
- T08: TrajectoryHighlights — remover `line-clamp-2` do texto principal (trunca o destaque)
- T09: Empty state da Linha do Tempo — copy com personalidade + representação visual do "fio" + CTA
- T10: MirrorFeedback — adicionar contexto ao "Resonou com você?" (linha explicativa antes dos botões)

**Fase 4 — Onboarding (T11–T14):**
- T11: WelcomeStep — adicionar logo na tela roxa de boas-vindas
- T12: CaptureLoopStep — suavizar transição abrupta do fundo roxo intenso para creme entre steps
- T13: CaptureLoopStep — enriquecer estados de loading com copy rotativo (processo leva 15–30s)
- T14: Mirror revealed — tornar o momento mais dramático (animação e header "Aqui está o que eu vi em você")

**Fase 5 — Polimento (T15–T17):**
- T15: Espelho — hierarquia visual entre seções (primary_strength visualmente dominante)
- T16: "Gerar novo espelho" — substituir link apagado por botão com ícone e microcopy
- T17: Configurações — layout two-column no desktop, padding-bottom mobile (capture bar sobrepõe botão Salvar)

### 13.3 Ainda não implementado (próximas ondas)

| Item | Descrição |
|---|---|
| **Geração de conteúdo** | Rascunho de post/bio/resumo a partir do histórico — o segundo core do produto; próxima grande onda após o polish |
| **Modo "Perguntar"** | Chat em linguagem natural sobre o próprio histórico ("o que entreguei esse trimestre?") — planejado, sem backend |
| **Captura por áudio** | Entrada por voz com transcrição automática — movida para onda posterior |
| **Exportação de dados** | Pessoa exporta ou apaga o próprio histórico |
| **MCP de captura** | Experimento técnico de captura conectada — não iniciado |
| **Publicação automática** | Fora de escopo do v1 (revisão humana sempre) |
| **Integrações (Jira, CRM)** | Fora de escopo do v1 |
| **App mobile dedicado** | Fora de escopo do v1 |

### 13.4 Stack técnica atual

- Next.js 15 (App Router, Server Components por padrão)
- TypeScript estrito
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Anthropic API: claude-haiku-4-5 (extração), claude-sonnet-4-6 (espelho/geração)
- next-intl (i18n — pt-BR)
- Framer Motion (animações)
- Lucide React (ícones)
