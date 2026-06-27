# Feature Specification: Freio de custo de IA

**Feature Branch**: `023-freio-de-custo`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Freio de custo de IA: limite por hora nas ações de geração (espelho, post, autoavaliação, chat) por usuário, trava global de gasto diário com alerta para a operação (Ohana), e mensagem honesta e gentil ao atingir o limite. Captura/registros nunca são limitados. Sem cobrança, sem cota mensal. Ponto único de controle em getProvider().complete(). Decision record docs/decisions/002-freio-de-custo-e-monetizacao.md (issue #31)."

## Contexto

Hoje não existe nenhum controle de custo de IA no Borogodó. Toda chamada paga (extração via
Haiku, geração via Sonnet) passa por um único ponto no código sem qualquer limite por usuário,
quota ou rede de segurança de gasto. Dois riscos reais e baratos de mitigar ficam abertos:

1. **Script/robô** martelando uma ação cara de geração (custo desnecessário, sem teto).
2. **Bug em loop** disparando chamadas pagas em cascata até sangrar a conta de IA.

Esta feature instala o **freio mínimo invisível** decidido em
[`docs/decisions/002-freio-de-custo-e-monetizacao.md`](../../docs/decisions/002-freio-de-custo-e-monetizacao.md):
protege contra esses dois riscos sem desviar o foco de retenção/aha e **sem construir cobrança**.
Monetização (assinatura) fica registrada como hipótese no decision record, fora desta spec.

**Premissa que vigia tudo:** o lançamento é **beta controlado, sem chuva de gente**. O teto
por-usuário protege contra abuso individual, não contra muitos usuários legítimos simultâneos —
se o lançamento deixar de ser controlado, esta feature precisa ser reavaliada.

## Clarifications

### Session 2026-06-27

- **Teto diário de gasto:** US$10/dia (e não US$20). O lançamento é controlado e não se espera
  muito uso no início, então o limite de segurança fica mais baixo.
- **Alerta não é só "já travou": é antecipado.** A operação precisa ser avisada **antes** de o
  teto diário esgotar (alerta preventivo ao cruzar um limiar abaixo do teto), além do aviso
  quando o teto é de fato atingido e as chamadas são seguradas.
- **Conteúdo operacional do alerta:** a operação precisa saber, nesses avisos, **quantos usuários**
  estão ativos no dia, **quais consomem mais** (ranking por gasto de IA) e **quais estão travados**
  (atingiram o limite por hora da US1).
- **Canal:** e-mail, para **admin@borogodo.ai**.
- **Implicação de escopo (ampliação consciente vs. decision record 002):** saber "quem consome
  mais / quem está travado" exige **rastrear gasto de IA por usuário**. O doc 002 adiou medição
  de uso *para calibrar preço*; aqui o propósito é **operacional** (rodar o beta com segurança),
  não pricing — por isso entra agora, distinto do que ficou adiado.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teto por hora nas ações de geração, com saída honesta (Priority: P1)

Uma pessoa (ou um script se passando por ela) dispara muitas ações caras de geração — espelho,
post, autoavaliação, chat — em pouco tempo. Acima de um limite por hora, o sistema para de
gerar e responde com uma mensagem gentil no tom da marca, explicando que ela está usando bastante
e pedindo um intervalo curto. Um uso humano normal nunca encosta nesse limite.

**Why this priority**: É a proteção contra o risco mais provável (abuso/robô numa ação cara) e a
única parte visível ao usuário. Sozinha já entrega um produto viável: o gasto de geração por
pessoa passa a ter teto, e quem esbarra recebe uma resposta honesta em vez de erro ou silêncio.

**Independent Test**: Disparar repetidamente uma ação de geração com a mesma conta até passar do
limite configurado e confirmar que (a) as chamadas seguintes são barradas dentro da janela, (b)
a mensagem honesta aparece, (c) após a janela a ação volta a funcionar, e (d) capturar/registrar
no meio disso nunca é bloqueado.

**Acceptance Scenarios**:

1. **Given** um usuário que ainda não atingiu o limite por hora, **When** ele dispara uma ação de
   geração, **Then** a ação é executada normalmente.
2. **Given** um usuário que já atingiu o limite por hora de ações de geração, **When** ele tenta
   disparar mais uma, **Then** a ação é barrada e ele vê uma mensagem gentil no tom da marca (não
   um erro cru, código de status técnico, nem tela vazia).
3. **Given** um usuário que atingiu o limite, **When** a janela de uma hora passa, **Then** ele
   volta a conseguir gerar.
4. **Given** um usuário que atingiu o limite de geração, **When** ele captura ou cria um registro
   (texto, PDF, áudio), **Then** a captura acontece normalmente, sem qualquer bloqueio.

---

### User Story 2 - Trava global de gasto diário, com alerta antecipado e visibilidade operacional (Priority: P2)

Independentemente de qualquer usuário, o gasto total de IA do dia é acompanhado contra um teto de
segurança (US$10/dia). **Antes** de o teto esgotar, ao cruzar um limiar preventivo, a operação
recebe um e-mail de aviso. Se o teto for de fato atingido, novas chamadas pagas são seguradas e a
operação recebe um segundo e-mail. Os dois e-mails trazem o retrato do dia: quantos usuários
estão ativos, quais consomem mais e quais estão travados pelo limite por hora. Tudo isso é
invisível para o usuário comum — é instrumento de operação para rodar o beta com segurança.

**Why this priority**: Protege contra o cenário de maior dano (sangria por bug em cascata) e dá à
operação a visibilidade mínima para reagir antes de o dano acontecer. É menos provável no dia a
dia que o abuso individual da US1 e é invisível ao usuário, então vem depois. Independentemente
testável da US1.

**Independent Test**: Configurar o teto diário e o limiar de aviso em valores baixos, simular
gasto acumulado que cruze primeiro o limiar e depois o teto, e confirmar que (a) um e-mail de
aviso preventivo chega a admin@borogodo.ai ao cruzar o limiar, (b) novas chamadas pagas são
seguradas ao atingir o teto, (c) um e-mail de teto-atingido chega, e (d) ambos os e-mails listam
usuários ativos, maiores consumidores e usuários travados.

**Acceptance Scenarios**:

1. **Given** o gasto diário de IA abaixo do limiar de aviso, **When** qualquer chamada paga é
   disparada, **Then** ela ocorre normalmente e nenhum alerta é enviado.
2. **Given** o gasto diário cruza o limiar de aviso (abaixo do teto), **When** isso acontece,
   **Then** um e-mail preventivo é enviado a admin@borogodo.ai, e as chamadas pagas continuam
   fluindo normalmente.
3. **Given** o gasto diário atinge o teto de segurança (US$10), **When** uma nova chamada paga é
   disparada, **Then** ela é segurada e não chega ao provedor de IA, e um e-mail de teto-atingido
   é enviado a admin@borogodo.ai.
4. **Given** qualquer um dos e-mails de alerta é enviado, **When** a operação o abre, **Then** ele
   informa o gasto acumulado do dia, quantos usuários estiveram ativos, o ranking dos que mais
   consumiram e quais usuários estão travados pelo limite por hora.
5. **Given** o teto diário foi atingido, **When** vira o dia, **Then** a contagem reinicia e as
   chamadas pagas voltam a fluir.

---

### Edge Cases

- **Chamada paga sob a trava diária, na visão do usuário:** se a US2 segurar uma geração que o
  usuário pediu, ele vê a mesma mensagem honesta da US1 (sobrecarga temporária), nunca um erro
  cru. O alerta à operação é a parte invisível.
- **Limite atingido no meio de uma ação multi-etapa** (ex.: chat com várias mensagens): a
  contagem é por ação de geração disparada; o bloqueio se aplica à próxima ação, não corta uma
  resposta já em andamento.
- **Janela exatamente na virada:** o usuário no limite consegue gerar de novo assim que a janela
  de uma hora expira para a ação mais antiga contada.
- **Captura nunca conta para nenhum teto:** nem para o limite por hora (US1), nem deve ser o
  caminho que dispara o aviso da trava diária por si só (é barata, Haiku).
- **Falha ao registrar o consumo/uso** não pode travar a experiência de quem está dentro dos
  limites (o freio falha "aberto" para uso legítimo, mas a trava diária continua valendo como
  rede de segurança).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST aplicar um limite máximo de ações de **geração** por usuário dentro
  de uma janela de uma hora. As ações de geração cobertas são: gerar espelho, gerar post,
  autoavaliação e chat.
- **FR-002**: O sistema MUST NUNCA limitar captura/registro — texto, PDF e áudio, incluindo a
  criação de registros e a extração associada. Essas ações ficam fora de qualquer teto.
- **FR-003**: Quando um usuário atinge o limite por hora, o sistema MUST barrar a ação de geração
  seguinte e apresentar uma mensagem gentil e honesta, no tom da marca, que explique o que está
  acontecendo e convide a tentar de novo em alguns minutos — nunca um corte seco, erro técnico
  exposto ou silêncio.
- **FR-004**: O limite por hora MUST se restabelecer com a passagem do tempo, de modo que após a
  janela o usuário volte a conseguir gerar sem intervenção manual.
- **FR-005**: O sistema MUST manter uma trava global de gasto diário de IA com teto de segurança
  configurável, com valor inicial de **US$10/dia**: ao atingir o teto, novas chamadas pagas de IA
  são seguradas.
- **FR-006**: O sistema MUST rastrear o **gasto de IA por usuário** no dia, para sustentar a
  visibilidade operacional (ranking de consumo) e o acompanhamento do gasto agregado.
- **FR-007**: O sistema MUST enviar um **alerta preventivo por e-mail** a **admin@borogodo.ai**
  ao cruzar um limiar configurável de gasto diário **abaixo do teto** (ex.: ~70% do teto), antes
  de qualquer chamada ser segurada.
- **FR-008**: Ao atingir o teto diário, o sistema MUST enviar um **e-mail de teto-atingido** a
  **admin@borogodo.ai**, avisando que novas chamadas pagas estão sendo seguradas.
- **FR-009**: Os e-mails de alerta (preventivo e de teto-atingido) MUST conter o retrato
  operacional do dia: gasto acumulado, **número de usuários ativos**, **ranking dos que mais
  consumiram** e **lista dos usuários travados** pelo limite por hora.
- **FR-010**: A trava diária e as contagens (gasto diário, gasto por usuário) MUST reiniciar a
  cada novo dia, retomando o fluxo normal de chamadas.
- **FR-011**: Os parâmetros — quantidade por hora das ações de geração, teto diário de gasto e
  limiar do alerta preventivo — MUST ser configuráveis pela operação sem exigir mudança de
  comportamento de produto.
- **FR-012**: O controle MUST ser aplicado no ponto único por onde toda chamada paga de IA passa,
  de modo que nenhuma ação de geração escape do freio por estar num caminho diferente.
- **FR-013**: Quando a trava diária segura uma ação que um usuário pediu, o sistema MUST mostrar a
  ele a mesma mensagem honesta de sobrecarga temporária, mantendo o alerta operacional invisível
  para o usuário.
- **FR-014**: A visibilidade operacional (gasto por usuário, ranking, travados) MUST ser de uso
  interno da operação; não é exposta a nenhum usuário final.

### Key Entities *(include if feature involves data)*

- **Uso de geração por usuário**: contagem de ações de geração que um usuário disparou dentro da
  janela corrente de uma hora; base para decidir se a próxima ação passa ou é barrada, e para
  listar "quem está travado" no alerta operacional.
- **Gasto de IA por usuário (do dia)**: custo acumulado de chamadas pagas atribuído a cada
  usuário no dia corrente; base para o ranking de maiores consumidores e para a contagem de
  usuários ativos.
- **Gasto diário de IA (agregado)**: soma do custo de todas as chamadas pagas no dia corrente;
  base para o limiar de alerta preventivo e para a trava global de segurança.
- **Configuração de limites**: parâmetros ajustáveis pela operação — máximo de ações de geração
  por hora por usuário, teto diário de gasto e limiar do alerta preventivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhum usuário consegue disparar mais que o número configurado de ações de geração
  dentro de uma janela de uma hora.
- **SC-002**: Um padrão de uso humano normal (sessão real de uso do produto) nunca esbarra no
  limite por hora — zero bloqueios para uso legítimo durante o beta.
- **SC-003**: 100% das vezes que um usuário esbarra num limite (por hora ou trava diária), ele vê
  uma mensagem em linguagem natural no tom da marca, e nunca um erro técnico cru, código de
  status ou tela vazia.
- **SC-004**: Captura/registro funciona sem qualquer bloqueio em 100% das tentativas, mesmo
  quando o usuário já atingiu o limite de geração.
- **SC-005**: O gasto diário de IA nunca ultrapassa o teto configurado (US$10) sem que novas
  chamadas pagas sejam seguradas — nenhum estouro silencioso do teto.
- **SC-006**: A operação é avisada por e-mail em admin@borogodo.ai **antes** de o teto esgotar
  (ao cruzar o limiar preventivo) e **novamente** quando o teto é atingido — nos dois casos no
  mesmo dia do evento.
- **SC-007**: Todo e-mail de alerta permite à operação identificar, sem consultar outra
  ferramenta, quantos usuários estiveram ativos no dia, quais consumiram mais e quais estão
  travados.
- **SC-008**: O custo mensal de IA no beta permanece na casa de dezenas de dólares, sem nenhum
  incidente de sangria por bug ou script passar despercebido.

## Assumptions

- **Lançamento controlado**: o beta é fechado/de baixo volume; o teto por-usuário é proteção
  suficiente porque não há muitos usuários legítimos simultâneos. Se isso mudar, a feature é
  reavaliada (gatilho registrado no decision record 002).
- **Valores definidos**: teto diário de gasto = **US$10** (lançamento controlado, pouco uso
  esperado no início). Limite por hora na ordem de **~10** ações de geração por usuário e limiar
  do alerta preventivo na ordem de **~70% do teto** ficam como ponto de partida calibrável; o
  número exato do limite por hora será confirmado no plano.
- **Janela de uma hora** como granularidade do limite das ações de geração (não diária, não
  mensal) — alinhada ao objetivo de barrar robô/abuso sem incomodar uso humano.
- **Canal do alerta à operação**: **e-mail para admin@borogodo.ai**. Depende de um mecanismo de
  envio de e-mail (a definir no plano; relacionado à issue #34 de e-mail transacional, ainda não
  construída — o plano precisa garantir um caminho de envio para esses alertas).
- **Sem cobrança e sem cota mensal** nesta feature — beta é grátis; qualquer plano pago é tema da
  issue #39, registrada como hipótese no decision record 002, fora deste escopo.
- **Reuso do ponto único de controle existente** por onde toda chamada paga já passa — não se cria
  um caminho paralelo de chamada de IA.
