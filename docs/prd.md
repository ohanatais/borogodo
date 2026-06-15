# PRD — Borogodó: Inteligência de Carreira

**Versão:** 0.3 (produto em produção — jun/2026)
**Data original:** 5 de junho de 2026 | **Última atualização:** 14 de junho de 2026
**Autora:** Ohana

> **Leitura rápida:** o produto está no ar. 9 features mergeadas em main (001–009),
> polish de UX em andamento (010). O segundo core — geração de conteúdo — é a próxima
> grande onda. Este PRD descreve o produto como existe hoje e onde ele vai.

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

## 4. Pilares do produto — hoje e para onde vai

### 4.1 Captura sem atrito e multimodal

Trazer o trabalho real para dentro do produto do jeito que for mais fácil pra pessoa.
*Por que importa:* sem captura quase invisível, o hábito morre.

**Hoje:**
- Capture bar sempre visível no painel (texto livre), presente em desktop e mobile
- Upload de PDF/LinkedIn processado via pipeline de extração IA
- Capture bar acessível de qualquer tela do app (AppShell)
- Contexto de captura: o composer sugere perguntas baseadas no tempo desde a última entrada e nos temas de força do espelho

**Próxima onda:**
- Captura por áudio com transcrição
- MCP de captura (experimento paralelo — ver seção 7)

---

### 4.2 Estruturação com detecção de sinal

Transformar material bruto em entradas claras e apontar o que tem valor.
*Por que importa:* é a matéria-prima do espelho e do conteúdo.

**Hoje:**
- Extração via claude-haiku-4-5 com esquema estruturado: `what_i_did`, `decision`, `learning`, `impact_metric`, `date`, `tags`, `role_title`, `company`
- Reflexão imediata após captura (mini-resumo + pills do que foi identificado)
- Enriquecimento de entrada posterior via botão "Responder" no ReflectionCard

**Próxima onda:**
- Detecção de padrões e sugestões proativas de enriquecimento

---

### 4.3 Espelho de carreira (inteligência)

Revelar, com evidência, onde a pessoa manda bem e onde pode crescer.
*Por que importa:* é a dor mais profunda do mercado BR e o primeiro core do produto.

**Hoje:**
- Onboarding WOW/AHA: ao cadastrar, usuário conta uma história; loop de captura + avaliação de suficiência (IA) + geração do espelho na primeira sessão
- Geração via claude-sonnet-4-6; regeneração automática ao acumular 5 novas entradas desde o último snapshot
- Página `/espelho` com 3 seções principais (força primária, skill invisível, padrão de contexto) + temas de força + categorias macro de skill com tiers (Emergente / Consistente / Comprovada)
- Evidências vinculadas: cada afirmação aponta para entradas reais, expansíveis
- Feedback "Resonou com você?" registrado para afinar futuras leituras
- Botão "Pedir uma nova leitura" (regeneração manual)
- Linha do Tempo em `/historico`: trajetória agrupada por empresa, projetos e entradas
- Insights proativos gerados quando há novidade relevante no histórico
- Modo "Perguntar" (chat sobre o histórico) planejado mas sem backend — sinalizado como "Em breve" na interface

**Próxima onda:**
- Backend do modo "Perguntar": respostas em linguagem natural sobre o próprio histórico ("o que entreguei esse trimestre?", "quais foram meus principais impactos?")
- Comparação de espelhos ao longo do tempo (evolução)

---

### 4.4 Geração na voz da pessoa

A partir do histórico, produzir conteúdo (post, bio, resumo de impacto) que soa como a pessoa.
*Por que importa:* é o segundo core do produto e a ponte pra visibilidade.

**Hoje:**
- Não implementado. Item de navegação reservado na interface, marcado como "Em breve".

**Próxima onda — próxima grande entrega:**
- A partir de uma entrada ou tema, gerar rascunho na voz da pessoa
- Formatos iniciais: post LinkedIn, mini-bio, resumo de impacto
- A pessoa revisa, edita e copia — sem publicação automática

---

### 4.5 Controle, confiança e brasilidade

A pessoa revisa tudo, é dona dos dados, e a experiência é em português de verdade.
*Por que importa:* sem confiança ninguém alimenta um registro da própria carreira.

**Hoje:**
- Interface 100% em pt-BR via next-intl
- Identidade visual Borogodó ativa: paleta roxo-jambo + coral-faísca + creme, tipografia Fraunces, símbolo do acento "ó" como faísca
- Central de Configurações em `/configuracoes`: nome, avatar, links (LinkedIn, GitHub)
- Auth com Google OAuth e e-mail/senha; middleware de sessão

**Próxima onda:**
- Exportação do histórico (entradas, espelho)
- Exclusão de conta e dados
- Revisão e edição de entradas individuais

---

## 5. Roadmap

### Ativo hoje (main)

