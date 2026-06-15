# Research: Presença — hub, gestão e sugestões (014)

Fonte: epic plan `docs/conteudo-plano-de-acao.md` + a fundação entregue pela 013. As decisões aqui são de
**integração e gestão**, não de motor (o motor é da 013).

## Decisão 1 — Hub lê de `drafts`, sem tabela nova

**Decisão**: `/presenca` é uma view sobre `drafts` (013) e `proactive_insights` (existente).

**Rationale**: O lifecycle de rascunho e o nudge já têm casa. Criar tabela nova duplicaria estado. A 014 é
costura e gestão: novas superfícies, mesmos dados. (Confirmado no kickoff: 014 não adiciona migration.)

**Alternativas rejeitadas**: Tabela `presenca_feed` agregando tudo (estado duplicado, risco de divergência
com `drafts`).

## Decisão 2 — Gestão total: "Arquivar" (soft) e "Excluir" (hard) são ações distintas

**Decisão**: Dar **duas** ações de remoção com semânticas diferentes. **Arquivar** é reversível: troca
`status` para `'discarded'`, tira da lista ativa, mantém o registro, pode **restaurar**. **Excluir** é
definitivo: remove a linha de `drafts` (hard delete), com **confirmação** obrigatória.

**Rationale**: "Gestão total" sem destruição acidental. A pessoa precisa poder limpar a lista sem medo
(arquivar) e também apagar de vez o que não quer (excluir). Misturar as duas numa só ação ou só ter
hard delete geraria perda acidental; só ter soft delete deixaria lixo acumulando. A 013 **já** criou
`status='discarded'` e a política RLS `delete` — então as duas semânticas cabem **sem migration**.

**Alternativas rejeitadas**: Só soft (`discarded`) — não atende "excluir de vez"; lixo acumula. Só hard
delete — perda irreversível por engano. Lixeira com expiração automática — complexidade e job de limpeza
sem demanda real (YAGNI).

## Decisão 3 — Conserto: a lista ativa exclui arquivados

**Decisão**: `listDrafts` passa a **excluir `status='discarded'` por padrão**; um filtro explícito mostra
os arquivados.

**Rationale**: Hoje a listagem não filtra status, então um rascunho arquivado continuaria aparecendo —
bug latente que a expansão da gestão expõe. O filtro de status (ativos/copiados/arquivados) resolve isso e
ainda dá organização quando a lista cresce.

**Alternativas rejeitadas**: Filtrar no cliente (traz dado demais, fura paginação). Não filtrar (arquivar
não significaria nada).

## Decisão 4 — "Usar projeto" reusa `seed_type='project'` já previsto na 013

**Decisão**: O botão "Usar" no projeto da Linha do Tempo chama o mesmo `generateDraft` com
`seed_type='project'` e a evidência agregada das entradas do projeto (via `getHistoricoData`).

**Rationale**: A 013 já incluiu `'project'` no CHECK de `drafts.seed_type` exatamente para isto. O projeto
é a melhor unidade de evidência. Zero mudança de motor.

**Alternativas rejeitadas**: Concatenar entradas na UI (lógica de seed vive no servidor, perto do motor).

## Decisão 5 — Nudge reusa `proactive_insights` com novo `type`, com parcimônia

**Decisão**: O nudge "isso daria um post" é um `proactive_insight` de `type='content_opportunity'`,
disparado pelo `triggerProactiveInsight` (hoje stub) quando a captura tem sinal forte. No máximo 1 por
janela; `seen` marca o consumo; o sinal de "forte" reusa o impacto/métrica que a extração já calcula.

**Rationale**: A infra de insight proativo (tabela com RLS, índice por `seen`, schema, prompt) já existe
desde a 005. `type` é texto livre → sem migration. Reusar mantém uma única mecânica de "o produto te
cutuca". Nudge demais vira ruído e treina a pessoa a ignorar.

**Alternativas rejeitadas**: Sistema de notificação novo (duplicação); gerar o post no disparo (custo de
IA às costas do usuário, contra o princípio de não gerar sozinho); nudge a cada captura (ruído).

## Decisão 6 — Sugestões na Presença: dado existente, zero IA no caminho de leitura

**Decisão**: A faixa "Sugestões pra você" no hub é montada no servidor (RSC) cruzando dado que já existe:
os `content_opportunity` não-vistos **mais** pontos de partida determinísticos — temas do espelho
(`strength_themes`) e entradas fortes que ainda **não** viraram rascunho. Cada sugestão só abre a geração
da 013; nunca gera sozinha.

**Rationale**: A pessoa pediu sugestões na Presença, não só no Painel. Mas o hub é caminho de leitura
frequente — colocar IA ali custaria latência e dinheiro a cada abertura. Derivar de dado já calculado dá a
sensação de "o produto sabe o que eu poderia publicar" sem custo novo e sem gerar nada às costas dela.

**Alternativas rejeitadas**: Chamar o LLM para sugerir a cada abertura do hub (custo/latência, contra
Princípio IV); só repetir o nudge do Painel (perde os pontos de partida que ainda não viraram rascunho).

## Decisão 7 — Reuso literal dos componentes de geração da 013

**Decisão**: Hub, gestão, nudge e sugestões abrem o **mesmo** `GenerateSheet`/`DraftCard`/`UsarButton`/
`PresencaCreate` da 013; a 014 adiciona só as superfícies de listagem/gestão/sugestão e os novos pontos de
entrada. "Retomar" estende o `GenerateSheet` para abrir a partir de um rascunho salvo (não só de um seed),
sem regerar.

**Rationale**: O shape da 013 desenhou esses componentes para reuso por 014/015. Garante consistência de
UI/UX entre as superfícies (mesma régua do `.impeccable/design.json`).

**Alternativas rejeitadas**: Reescrever a UI de geração no hub (drift visual e de comportamento).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Exclusão acidental e irreversível | Ação separada de "arquivar"; confirmação obrigatória no "excluir"; RLS + escopo `id`+`user_id` no DELETE |
| Arquivados poluindo a lista ativa | `listDrafts` exclui `discarded` por padrão; filtro explícito para vê-los |
| Conflito de nav/barra com a 012-chat | Revalidar `AppShellClient` e a barra de captura na implementação |
| Lista do hub cresce sem limite | Paginação/limite + filtro de status na query; índice `(user_id, created_at desc)` da 013 |
| Nudge vira ruído | Parcimônia por janela + `seen`; sinal forte reusa impacto da extração |
| Sugestões custando IA no hub | Faixa derivada de dado existente, montada no RSC; zero chamada de IA na leitura |
| Evidência de origem apagada | Degradar com elegância ("origem indisponível"); `body` salvo continua válido |
| Nova superfície de escrita (DELETE/PATCH) | `/security-review` recomendado antes do PR (além do `/pr-review`) |
