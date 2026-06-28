# Phase 1 — Data Model: Navegação que expressa a espinha

> **Sem persistência nova.** Esta feature não cria tabela, coluna nem entidade de banco. O
> "modelo" aqui é o **estado de navegação** em memória/URL que orienta a UI. Registrado para o
> `/speckit-tasks` derivar tipos e testes.

## Entidade: Destino de navegação (`NavDestino`)

Item de topo do menu. Configuração estática (não vem do banco).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `'painel' \| 'espelho' \| 'registros' \| 'usar'` | Quatro destinos (era 6). |
| `labelKey` | `string` | Chave i18n em `appNav.*` (não string crua — constituição IX). |
| `icon` | `LucideIcon` | Ícone do destino. |
| `path` | `string` | Rota base (`/painel`, `/espelho`, `/registros`, `/usar`). |
| `activePrefixes` | `string[]` | Prefixos que acendem o destino. Ex.: `usar` → `['/usar','/presenca','/autoavaliacao']`; `espelho` → `['/espelho']` (cobre `?vista=trajetoria`). |

Regra: `isActive(destino, pathname)` = algum `activePrefixes` é prefixo do `pathname`. Substitui o
`pathname.includes(path)` solto (R3).

## Entidade: Vista do Espelho (`EspelhoVista`)

Estado de qual perspectiva do Espelho está aberta. Vive na **URL** (`?vista=`), não no banco.

| Valor | Significado | Dados buscados (no servidor, condicional) |
|---|---|---|
| `forcas` (default) | A revelação atual (`MirrorContent`) | `getLatestSnapshot` |
| `trajetoria` | O mapa de carreira (re-parenta `HistoricoPageClient`) | `getHistoricoData` |

Regras:
- Sem `?vista` ou valor inválido → `forcas`.
- Só a vista ativa é buscada (FR-010): a página não chama as duas queries.
- A vista de Trajetória **não** altera o pathname (`/espelho`), então o destino "Espelho"
  permanece ativo no menu.

## Entidade: Intenção de Usar (`UsarIntencao`)

Bifurcação dentro da landing `/usar`. Efêmera (escolha de clique), sem persistência.

| Valor | Leva para |
|---|---|
| `mostrar` (pra fora) | `/presenca` (Repertório — gerar conteúdo) |
| `preparar` (pra dentro) | `/autoavaliacao` (como existe hoje) |

## Invariantes

- Nenhuma capacidade existente é removida: toda função alcançável antes segue alcançável (SC-003).
- `impact_summary` permanece no enum `DraftFormat` e no banco; só sai das listas oferecidas
  (`ENTRY_FORMATS`, `NUDGE_FORMATS`) — não é mudança de modelo de dados, é mudança de UI.
- Nenhuma query nova por usuário além das já existentes (todas já filtram `user_id` via RLS).
