# Research: Presença — hub e costura (014)

Fonte: epic plan `docs/conteudo-plano-de-acao.md` + a fundação entregue pela 013. As decisões aqui são
de **integração**, não de motor (o motor é da 013).

## Decisão 1 — Hub lê de `drafts`, sem tabela nova

**Decisão**: `/presenca` é uma view de leitura sobre `drafts` (013) e `proactive_insights` (existente).

**Rationale**: O lifecycle de rascunho e o nudge já têm casa. Criar tabela nova duplicaria estado. A
014 é costura: nova superfície, mesmos dados. (Confirmado no kickoff: 014 não adiciona migration.)

**Alternativas rejeitadas**: Tabela `presenca_feed` agregando tudo (estado duplicado, risco de
divergência com `drafts`).

## Decisão 2 — "Usar projeto" reusa `seed_type='project'` já previsto na 013

**Decisão**: O botão "Usar" no projeto da Linha do Tempo chama o mesmo `generateDraft` com
`seed_type='project'` e a evidência agregada das entradas do projeto (via `getHistoricoData`).

**Rationale**: A 013 já incluiu `'project'` no CHECK de `drafts.seed_type` exatamente para isto. O
projeto é a melhor unidade de evidência (várias entradas da mesma empresa). Zero mudança de motor.

**Alternativas rejeitadas**: Concatenar entradas manualmente na UI (lógica de seed deve viver no
servidor, perto do motor, não no cliente).

## Decisão 3 — Nudge reusa `proactive_insights` com novo `type`

**Decisão**: O nudge "isso daria um post" é um `proactive_insight` de `type='content_opportunity'`,
disparado pelo `triggerProactiveInsight` (hoje stub no-op) quando a captura tem sinal forte.

**Rationale**: A infra de insight proativo (tabela com RLS, índice por `seen`, schema, prompt) já
existe desde a 005. `type` é texto livre, então não precisa de migration. Reusar mantém uma única
mecânica de "o produto te cutuca", em vez de inventar um segundo sistema de notificação.

**Alternativas rejeitadas**: Sistema de notificação novo (duplicação); gerar o post no disparo do
nudge (custo de IA às costas do usuário, sem controle, contra o princípio de não gerar sozinho).

## Decisão 4 — Parcimônia do nudge

**Decisão**: No máximo 1 nudge de conteúdo por janela (ex: por dia ou por captura forte), com
`seen` marcando o consumo. O sinal de "forte" reusa o impacto/métrica que a extração já calcula.

**Rationale**: Nudge demais vira ruído e treina a pessoa a ignorar. A pesquisa do produto valoriza
payoff episódico, não bombardeio. Espelha a parcimônia que o painel já aplica a insights.

**Alternativas rejeitadas**: Nudge a cada captura (ruído); nudge nunca (perde a mecânica de retorno).

## Decisão 5 — Reuso literal dos componentes de geração da 013

**Decisão**: O hub e o nudge abrem o **mesmo** `GenerateSheet`/`DraftCard`/`UsarButton` da 013; a 014
só adiciona a superfície de listagem (`PresencaHub`) e os novos pontos de entrada.

**Rationale**: O shape da 013 desenhou esses componentes para reuso por 014/015 exatamente por isto.
Garante consistência de UI/UX entre as superfícies (mesma régua do `.impeccable/design.json`).

**Alternativas rejeitadas**: Reescrever a UI de geração no hub (drift visual e de comportamento).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Conflito de nav/barra com a 012-chat | Revalidar `AppShellClient` e a barra de captura na implementação; o item "Presença" é leitura, não input |
| Lista do hub cresce sem limite | Paginação/limite na query; índice `(user_id, created_at desc)` da 013 |
| Nudge vira ruído | Parcimônia por janela + `seen`; sinal forte reusa impacto da extração |
| Evidência de origem apagada | Degradar com elegância ("origem indisponível"), `body` salvo continua válido |
