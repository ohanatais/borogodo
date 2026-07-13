# Contract: Salvamento direto de registro (drawer)

## `POST /api/capture` — novo `kind: 'deposito'`

Estende a rota existente (`src/app/api/capture/route.ts`), que já despacha por `kind` no corpo.
Não altera o comportamento dos `kind`s existentes (`marco`, `text`, `file`, `audio`, `image`,
`question`).

### Request

```
POST /api/capture
Content-Type: application/json
Authorization: sessão Supabase (cookie) — igual às demais chamadas da rota
```

```jsonc
{
  "kind": "deposito",
  "rawText": "resolvi um bug hoje",      // obrigatório, string não-vazia (trim), sem limite mínimo de tamanho
  "manualFields": {                          // opcional — presente só se "+ adicionar detalhes" foi usado
    "metric": "aceite em 2 ciclos",         // opcional
    "impact": "reduziu retrabalho do time", // opcional
    "tags": ["negociação", "processo"],     // opcional
    "company": "Acme",                       // opcional
    "entryDate": "2026-07-10"                // opcional, formato ISO date
  }
}
```

### Response — 201 Created

```jsonc
{
  "id": "uuid-da-entry",
  "title": "resolvi um bug hoje"   // heurística local (buildEntryTitle), pré-preenchido, editável depois
}
```

### Response — 422 (apenas se `rawText` vazio após trim — nunca por tamanho/conteúdo)

```jsonc
{ "error": "emptyContent" }
```

Esse é o **único** caso de erro de conteúdo possível — corresponde ao botão desabilitado no
cliente (edge case: sem texto e sem anexo, o botão nunca fica clicável, então este erro nunca
deveria ser alcançável via UI; existe como piso de validação server-side).

### Response — 401 / 500

Iguais ao padrão já existente da rota (`unauthorized`, `internalError`).

### Garantias do contrato (derivadas de FR-001 a FR-004)

- **Nunca** retorna `noContent`/`NoExtractableContentError` — esse erro é exclusivo do caminho
  `kind: 'text'` (que usa `captureAndReflect`) e não existe neste caminho.
- **Nunca** faz uma chamada de IA antes de responder — a resposta é determinística e depende
  apenas de: validar `rawText` não-vazio, gerar título via heurística local, inserir na tabela
  `entries` (reusa `saveEntries` ou uma variante mínima sem o passo de dedup semântico via
  embedding, a definir em `/speckit-tasks` — dedup exato por `what_i_did` idêntico pode ser
  mantido, dedup semântico via embedding é assíncrono/opcional e não deve bloquear o insert).
- Tempo de resposta: sub-segundo (SC-002) — sem upload de arquivo neste request (anexos vão pela
  rota separada abaixo).

---

## `POST /api/entries/[id]/evidence` — **sem alteração** (reuso confirmado)

Contrato já existente, documentado aqui apenas para registrar que o drawer o consome como está,
uma chamada por anexo, depois que a entry já existe (id retornado pela chamada acima).

### Request — imagem

```
POST /api/entries/{id}/evidence
Content-Type: multipart/form-data

file: <binary>              // obrigatório — jpeg/png/webp/gif, máx 10 MB
label: "string opcional"
```

### Request — link

```
POST /api/entries/{id}/evidence
Content-Type: application/json

{ "type": "url", "value": "https://figma.com/...", "label": "Figma — protótipo" }
```

### Response — 200

```jsonc
{ "evidences": [ { "type": "image", "value": "https://.../evidence-files/...", "label": null }, ... ] }
```

### Erros já existentes (reusados sem mudança)

- 400 tipo de arquivo não suportado / arquivo grande demais / URL inválida
- 404 entry não encontrada (ou não pertence ao usuário)
- 401 não autenticado

### Falha parcial no drawer (comportamento novo, do lado do cliente)

Se uma dessas chamadas falhar após a entry já ter sido criada pela chamada de `/api/capture`, o
cliente deve: manter a confirmação (`SavedPanel`) visível para o registro em si (que já está
salvo), sinalizar que aquele anexo específico não foi salvo, e oferecer nova tentativa — sem
reabrir o drawer nem perder o texto/demais anexos já persistidos.
