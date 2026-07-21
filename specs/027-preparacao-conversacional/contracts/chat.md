# Contract: Chat de preparação

## `POST /api/chat`

Request existente, com `context.type = "preparacao"` e `moment` obrigatório nesse modo. `history`
continua limitado a 20 mensagens e existe somente na requisição.

Evento SSE `done`:

```json
{
  "type": "done",
  "evidences": [
    {
      "entryId": "uuid",
      "title": "Lançamento de produto",
      "label": "Liderei...",
      "company": "Empresa",
      "date": "2026-05-31",
      "metric": "4 produtos",
      "impact": "...",
      "proofs": [{ "type": "url", "value": "https://...", "label": "Produto" }]
    }
  ],
  "suggestions": ["...", "..."]
}
```

O bloco privado do modelo inclui `evidenceRefs`. O servidor intersecta refs com entradas recuperadas;
IDs inventados são descartados. Em preparação, `moment` ausente retorna 400.

## Intake local

Não é endpoint. Pergunta inicial vem do catálogo `PREP_MOMENTS` e só o texto respondido pelo usuário
gera uma chamada.
