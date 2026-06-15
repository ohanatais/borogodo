# Contrato: API de Geração e Rascunhos (013)

Rotas sob `src/app/api/content/`, seguindo o padrão das rotas existentes (`/api/mirror/generate`,
`/api/entries/[id]`). **Toda rota verifica auth antes de qualquer lógica** (constituição I) e filtra
por `user_id = auth.uid()`.

## `POST /api/content/generate`

Gera 2 variações de um formato a partir de um seed com evidência. **Não persiste** — devolve variações
efêmeras já validadas (Zod + ruleset anti-IA).

**Request**:
```jsonc
{
  "format": "post" | "impact_summary",
  "seedType": "entry" | "theme" | "project",
  "seedRef": "string",            // id da entrada / chave do tema
  "angle": "string | null",       // opcional: ângulo escolhido
  "adjust": "mais_curto" | "menos_formal" | "tira_jargao" | null  // opcional: chip de ajuste (regera)
}
```

**Response 200**:
```jsonc
{
  "variants": [
    { "angle": "string", "body": "string", "evidenceRefs": ["E1", "E3"] },
    { "angle": "string", "body": "string", "evidenceRefs": ["E2"] }
  ]
}
```

**Garantias**:
- Cada `body` passou por Zod (`validateDraftOutput`) **e** pelo ruleset anti-IA (`validateContentRuleset`)
  com zero violações; em violação, o servidor regenera **uma** vez antes de responder.
- O contexto de IA contém apenas dados do próprio usuário (constituição I/III).
- `seedRef` é validado e pertence ao usuário antes da chamada ao LLM.

**Erros**:
| Status | Quando | Corpo |
|---|---|---|
| 401 | Sem sessão | `{ error: 'unauthorized' }` |
| 400 | `format`/`seedType` inválido ou `seedRef` ausente | `{ error: 'invalid_request' }` |
| 404 | `seedRef` não pertence ao usuário / não existe | `{ error: 'seed_not_found' }` |
| 422 | LLM falhou nas 2 tentativas no ruleset | `{ error: 'generation_failed' }` (estado honesto na UI) |
| 500 | Erro inesperado | `{ error: 'internal_error' }` (sem vazar detalhe/dado de usuário) |

## `POST /api/content/drafts`

Persiste o rascunho que o usuário escolheu (cria a linha em `drafts`, status `generated` ou `edited`).

**Request**:
```jsonc
{
  "format": "post" | "impact_summary",
  "seedType": "entry" | "theme" | "project",
  "seedRef": "string | null",
  "angle": "string",
  "body": "string",
  "status": "generated" | "edited",
  "qa": { "...": "ângulo/perguntas que guiaram" }   // jsonb auditável
}
```

**Response 201**: `{ "draft": { "id": "...", "status": "...", "createdAt": "..." } }`

**Erros**: 401 (sem sessão), 400 (payload inválido por Zod), 500.

## `PATCH /api/content/drafts/[id]`

Atualiza um rascunho do próprio usuário: edição do `body`, transição de `status`
(`edited`/`copied`/`discarded`) e/ou `voiceFeedback` (`soa`/`nao_soa`). **Não regera** no v1.

**Request** (campos opcionais; ao menos um):
```jsonc
{
  "body": "string",
  "status": "edited" | "copied" | "discarded",
  "voiceFeedback": "soa" | "nao_soa"
}
```

**Response 200**: `{ "draft": { "id": "...", "status": "...", "voiceFeedback": "..." } }`

**Garantias**: a query é escopada por `auth.uid() = user_id` (RLS); um id de outro usuário retorna 404,
não 403, para não confirmar existência.

**Erros**: 401, 400 (Zod), 404 (não é do usuário / inexistente), 500.

## `PUT /api/content/voice`

Atualiza o `voice_profile` do usuário (cola/edita amostras, preferências) e dispara re-inferência do
`inferred_summary` a partir do `raw_content` (cacheado no JSONB).

**Request**:
```jsonc
{
  "samples": ["string", "string"],      // 0 a 2
  "tone": "string | null",
  "lengthPref": "curto" | "medio" | "longo" | null
}
```

**Response 200**: `{ "voiceProfile": { "tone": "...", "samples": [...], "inferredSummary": "...", "updatedAt": "..." } }`

**Garantias**: `samples` validadas/sanitizadas antes de qualquer chamada ao LLM; o `inferred_summary` é
derivado só do `raw_content` do próprio usuário.

**Erros**: 401, 400 (Zod: máximo 2 samples, tamanho razoável), 500.

> **Fora de escopo da 013** (→ 014): `GET /api/content/drafts` (listagem para o hub) e o disparo do
> nudge proativo. Os contratos de leitura/listagem ficam para o elo do hub.
