# 003 — Registro como depósito: captura sem atrito, substrato rico de um RAG de carreira

- **Data:** 2026-07-11 (atualizado após iteração de design + reframe de profundidade)
- **Status:** decidido
- **Feature (provisória):** `023-registro-deposito` (issue #48)
- **Objetivo core que isso serve:** **retenção via input.** O discovery
  (`docs/discovery-retencao-e-conteudo.md`) crava que o gargalo de retenção está em
  **alimentar dados**, não no output. A fundadora não usava o próprio produto (dogfooding
  falhando) e a captura de hoje viola o Princípio nº1 ("captura quase invisível"): rejeita
  input legítimo e registra às cegas. **Reframe de 11/jul:** o registro não é só "captura sem
  atrito" — é o **substrato rico de um RAG de carreira**, capturado sem atrito. Quanto mais
  rico o que entra, melhor todo destino downstream (Espelho, posts, autoavaliação, entrevista).

## Contexto

Cliente-oculto no BragBook + uso real mostraram o registro quebrado. O código confirmou: a IA
de extração é **pedágio** que barra registro legítimo (`noContent`); texto curto é **reroteado
pro chat**; salva **às cegas**; e o suporte a **imagem já existe no schema** (`evidences` JSONB
+ bucket `evidence-files`, migration 007) mas está **trancado**. Este ciclo passou por
`/product-north` (frame → stress → prototype → decide), `/impeccable shape` e várias iterações
visuais no Claude Design. Ao longo delas, três aprendizados **mudaram o modelo** e estão
incorporados abaixo: (1) **tudo conta pro Espelho** — a gestão por-registro é atrito sem valor;
(2) a **profundidade** vem do cru preservado + perguntas, não de mais campos; (3) **registro =
fonte** — uma reunião não se "splita" em N registros; os vários wins viram **destaques dentro
de um registro**.

## Decisão

Registro como **depósito estilo bloco de notas que sempre salva**, IA rebaixada de pedágio a
assistente opcional, evidência visual na porta, registro visível/editável, **cru preservado
como substrato de RAG**, e **zero gestão** por-registro. Peças:

1. **Depósito bloco-de-notas, sempre salva.** Caixa de texto livre + anexar imagem/link de
   primeira classe. Nunca rejeita, nunca reroteia por tamanho. **Preserva o texto cru inteiro
   (transcrição/e-mail/doc) verbatim** — nunca destila-e-descarta. O cru é o substrato do RAG;
   os campos são resumo por cima.
2. **"Organizar" = botão opcional, não pedágio.** Detecta anexos (determinístico, custo zero) e
   infere métrica/impacto/tags (Haiku, ~US$0,01) em campos **editáveis**. **Só preenche campos
   vazios** — respeita o que a pessoa já preencheu (poupa IA e não reinterpreta dado correto).
   Os campos ficam disponíveis **antes E depois** de Organizar (atrás de "+ adicionar
   detalhes", colapsado — sem parede).
3. **Organização assíncrona no salvar (sem cron, sem rascunho).** Se a pessoa não clica em
   Organizar, o **salvar** dispara a organização em segundo plano (fire-and-forget; padrão que
   já existe no código pós-captura). Nada de detectar não-clique nem cron. **Sem conceito de
   rascunho** — registro cru é registro real. O estado "não organizado" é **transitório** (uns
   segundos de "organizando…"), sem rótulo persistente nem CTA no card.
4. **Confirmação visível + editável.** Após salvar: título **editável** ("o título é seu"),
   "salvo em Registros". Mata o "registra às cegas".
   - **Voz dos títulos (copy):** substantivo-primeiro, outcome-first (deliverable + objeto
     específico) — ex: "Redução de 50% no tempo de investigação de bug crítico",
     "Implementação da função de produto do zero numa healthtech". Puxa o número/prova pro
     título quando existir (dá lastro). **Objeto sempre específico e evidenciado** — banir
     nominalização vaga tipo "Otimização de processos", "Gestão de stakeholders" (CV-genérico
     mata a marca). O título é o rótulo escaneável; a **voz quente da pessoa vive no
     corpo/impacto**, não no título. Editável. (Trade-off aceito: ganha escaneabilidade de
     "caso profissional"; o guardrail do objeto-específico evita cair no corporativo/gringo.)
5. **Registro = FONTE, com destaques dentro (não splitar).** Uma fonte coerente (reunião,
   e-mail, doc) é **um** registro que guarda o cru inteiro; os vários wins viram **destaques**
   (facetas) pendurados dentro dele, cada um com sua métrica/tags. **Não fragmentar** em N
   registros — perde contexto e riqueza. O Espelho lê os destaques; o feed mostra 1 card (a
   fonte); o RAG lê a fonte inteira. Destaques são **flexíveis** (um win, um aprendizado, uma
   skill, um relacionamento — nem toda fonte tem métrica; sem-métrica é convite, não erro).
   - **Layout de dois níveis:** nível da FONTE (compartilhado): cru + anexos + empresa + data.
     Nível do DESTAQUE (repetível): título + métrica + impacto + tags, num **cartão colapsável**
     editável/removível + "+ adicionar destaque". 1 destaque → 1 cartão (aberto); N → N cartões
     (colapsados pra escanear). Feed: 1 card por fonte com selo "+N destaques" (expande revela
     todos + acesso à fonte).
6. **TUDO conta pro Espelho — sem gestão de destino.** O Espelho reflete o profissional a
   partir de **todas** as experiências; a inteligência dele é achar padrão no conjunto, não o
   usuário curar entrada a entrada. **Removido** o chip/toggle "no seu espelho / só no
   histórico" de toda superfície. Se um dia precisar excluir algo, isso vive **no Espelho**
   (curar em contexto), não no registro.
7. **Portas separadas + Painel co-igual + Registros reestruturado.** Barra fixa ambígua
   "Registrar | Perguntar" desfeita: Registrar é a porta de depósito (gatilho coral que abre
   drawer); Perguntar vive junto do Espelho, discreto. Painel: Espelho vira **cartão compacto**
   (não outdoor), co-igual ao gatilho de Registro. Registros: gatilho próprio, cards com
   **miniatura real** da evidência (não ícone por tipo), campos ao expandir, timeline por mês,
   grade-faísca como mapa (sem streak gamificado/emoji).

8. **Captura vs Importação — a fronteira do evento.** A regra "não splitar" vale pra fonte de
   **um evento**. Fonte de **vários eventos** (currículo, LinkedIn, "meses de coisas de uma
   vez") **splita em N registros** — cada experiência o seu. Divisor: *isso compartilha um
   contexto (tempo/empresa/evento)?* Sim → 1 registro, destaques dentro. Não → N registros. São
   **dois jobs**: **Captura** (o drawer, um evento) e **Importar histórico** (lote → N
   registros, numa **tela de revisão em lote** — cada registro proposto é um card pra
   manter/editar/descartar; já existe como infra no import LinkedIn/PDF da 003/onboarding 009).
   **Ponte:** se um blob multi-evento cair no drawer, o sistema detecta e oferece "importar como
   vários registros?". **Prominência adaptativa do Importar** (ação rara vs Registrar
   frequente): primário no **onboarding** e no **Painel-novo/vazio** (atalho pro valor — semeia
   o Espelho na hora); **secundário** na página Registros (afordância discreta) e um link/nudge
   pequeno no Painel-com-dado; nunca compete com o Registrar. Label pelo **valor** ("Importar
   histórico / currículo ou LinkedIn"), não pela mecânica ("Importar arquivo").
   - **UI da importação — dois jobs, não confundir:** *ingestão* (trazer as N experiências) vs
     *enriquecimento* (puxar profundidade de cada uma). Ingestão = **tela de revisão em lote**
     (ver todas de uma vez, editar direto). **NÃO** o chat de tela inteira do fluxo atual —
     esse é anti-pattern a substituir (conversar 8 empregos é lento e esconde o conjunto).
     Enriquecimento = **reusar o chat do "Perguntar", adaptado** ("vi que você ficou 3 anos na
     X — me conta um win de lá?"), depois do import ou a qualquer momento — puxa depth pro RAG,
     é quente pra quem trava (Clara), e reusa infra em vez de criar 3ª superfície. Forma:
     importar → lote (ingestão rápida) → chat-enriquecimento opcional.

**Princípio de profundidade (RAG) — vira requisito no spec:**
- **Preservar o cru sempre** (o substrato); a estrutura é um índice por cima, nunca substitui.
- **A geração lê a fonte, não o resumo** — senão a riqueza fica preservada-mas-não-usada e o
  post vira "resumão". (Reusa o `embedding vector(1536)` + HNSW que já existe em `entries`.)
- **Profundidade vem do cru + de perguntas ao longo do tempo**, nunca de mais campos na frente.
  A pergunta cirúrgica puxa a narrativa (contexto, seu papel, o desafio, o desfecho), 1 por vez.
- **Disciplina de atrito:** a captura continua um depósito de ~15s; riqueza é trabalho do
  sistema (preservar cru, perguntar depois), não fardo do usuário. Não rebuildar o form pesado.

**Fatiamento:** fatia 1 = destravar imagem/link na porta + confirmação editável + fim do
reroute/pedágio (usa migration 007 e infra existentes). Fatia 2 = Organizar + organização
assíncrona + destaques + reestruturação de Registros. **Sem migration nova provável** (reusa
`entries`, `evidences`, bucket, extração, embedding).

## Alternativas consideradas

- **Chat flexível como porta de registro** — descartada (stress). Chat vira porta de
  **escavação** (Clara/Bruno) + Perguntar, não de registro.
- **Form rígido estilo BragBook** — descartada. Campos viram saída opcional, não parede.
- **Registrar às cegas (status quo)** — descartada.
- **Conceito de rascunho** — descartado. Registro cru é real.
- **Cron / detectar não-clique** — descartada. O salvar dispara.
- **Campo aberto inline sem drawer** — superada. Registro é rico → drawer amplo (mini-campo em
  repouso carrega texto/foco pro drawer).
- **Espelho como outdoor no Painel** — descartada. Cartão compacto, co-igual ao Registro.
- **Splitar a fonte em N registros (multi-item)** — **revisada em 11/jul.** Fragmenta contexto e
  riqueza. **Escolhida:** registro = fonte, destaques dentro.
- **Gestão de destino espelho/histórico por-registro** — **removida em 11/jul.** Pede decisão de
  sistema que o usuário não consegue tomar; tudo conta.
- **Selos "IA" por campo** — removidos (ruído; mina "o dado é seu"). No máximo 1 aviso no bloco.
- **Conectores/auto-ingestão agora** — adiada (ver Caminhos futuros).

## Por que esta (e o steelman do oposto)

A IA no caminho crítico do salvar gera o falso positivo e viola a constituição. Movê-la pra
**depois** e torná-la opcional mata a fragilidade sem perder o moat. Preservar o cru + "tudo
conta" + destaques-dentro-da-fonte servem o RAG rico **e** removem gestão/atrito ao mesmo tempo
— simplificar e enriquecer, aqui, são a mesma direção (a riqueza vem do cru e das perguntas,
não dos campos).

**Steelman do oposto (fatia mínima):** se `noContent`/reroute forem raros, o pedágio é raro e a
fatia 2 é over-engineering — bastaria destravar imagem e consertar erros. **Como decidir:**
medir, pós-lançamento, a taxa real de `noContent`/reroute e a conversão do drawer. Porta de
instrumentar fica aberta.

## Riscos e o que os mitiga

1. **Scope creep (o mais letal).** → Fatiar: fatia 1 envia sozinha e destrava o dogfooding.
2. **Virar o BragBook.** → Extração como enriquecedora; régua de "excepcional" = voz brasileira
   + a prova real, não CSS.
3. **Registro excelente ≠ retenção (fé).** → Conserta input; gatilho de volta é outra aposta.
4. **RAG vira captura pesada** (ambição de profundidade rebuilda o form) → disciplina de atrito:
   captura ~15s; riqueza é do sistema.
5. **Cru preservado mas não usado** (geração lê só o resumo) → requisito: geração/RAG leem a
   fonte, não o resumo. Sinal visível "fonte completa preservada" + trecho relevante realçado.

## Caminhos futuros (fora de escopo — hipótese gated)

**Auto-ingestão de fontes brutas / conectores** (transcrição, e-mail, Slack, Jira, docs).
Direcionalmente on-thesis (input invisível ao limite; alimenta o RAG), mas **wave posterior**,
não a próxima feature. Riscos: esteira de manutenção de integrações; **o difícil é o filtro
win-vs-ruído, não o cano**; explosão de privacidade/LGPD; prematuro pré-PMF. O caminho manual
(colar/subir) já é "extrair de fontes brutas" com o humano como filtro — 80% do valor, 5% do
risco. O motor "Organizar" de agora é a semente desse futuro. **Portas pra ganhar a vez:**
(1) loop manual validado, (2) filtro win-vs-ruído resolvido, (3) recurso pra manter integrações.
Progressão: colar/subir (agora) → semi-automático por-item, ex. encaminhar e-mail (wave 2) →
conectores OAuth com filtro (wave 3).

## Como saber se acertamos

- **Dogfooding:** a Ohana volta a registrar (incl. prints e transcrições) sem fricção; nenhum
  registro legítimo barrado.
- **Produto:** registro por usuário ativo sobe; % com evidência e com destaques estruturados
  sobe (o RAG sendo alimentado com dado rico).
- **Reavaliar fatia 2:** se `noContent`/reroute forem raros no dado real, adiar. Se a geração de
  posts sair genérica, checar se está lendo a fonte e não o resumo.

## Quebra em features (A → B → C)

Escopo grande demais pra uma feature. Três, em ordem de dependência; cada uma é
worktree/branch/PR própria. **Implementar e VALIDAR uma de cada vez** — o `/loop` corre dentro
de cada feature (execução da `tasks.md`), nunca atravessando as três. Entre A e B há checkpoint
humano obrigatório: **usar a A** (o dogfooding é o motivo dela existir). B e C são rascunho até
A rodar (A pode reformatá-las).

> **Numeração confirmada em 2026-07-11:** `023` e `024` já estão em uso (`023-freio-de-custo` é
> o branch atual do repo principal; `024-analytics-consentimento` e `024-termos-privacidade` já
> existem como worktrees). Próximo número livre real: **`025`**. Features A/B/C usam
> `025`/`026`/`027` — confirme de novo no kickoff de cada uma (convenção do projeto), pois pode
> mudar entre agora e quando B/C forem abertas.

**Feature A — `025-registro-deposito` (fundação; destrava o dogfooding)**
> `/speckit-specify "Registro como depósito (fundação): substituir a captura atual por um drawer
> estilo bloco de notas que SEMPRE salva — nunca rejeita por texto curto, sem reroute por
> tamanho, sem pedágio de IA. Imagem e link de primeira classe na porta (destrava evidences
> JSONB + bucket evidence-files da migration 007). Após salvar, registro visível e editável com
> 'salvo em Registros'. Painel: desfazer a barra fixa 'Registrar|Perguntar'; Espelho vira cartão
> compacto co-igual a um gatilho de Registro coral que abre o drawer; 'Perguntar ao histórico'
> discreto junto do Espelho. Mobile: bottom sheet. Sem migration nova (reusa entries/evidences/
> bucket). FORA de escopo: botão Organizar/estruturação IA, destaques, reestruturação de
> Registros, importar (features B e C). Contexto: docs/decisions/003-registro-deposito-e-captura.md."`

**Feature B — `026-organizar-destaques` (depende de A)**
> `/speckit-specify "Organizar + destaques (depende de 025-registro-deposito): botão opcional
> 'Organizar' que detecta anexos e infere métrica/impacto/tags via Haiku em campos editáveis (só
> preenche vazios); se não clicado, organização assíncrona disparada pelo salvar (sem cron, sem
> rascunho; 'não organizado' transitório). Registro = FONTE com destaques dentro (layout dois
> níveis; não splitar fonte de um evento). Cru preservado verbatim como substrato de RAG; geração
> lê a fonte, não o resumo. Títulos substantivo-primeiro/outcome-first editáveis. Tudo conta pro
> Espelho (sem gestão de destino). Registros reestruturado: miniatura real, feed 1 card por fonte
> com '+N destaques', timeline por mês, grade-faísca sem streak. Reusa entries/evidences/
> embedding; provavelmente sem migration. Contexto: docs/decisions/003-registro-deposito-e-captura.md."`

**Feature C — `027-importar-historico` (depende de B; menos urgente)**
> `/speckit-specify "Importar histórico (depende de 026-organizar-destaques): fonte de vários eventos
> (CV/LinkedIn/catch-up) → N registros via tela de revisão em lote (reusa import PDF/LinkedIn),
> cada registro editável/descartável antes de salvar — NÃO o chat de tela inteira atual.
> Enriquecimento opcional via chat do 'Perguntar' adaptado. Prominência adaptativa (primário no
> onboarding e Painel-novo, secundário no resto). Ponte: blob multi-evento no drawer oferece
> importar como vários registros. Contexto: docs/decisions/003-registro-deposito-e-captura.md."`

## Próximo passo

**Trilha de design:** iteração visual no Claude Design (prompt único consolidado no handoff),
depois `/impeccable audit` + `web-design-guidelines`.

**Trilha de build (quando o visual assentar):** o hook exige `specs/NNN-*/` antes de `src/`.
Frase pronta pro `/speckit-specify`:

> "Registro como depósito: bloco de notas que sempre salva (nunca rejeita, sem reroute), com
> imagem e link de primeira classe (reusa `evidences` + bucket) e o **texto cru preservado
> verbatim como substrato de RAG**. Registro = FONTE: uma fonte coerente é um registro que
> guarda o cru inteiro, e os vários wins viram **destaques dentro dele** (não splitar em N);
> destaques flexíveis (win/aprendizado/skill, nem sempre métrica). Botão opcional 'Organizar'
> detecta anexos e infere métrica/impacto/tags em campos editáveis, preenchendo **só os
> vazios**; se não clicado, a organização roda assíncrona disparada pelo salvar (sem cron, sem
> rascunho; 'não organizado' é transitório). Campos disponíveis antes e depois de organizar,
> colapsados. Após salvar: título editável (estilo substantivo-primeiro/outcome-first, objeto
> específico e evidenciado, número no título quando existir; sem nominalização vaga), 'salvo em
> Registros'. **Tudo conta pro Espelho** —
> sem gestão de destino por-registro. A geração de conteúdo/RAG lê a FONTE, não o resumo.
> Painel: Espelho cartão compacto co-igual ao gatilho de Registro (drawer). Registros: gatilho
> próprio, cards com miniatura real de evidência, timeline por mês, grade-faísca sem streak.
> **Captura vs Importação pela fronteira do evento:** fonte de um evento = 1 registro com
> destaques dentro (layout dois níveis: fonte compartilhada + cartões de destaque); fonte de
> vários eventos (CV/LinkedIn/catch-up) = N registros via 'Importar histórico' (tela de revisão
> em lote, reusa import LinkedIn/PDF), com prominência adaptativa (primário no onboarding e no
> Painel-novo, secundário no resto). Sem migration nova provável."
