# Contrato: API da Presença (014)

A 014 estende as rotas de drafts da 013 com **listagem paginada/filtrada** e **exclusão definitiva**, e
estende o pipeline de insights. Reusa as rotas de geração e de escrita da 013
(`POST /api/content/generate`, `POST /api/content/drafts`, `PATCH .../[id]`).

## `GET /api/content/drafts`

Lista paginada/filtrada dos rascunhos do usuário (para o hub). Auth-first; RLS de `drafts`.

**Query params**: `?cursor=<opaco>&limit=<n≤20>&status=<ativos|copiados|arquivados>`
(`status` default = `ativos`, que **exclui** `discarded`).

**Response 200**:
```jsonc
{
  "items": [
    {
      "id": "string",
      "format": "post" | "impact_summary",
      "status": "generated" | "edited" | "copied" | "discarded",
      "seedType": "entry" | "theme" | "project",
      "seedRef": "string | null",
      "angle": "string",
      "body": "string",
      "createdAt": "ISO"
    }
  ],
  "nextCursor": "string | null"
}
```

**Garantias**: só rascunhos do próprio usuário (RLS); `limit` com teto (default 20); `status=ativos`
nunca devolve arquivados; IDs internos não expostos além do `id` operável do próprio recurso.

**Erros**: 401 (sem sessão), 400 (`limit`/`status` inválido), 500.

## `DELETE /api/content/drafts/[id]`  *(novo na 014)*

Exclusão **definitiva** de um rascunho do próprio usuário. Auth-first; usa a política RLS `delete` de
`drafts` (criada na 013). A confirmação é feita na UI; esta rota não confirma nada (idempotente).

**Response 204**: sem corpo (excluído ou já inexistente).

**Garantias**: filtra por `id` E `user_id`; id de outro usuário (ou inexistente) **não apaga nada** e
responde de forma indistinguível (204 ou 404, à escolha — nunca 403, para não confirmar existência
alheia). Nenhum conteúdo logado.

**Erros**: 401 (sem sessão), 400 (`id` ausente), 500.

> **Editar / arquivar / restaurar** no hub usam o `PATCH /api/content/drafts/[id]` da 013:
> editar → `{ body, status: 'edited' }`; arquivar → `{ status: 'discarded' }`; restaurar →
> `{ status: 'edited' }`; copiar → `{ status: 'copied' }`.
> **Gerar do projeto** usa o `POST /api/content/generate` da 013 com `seedType='project'`.

## Disparo do nudge (não é endpoint HTTP — pipeline)

`triggerProactiveInsight(userId, entry)` (existente, hoje stub) passa a emitir, quando o sinal de impacto
é alto:

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
- Parcimônia: no máximo 1 por janela de tempo (não duplica se já há um não-visto recente).

**Contrato de CTA**: o card do nudge no Painel, ao ser clicado, abre o `GenerateSheet` da 013 com a
entrada de `entry_ids` como seed (`seedType='entry'`) e marca o insight como `seen`.

## Faixa de sugestões da Presença (leitura — sem endpoint novo, sem IA)

Resolvida no servidor (RSC) ao montar `/presenca`, cruzando dado existente:
- `content_opportunity` não-vistos (`seen=false`);
- temas do espelho (`mirror_snapshots.strength_themes`) e entradas fortes **sem rascunho ainda**.

Cada sugestão vira um `ContentSuggestion` (`seedType`/`seedRef`/`seedSummary`/`formats`) que, ao ser
acionado, abre a geração da 013 (`openPresenca`). Some quando não há material. Nenhuma chamada de IA no
caminho de leitura do hub.
