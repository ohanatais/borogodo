# Data Model: Registro como Depósito (fundação)

**Nenhuma migration nova.** Todas as entidades abaixo já existem no schema (Supabase Postgres);
este documento descreve como esta feature as usa e quais campos passam a ser preenchidos por um
caminho novo (sem IA), não uma alteração de estrutura.

## Entidade: `entries` (tabela `public.entries`)

Já existe desde `001_entries.sql`, estendida por migrations posteriores. Colunas relevantes para
esta feature:

| Coluna | Tipo | Origem nesta feature |
|---|---|---|
| `id` | `uuid` (PK) | gerado pelo banco |
| `user_id` | `uuid` (FK auth.users) | sessão autenticada |
| `what_i_did` | `text not null` | texto cru do drawer, **verbatim**, sem truncar (FR-003) |
| `title` | `text` (migration `012_entry_title.sql`) | **heurística local** (`buildEntryTitle`, ver `research.md` §3), não mais gerado por IA síncrona neste caminho — editável (FR-010) |
| `raw_content` | `text` | mesmo texto cru (mantém padrão de preenchimento já existente em outros caminhos de captura) |
| `metric`, `impact`, `tags`, `company`, `entry_date` | tipos variados, todos opcionais | preenchidos manualmente via "+ adicionar detalhes" (US4/FR-019), **verbatim**, sem qualquer chamada de IA — `decision`/`learning` seguem fora do escopo desta feature (não expostos no drawer) |
| `source` | `text not null` | novo valor de enum lógico, ex.: `'deposito'` — distingue este caminho de `'text'`/`'audio'`/`'linkedin_pdf'`/`'chips'`/`'image'` já existentes, sem alterar o tipo da coluna (é `text`, não enum de banco) |
| `evidences` | `jsonb not null default '[]'` (migration `007_entry_evidences.sql`) | populada via chamadas subsequentes a `POST /api/entries/[id]/evidence` (ver `research.md` §2), não no insert inicial |
| `created_at`, `updated_at` | `timestamptz` | automáticos |

**Validação de entrada** (na nova função `saveDeposito`, não no schema Zod de extração de IA):
- `rawText`: não-vazio após `trim()` (mínimo 1 caractere não-espaço) — não há limite máximo
  imposto por esta feature além do já existente `MAX_TEXT_LENGTH = 20_000` (mantido como piso
  técnico, não gate de produto).
- Campos manuais (`metric`, `impact`, `tags`, `company`, `entryDate`): todos opcionais, sem
  validação de conteúdo além de tipo/tamanho básico (string) — são texto livre digitado pela
  pessoa, não output de IA a validar contra um schema de extração.

**Sem mudança de estado/lifecycle**: uma entry criada pelo depósito é imutável em `source`, mas
`title`/`metric`/`impact`/`tags`/`company`/`entry_date`/`evidences` continuam editáveis depois de
salva (já é o comportamento de `/registros` e `/historico`, reusado sem mudança).

## Entidade: Evidência (`evidences` JSONB dentro de `entries`)

Já existe (migration `007`). Formato usado tanto por esta feature quanto por `/historico`:

```ts
// src/lib/historico/getHistoricoData.ts (já existente, reusado sem mudança)
interface EvidenceItem {
  type: 'url' | 'image'
  value: string    // URL pública (bucket evidence-files) para imagem; a própria URL para link
  label?: string    // domínio/título reconhecível para link; opcional para imagem
}
```

- Persistência: array append via `POST /api/entries/[id]/evidence` (rota existente, **sem
  alteração**) — um `POST` por anexo, chamado pelo cliente do drawer depois que a entry já tem
  `id` (ver `research.md` §2).
- Remoção antes de salvar (FR-007): puramente client-side — anexo removido do estado local do
  drawer antes do clique em "Registrar" nunca gera um `POST`, então nunca é persistido. Não há
  rota de "cancelar anexo" no servidor porque não há nada a cancelar (upload só acontece após o
  clique em Registrar).
- Bucket `evidence-files` (Storage): público, 10 MB máx, `image/jpeg|png|webp|gif` — limites já
  aplicados pela rota existente, reusados sem mudança. Path de upload: `${user.id}/${entryId}/
  ${timestamp}` (padrão já existente).

## Entidade: `NavDestino` / `NavGroup` (modelo de navegação, não é dado persistido)

Estrutura em memória (`src/components/layout/navModel.ts`), sem relação com banco de dados:

```ts
interface NavDestino {
  id: string
  labelKey: string       // chave i18n, namespace `appNav`
  icon: LucideIcon
  path?: string           // ausente para itens que são ação (ex.: "Perguntar"), não navegação
  activePrefixes?: string[]
  action?: 'open-chat'    // novo campo: distingue destino-de-rota de ação-overlay
}

interface NavGroup {
  id: 'meuEspelho' | 'usar'
  labelKey: string        // chave i18n, namespace `appNav`
  items: NavDestino[]
}
```

- `NAV_DESTINOS` (lista plana, já existente) continua servindo a tab bar mobile (FR-025) — mantém
  4 itens (Painel, Espelho, Registros, Usar).
- `NAV_GROUPS` (novo) serve a sidebar desktop — dois grupos (`meuEspelho`: Perfil, Trajetória,
  Registros; `usar`: Gerar conteúdo, Me preparar, Perguntar), mais "Painel" e "Registrar" isolados
  no topo (fora de qualquer grupo).
- Sem persistência — puramente estrutura de UI.

## Resumo de impacto no schema

| Mudança | Migration nova? |
|---|---|
| Novo valor lógico `source = 'deposito'` | Não — `source` já é `text` livre, sem `CHECK` constraint de enum |
| Uso de `title` preenchido por heurística em vez de IA | Não — mesma coluna, mesmo tipo, mesmo limite (80 chars) |
| Uso de `evidences`/bucket para anexos no drawer | Não — infraestrutura de `007` reusada como está |
| Nenhuma coluna nova, nenhuma tabela nova, nenhuma policy RLS nova | Confirmado |
