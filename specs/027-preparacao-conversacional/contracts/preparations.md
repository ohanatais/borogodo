# Contract: Preparações

## `GET /api/preparations`

Retorna até 50 preparações do usuário autenticado, mais recentes primeiro. Corpo não recebe mensagens
de chat; somente artefatos explicitamente salvos.

## `POST /api/preparations`

```json
{
  "moment": "entrevista",
  "body": "Resposta escolhida...",
  "evidenceEntryIds": ["uuid"]
}
```

Validação: body 1..12000, máximo 5 IDs únicos, todos pertencem ao usuário. Retorna 201 com o artefato.

## `DELETE /api/preparations/:id`

Exclui somente preparação do usuário autenticado. Retorna 204; 404 para item inexistente ou alheio.
