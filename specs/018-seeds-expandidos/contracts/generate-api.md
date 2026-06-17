# Contract: POST /api/content/generate (018 extension)

## Endpoint

`POST /api/content/generate`

Auth: cookie de sessão Supabase (obrigatório)

## Request body (JSON)

```typescript
{
  // Campos existentes (inalterados):
  format:    'post' | 'impact_summary' | 'mini_bio'
  seedType:  'entry' | 'theme' | 'project'
  seedRef:   string // min 1
  angle?:    string // max 200, opcional
  adjust?:   'mais_curto' | 'menos_formal' | 'tira_jargao' // opcional

  // Novos campos (018, todos opcionais):
  angleKind?:   'study' | 'opinion'  // ausente = relato (comportamento original)
  thesis?:      string               // max 500; obrigatório quando angleKind = 'opinion'
  lastroText?:  string               // max 2000; vivência dita na hora (só para opinião)
}
```

## Comportamento por ângulo

| angleKind | thesis | lastroText | Comportamento |
|-----------|--------|------------|---------------|
| ausente   | —      | —          | Relato clássico (comportamento pré-018) |
| `'study'` | —      | —          | Gera 2 variantes de estudo; evidence de `loadSeedEvidence` |
| `'opinion'` | presente | ausente | Opinion com entrada registrada; evidence de `loadSeedEvidence` |
| `'opinion'` | presente | presente | Opinion com vivência na hora; evidence = [Lastro, E1..En] |
| `'opinion'` | presente | ausente, evidence vazia | **400 opinion_needs_lastro** |

## Responses

### 200 OK

```json
{
  "variants": [
    {
      "angle": "string",
      "body": "string",
      "evidenceRefs": ["Lastro", "E1"]
    },
    {
      "angle": "string",
      "body": "string",
      "evidenceRefs": ["E2"]
    }
  ]
}
```

### Erros

| Status | error | Quando |
|--------|-------|--------|
| 400 | `invalid_request` | Schema Zod falhou |
| 400 | `opinion_needs_lastro` | Novo (018): angleKind = 'opinion', sem evidence e sem lastroText |
| 401 | `unauthorized` | Sessão ausente/expirada |
| 404 | `seed_not_found` | seedRef não pertence ao usuário |
| 422 | `generation_failed` | LLM falhou nas 2 tentativas (inclui post-gen guardrail de opinião) |
| 500 | `internal_error` | Erro interno |

## Invariantes de segurança (constituição I)

- `lastroText` validado pelo Zod antes de qualquer chamada ao LLM
- `seedRef` validado como do usuário por `loadSeedEvidence` (retorna `null` se não for)
- Contexto de IA nunca inclui dados de outro usuário
- `user_id` vem da sessão, nunca do payload

## Compatibilidade retroativa

Todos os campos novos são opcionais. Clientes que não passam `angleKind` recebem o comportamento pré-018 sem nenhuma alteração.
