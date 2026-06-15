# Contrato: API da Presença (014)

A 014 adiciona **um** endpoint de leitura e estende o pipeline de insights. Reusa as rotas de geração e
de drafts da 013 (`POST /api/content/generate`, `POST /api/content/drafts`, `PATCH .../[id]`).

## `GET /api/content/drafts`

Lista paginada dos rascunhos do usuário (para o hub). Auth-first; RLS de `drafts`.

**Query params**: `?cursor=<opaco>&limit=<n≤20>`

**Response 200**:
```jsonc
{
  "items": [
    {
      "id": "string",
      "format": "post" | "impact_summary",
      "status": "generated" | "edited" | "copied" | "discarded",
      "seedType": "entry" | "theme" | "project",
      "seedLabel": "string | null",   // rótulo legível da origem (ex: nome do projeto)
      "createdAt": "ISO"
    }
  ],
  "nextCursor": "string | null"
}
```

**Garantias**: só rascunhos do próprio usuário (RLS); `limit` com teto (default 20); IDs internos não
expostos além do `id` operável do próprio recurso.

**Erros**: 401 (sem sessão), 400 (`limit` inválido), 500.

> `descartar` e `retomar`/`copiar` no hub usam o `PATCH /api/content/drafts/[id]` da 013 (status →
> `discarded`/`copied`). "Gerar do projeto" usa o `POST /api/content/generate` da 013 com
> `seedType='project'`.

## Disparo do nudge (não é endpoint HTTP — pipeline)

`triggerProactiveInsight(userId, entry)` (existente, hoje stub) passa a emitir, quando o sinal de
impacto é alto:

```jsonc
// linha inserida em proactive_insights
{
  "type": "content_opportunity",
  "headline": "string — ex: 'Isso daria um bom post'",
  "body": "string — por que essa entrada vira conteúdo",
  "entry_ids": ["<uuid da entrada forte>"],
  "seen": false
}
```

**Contrato de precisão (teste)**:
- Captura com `impact`/`metric` forte → cria 1 insight `content_opportunity`.
- Captura fraca → **não** cria.
- Respeita parcimônia: no máximo 1 por janela de tempo (não cria duplicado se já há um não-visto
  recente).

**Contrato de CTA**: o card do nudge no painel, ao ser clicado, abre o `GenerateSheet` da 013 com a
entrada de `entry_ids` como seed (`seedType='entry'`), e marca o insight como `seen`.
