# Contract: `POST /api/mirror/generate`

**Feature**: `004-mirror-generation`

Gera (Sonnet), valida e persiste o primeiro espelho do usuário; marca o onboarding como concluído.

## Request

Sem corpo (ou `{}`). A identidade vem da sessão.

## Pré-condições

- Sessão válida (auth no topo).
- O usuário tem ≥ 1 entrada em `entries`.

## Responses

### 200 OK
```json
{
  "mirror": {
    "intro": "Já consigo ver algumas coisas, Ana.",
    "primary_strength": { "headline": "...", "evidence": "..." },
    "invisible_skill":  { "headline": "...", "evidence": "..." },
    "context_pattern":  { "headline": "...", "evidence": "..." },
    "closing_question": "Isso ressoa com você?",
    "strength_themes": ["decisão sob pressão", "síntese para stakeholders", "0→1"]
  }
}
```
Efeitos: insere `mirror_snapshots`; `profiles.onboarding_completed = true`.

### 400 Bad Request
- Sem entradas → `{ "error": "Sem entradas" }`.

### 401 Unauthorized
- Sem sessão.

### 500 Internal Server Error
- Sonnet retorna JSON inválido / falha de validação Zod → erro; nada persistido.

## Função interna: `maybeRegenerateMirror(userId, newTotal)`

Não é rota — é chamada (fire-and-forget) por `/api/capture` (003).

- Lê `entry_count` do último snapshot (`lastCount`, 0 se nenhum).
- Se `newTotal - lastCount ≥ REGEN_EVERY (3)` → chama `generateAndSaveMirror(userId)`.
- Caso contrário, no-op.
- Erros são logados (sem dados do usuário); snapshot anterior preservado.
- Usa client `service_role` filtrando `user_id`.

## Garantias

- Saída do Sonnet validada por Zod antes de persistir.
- Contexto restrito ao próprio usuário; nenhum dado cruzado.
