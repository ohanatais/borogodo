# Contract: `POST /api/capture`

**Feature**: `003-capture-pipeline`

Captura uma modalidade, extrai entrada(s) estruturada(s) e devolve um reflexo. Salva sem fricção.

## Request

`multipart/form-data` (FormData).

| Campo | Quando | Tipo | Notas |
|---|---|---|---|
| `kind` | sempre | `'text' \| 'file' \| 'audio' \| 'image'` | `audio`/`image` → 501 no MVP |
| `content` | `kind=text` | string | mínimo 3 caracteres (validado na borda) |
| `file` | `kind=file` | File | `application/pdf`, ≤ 10 MB |
| `audio` | `kind=audio` | File | **501 no MVP** (costura) |
| `image` | `kind=image` | File | **501 no MVP** (costura) |

## Pré-condições

- Sessão Supabase válida (cookie). Auth verificada como **primeira** operação.

## Responses

### 200 OK
```json
{
  "entries": [
    {
      "id": "uuid",
      "what_i_did": "...",
      "decision": null,
      "learning": null,
      "impact": "...",
      "metric": null,
      "entry_date": "2026-06-03",
      "tags": ["migração", "decisão sob pressão"],
      "source": "text"
    }
  ],
  "reflection": {
    "summary": "Entendi: você concluiu a migração sob prazo apertado — e deu certo.",
    "pills": ["decisão sob pressão", "entrega técnica"],
    "move": { "type": "question", "text": "Tem um número de impacto? Mesmo estimado conta.", "field": "metric" }
  }
}
```

### 400 Bad Request
- Texto < 3 chars → `{ "error": "Conta um pouco mais — não consegui captar." }`
- Arquivo não-PDF → `{ "error": "Arquivo inválido" }`
- Arquivo > 10 MB → `{ "error": "Arquivo muito grande (máx 10 MB)" }`

### 401 Unauthorized
`{ "error": "Não autorizado" }` — sem persistência.

### 501 Not Implemented
- `kind ∈ {audio, image}` → `{ "error": "Captura por áudio/imagem chega em breve." }`

### 500 Internal Server Error
- Haiku não retorna JSON válido / falha de validação Zod → erro genérico; **nada persistido**.

## Efeitos colaterais

- Persiste 1..N entradas em `entries` com `user_id` do usuário autenticado.
- Dispara (fire-and-forget, com log de erro): `triggerProactiveInsight(userId)` e
  `maybeRegenerateMirror(userId, total)` — **no-op em 003** (preenchidos por 005 e 004).

## Garantias

- Saída do LLM validada por Zod antes de persistir (sem persistência parcial).
- Nenhum dado de usuário em logs; contexto de IA restrito ao próprio usuário.
