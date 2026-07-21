# Contract: Telemetria e compartilhamento

## `POST /api/preparation-events`

Aceita somente `eventName`, `moment` e `properties` conforme allowlist por evento. Rejeita chaves como
`message`, `content`, `body`, `query`, `jobDescription` e qualquer string fora de enums autorizados.

## `POST /api/chat/share`

Exige `confirmed: true`, contexto e 1..20 mensagens. A UI deve explicar que o conteúdo será lido para
melhoria. Sem confirmação retorna 400. Nenhum compartilhamento ocorre no feedback comum.
