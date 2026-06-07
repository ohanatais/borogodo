# Contract: `PATCH /api/entries/:id/enrich`

**Feature**: `003-capture-pipeline`

Enriquece uma entrada existente gravando a resposta do usuário num campo. **Sem chamada de IA.**

## Request

`application/json`

```json
{ "answer": "Reduziu o tempo de deploy em 40%", "field": "metric" }
```

| Campo | Tipo | Notas |
|---|---|---|
| `answer` | string não-vazia | vira o valor do campo |
| `field` | `'metric' \| 'impact' \| 'decision' \| 'learning'` | conjunto fechado |

## Pré-condições

- Sessão válida (auth no topo).
- A entrada `:id` pertence ao usuário (garantido por RLS `auth.uid() = user_id`).

## Responses

### 200 OK
```json
{ "ok": true, "entry": { "id": "uuid", "metric": "Reduziu o tempo de deploy em 40%" } }
```

### 400 Bad Request
- `field` fora do conjunto permitido, ou `answer` vazio.

### 401 Unauthorized
- Sem sessão.

### 404 / nada alterado
- Entrada inexistente **ou** de outro usuário (RLS impede o update) → nenhuma linha afetada.

## Garantias

- Nenhuma chamada de LLM (instantâneo, custo zero).
- `updated_at` é atualizado.
- RLS impede edição de entradas de outros usuários.
