# API Contract: Feed de Registros

## `GET /api/feed`

### Auth
Header `Cookie` com sessão Supabase válida. Retorna `401` se não autenticado.

### Query Parameters

| Param       | Tipo    | Default       | Descrição                                         |
|-------------|---------|---------------|---------------------------------------------------|
| `axis`      | string  | `created_at`  | `created_at` ou `entry_date`                      |
| `q`         | string  | —             | Busca textual (ilike em `what_i_did`, `title`, `tags`) |
| `from`      | string  | —             | ISO date (YYYY-MM-DD) — início do período         |
| `to`        | string  | —             | ISO date — fim do período                         |
| `company`   | string  | —             | Filtrar por empresa (exact match, case-insensitive) |
| `tags`      | string  | —             | Tags separadas por `\|` (ex: `liderança\|produto`) |
| `metric`    | `true`  | —             | Quando presente, só registros com `metric != null` |
| `source`    | string  | —             | `text`, `audio`, `linkedin_pdf`, `image`, `chips` |
| `cursor`    | string  | —             | Cursor opaco (base64) da página anterior          |

### Response `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Lancei campanha que atingiu 2M de impressões",
      "what_i_did": "...",
      "source": "text",
      "created_at": "2026-06-10T14:32:00Z",
      "entry_date": "2026-05-01",
      "company": "ACME",
      "role_title": "Product Manager",
      "metric": "2M impressões",
      "tags": ["marketing", "campanha"],
      "thumbnail": null,
      "impact": "...",
      "decision": null,
      "learning": null
    }
  ],
  "nextCursor": "base64encodedcursor==",
  "total": 42
}
```

- `nextCursor`: `null` se for a última página.
- `total`: contagem aproximada (pode ser `null` em queries complexas).
- `title`: sempre presente — IA ou fallback determinístico.

### Response `401 Unauthorized`
```json
{ "error": "Não autorizado" }
```

### Response `400 Bad Request`
```json
{ "error": "Parâmetro inválido: axis deve ser 'created_at' ou 'entry_date'" }
```

---

## `GET /api/feed/activity`

### Auth
Idem.

### Query Parameters

| Param    | Tipo   | Default | Descrição                                 |
|----------|--------|---------|-------------------------------------------|
| `window` | number | `365`   | Janela em dias (1–730)                    |

### Response `200 OK`

```json
[
  { "date": "2026-01-05", "count": 3 },
  { "date": "2026-01-12", "count": 1 },
  { "date": "2026-06-10", "count": 5 }
]
```

- Array esparso — somente dias com `count > 0`.
- Ordenado por `date ASC`.
- O componente `<ActivityGrid>` preenche os dias vazios no cliente.

### Response `401 Unauthorized`
```json
{ "error": "Não autorizado" }
```