| # | Feature | O que entrega |
|---|---|---|
| 001 | Landing page | LP pública em pt-BR, design system Borogodó, i18n |
| 002 | Auth | Google OAuth + e-mail/senha, sessão persistente, painel protegido |
| 003 | Capture pipeline | Capture bar (texto), upload PDF/LinkedIn, extração IA estruturada |
| 004 | Mirror generation | Geração do espelho via IA, regeneração automática |
| 005 | Panel dashboard | Composer, indicadores, insight proativo, entradas recentes |
| 006 | Espelho honesto | Página `/espelho` com categorias, evidências, feedback |
| 007 | Painel redesign | BorogodoCard, trajetória em destaque, mini timeline |
| 008 | Histórico/nav | AppShell responsivo, Linha do Tempo em `/historico` |
| 009 | Perfil/onboarding | Central de Configurações, onboarding WOW/AHA com espelho na primeira sessão |
| 010 | Produto polish | 17 itens de UX, bugs, identidade visual e consistência (em andamento) |

### Próxima onda

1. **Geração de conteúdo** — o segundo core: rascunhos de post/bio/resumo a partir do histórico
2. **Modo "Perguntar"** — chat sobre o próprio histórico em linguagem natural
3. **Exportação e exclusão de dados** — controle total da pessoa sobre seu histórico
4. **Captura por áudio** — entrada por voz com transcrição

### Ondas futuras

- Currículo adaptado por vaga
- Portfólio público
- Histórias de entrevista estruturadas
- Expansão global em inglês (onde o ARPU é em dólar)
- App mobile dedicado
- Integrações com ferramentas de trabalho (Jira, CRM etc.)
- MCP de captura (experimento técnico)

---

## 6. Fora de escopo

1. Publicação automática no LinkedIn (sempre revisão humana; evita risco de plataforma).
2. Currículo por vaga, portfólio completo, artigo longo (ondas futuras).
3. Integrações automáticas pesadas com ferramentas de trabalho.
4. Recursos de time/colaboração.
5. Gamificação e relatórios visuais tipo retrospectiva anual.
6. App mobile dedicado.
7. Idiomas além de português (inglês fica para expansão global futura).
8. Captura por áudio (onda posterior).
9. Exportação e exclusão de dados (próxima onda, ainda não implementado).

---

## 7. MCP — papel no produto

A autora quer **aprender a criar um MCP** e testar a hipótese de captura conectada (ex.: puxar contexto do Claude/ferramentas que a pessoa já usa). Decisão: o MCP é um **experimento paralelo de aprendizado e um canal de captura opcional**, não um pré-requisito do core. Risco a observar: privacidade e governança de dados corporativos.

Critério de sucesso do experimento: conseguir capturar ao menos uma entrada de trabalho via MCP de forma segura, e avaliar se o atrito/valor justifica investir mais.

**Estado atual:** não iniciado.

---

## 8. Métricas de sucesso

**Discovery:** cadastros; % que captura ao menos 1 entrada; % que recebe ao menos 1 insight do espelho; % que gera ao menos 1 conteúdo.

**Ativação e retenção:**
1. Ativação A (espelho): primeira vez que a pessoa vê forças/lacunas a partir do próprio trabalho — **já mensurável hoje**.
2. Ativação B (conteúdo): primeira publicação a partir de um rascunho do produto — **mensurável após geração de conteúdo**.
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

A mesma matéria-prima estruturada alimenta, em ondas: geração de conteúdo (post, bio), currículo adaptado por vaga, portfólio público, histórias de entrevista, e — caminho de receita real — **expansão global em inglês**, onde o ARPU é em dólar e o mercado é muito maior. No Brasil, a aposta é alcance e brasilidade; lá fora, é monetização.

---

## 11. Marca e identidade

Decisão estratégica tomada em 05/jun/2026: a marca é **Borogodó** — palavra brasileira para o charme indefinível, "aquele quê". O produto revela o **borogodó profissional** da pessoa: onde ela brilha e nem sabia nomear.

**Identidade visual ativa:**
- Paleta: roxo-jambo (primário) + coral-faísca (acento) + creme (fundo) + lilás-névoa (superfície)
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

## 12. Stack técnica

- Next.js 15 (App Router, Server Components por padrão)
- TypeScript estrito, sem `any`
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Anthropic API: claude-haiku-4-5 (extração), claude-sonnet-4-6 (espelho/geração)
- next-intl (i18n — pt-BR como fallback global)
- Framer Motion (animações de entrada e transições)
- Lucide React (ícones)
- Vitest + Testing Library (testes)
- Vercel (deploy)

---

## 13. Rastreabilidade das mudanças

**v0.1 → v0.2:**
1. Core único "post de LinkedIn" → **core duplo de peso igual**: espelho (inteligência) + conteúdo.
2. Público "tech AI native" → **white-collar brasileiro amplo** (tech, vendas, finanças, admin, marketing, RH).
3. Captura por upload de logs → **multimodal** (arquivos, texto; áudio e MCP em ondas seguintes).
4. Forma indefinida → **app web (destino)**.
5. Marca anglófona (Shippr) → **identidade brasileira** a definir.

**v0.2 → v0.3:**
1. Produto no ar — 9 features mergeadas (001–009), 010 polish em andamento.
2. Marca finalizada: Borogodó, identidade visual ativa, 4 verbos de mensagem definidos.
3. Seção de pilares (4) reescrita com estado atual + próxima onda por pilar.
4. Escopo reorganizado em roadmap: ativo hoje / próxima onda / ondas futuras.
5. Stack técnica documentada (seção 12).
6. Modo "Perguntar" sinalizado como planejado, sem backend ativo.
7. Geração de conteúdo confirmada como próxima grande onda.
