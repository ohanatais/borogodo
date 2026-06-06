# 002 — Esqueleto do Painel

## O que é

A tela principal do produto após o login. Não é um dashboard de métricas — é um **espelho vivo**: a pessoa abre e vê a si mesma, não uma lista de funcionalidades.

O painel existe em três estados dependendo do volume de dados:

| Estado | Condição | O que mostrar |
|---|---|---|
| `vazio` | 0 entradas (não deveria acontecer se onboarding funcionou) | Prompt direto para onboarding |
| `inicial` | 1–3 entradas | "Seu espelho está tomando forma" + CTA para adicionar mais |
| `ativo` | 4+ entradas | Espelho parcial + entradas recentes + próximo passo |

---

## Decisões de produto

- O painel nunca mostra números vazios ("0 entradas"). Se não tem dados, mostra o que fazer agora.
- A ação principal sempre visível: `[+ Adicionar entrada]`
- O espelho (insight) fica no topo — é o que diferencia o produto de um diário
- Entradas recentes ficam abaixo, no máximo 3, com link para ver todas
- Sem sidebar, sem nav complexa no MVP — foco total no conteúdo

---

## Fluxo de navegação

```
Login → verifica onboarding_completed
  ├── false → /onboarding
  └── true  → /painel

/painel
  ├── conta entradas do usuário
  │   ├── 0 → estado vazio (redirect para onboarding ou prompt inline)
  │   ├── 1–3 → estado inicial
  │   └── 4+ → estado ativo
  └── renderiza componentes conforme estado
```

---

## Layout e hierarquia visual

```
┌─────────────────────────────────────────────────────┐
│ [logo]                              [avatar/logout] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Oi, Ana.                                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ESPELHO                                    │   │
│  │                                             │   │
│  │  Você decide bem sob pressão. Aparece em   │   │
│  │  3 das suas 5 entradas, sempre com         │   │
│  │  contexto de incerteza.          [Ver mais] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Últimas entradas                    [Ver todas]   │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📝  Migração do banco concluída   03 jun      │ │
│  │ 🎙️  Reunião de alinhamento...     01 jun      │ │
│  │ 📄  LinkedIn importado            30 mai      │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │        + Adicionar entrada                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Estados do MirrorCard

### Estado inicial (1–3 entradas)
```
┌──────────────────────────────────────────────────┐
│  Seu espelho está tomando forma.                 │
│                                                  │
│  Já consigo ver algumas coisas, mas quanto       │
│  mais você capturar, mais nítido fica.           │
│                                                  │
│  [Ver o que já encontrei]                        │
└──────────────────────────────────────────────────┘
```

### Estado ativo (4+ entradas) — mostra primeiro insight
```
┌──────────────────────────────────────────────────┐
│  💡 Força detectada                              │
│                                                  │
│  Você decide bem sob pressão. Esse padrão        │
│  aparece em 3 das suas 5 entradas — sempre       │
│  com contexto de incerteza e prazo curto.        │
│                                                  │
│  [Ver espelho completo]                          │
└──────────────────────────────────────────────────┘
```

---

## Schema — queries necessárias

```typescript
// Dados que o painel precisa buscar (server component)

// 1. Contagem de entradas
const { count } = await supabase
  .from('entries')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)

// 2. Últimas 3 entradas
const { data: recentEntries } = await supabase
  .from('entries')
  .select('id, what_i_did, source, entry_date, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(3)

// 3. Snapshot mais recente do espelho (se existir)
const { data: mirrorSnapshot } = await supabase
  .from('mirror_snapshots')
  .select('primary_strength, generated_at')
  .eq('user_id', userId)
  .order('generated_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

---

## Estrutura de arquivos

```
src/
  app/
    (app)/
      painel/
        page.tsx              ← PainelPage (server component, async)
        loading.tsx           ← Suspense fallback (skeleton)
  components/
    features/
      painel/
        MirrorCard.tsx        ← card do espelho (varia por estado)
        MirrorCardEmpty.tsx   ← estado sem dados
        MirrorCardInitial.tsx ← 1–3 entradas
        MirrorCardActive.tsx  ← 4+ entradas com insight
        RecentEntries.tsx     ← lista de entradas recentes
        EntryItem.tsx         ← item individual da lista
        AddEntryButton.tsx    ← CTA principal (sempre visível)
      layout/
        AppHeader.tsx         ← header com logo + avatar
```

---

## PainelPage (server component)

```typescript
// src/app/(app)/painel/page.tsx
import { createServerClient } from '@/lib/db/supabase/server'
import { redirect } from 'next/navigation'
import { MirrorCard } from '@/components/features/painel/MirrorCard'
import { RecentEntries } from '@/components/features/painel/RecentEntries'
import { AddEntryButton } from '@/components/features/painel/AddEntryButton'

export default async function PainelPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [countResult, entriesResult, mirrorResult] = await Promise.all([
    supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('entries').select('id, what_i_did, source, entry_date, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('mirror_snapshots').select('primary_strength, generated_at')
      .eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const entryCount = countResult.count ?? 0
  const recentEntries = entriesResult.data ?? []
  const latestMirror = mirrorResult.data

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-2xl text-foreground">
        Oi, {user.user_metadata?.full_name?.split(' ')[0] ?? 'você'}.
      </h1>

      <MirrorCard entryCount={entryCount} latestMirror={latestMirror} />

      <RecentEntries entries={recentEntries} />

      <AddEntryButton />
    </main>
  )
}
```

---

## Loading skeleton (loading.tsx)

```typescript
// src/app/(app)/painel/loading.tsx
export default function PainelLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      <div className="h-32 bg-muted animate-pulse rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </main>
  )
}
```

---

## MirrorCard (lógica de estado)

```typescript
// src/components/features/painel/MirrorCard.tsx
import { MirrorCardEmpty } from './MirrorCardEmpty'
import { MirrorCardInitial } from './MirrorCardInitial'
import { MirrorCardActive } from './MirrorCardActive'

type Props = {
  entryCount: number
  latestMirror: { primary_strength: string; generated_at: string } | null
}

export function MirrorCard({ entryCount, latestMirror }: Props) {
  if (entryCount === 0) return <MirrorCardEmpty />
  if (entryCount < 4 || !latestMirror) return <MirrorCardInitial entryCount={entryCount} />
  return <MirrorCardActive mirror={latestMirror} />
}
```

---

## Microcopy

| Contexto | Texto |
|---|---|
| Saudação | "Oi, {nome}." |
| Mirror vazio | "Seu espelho está pronto para o primeiro reflexo." |
| Mirror inicial (1–3 entradas) | "Seu espelho está tomando forma. Quanto mais você capturar, mais nítido fica." |
| Mirror ativo | "💡 Força detectada" (label) |
| CTA ver espelho | "Ver espelho completo" |
| CTA adicionar | "+ Adicionar entrada" |
| Entradas recentes | "Últimas entradas" |
| Link ver todas | "Ver todas" |
| Ícone por fonte | 📝 texto · 🎙️ áudio · 📄 arquivo |

---

## Fora do escopo neste bloco

- Espelho completo (/espelho — vem depois)
- Filtros de entradas
- Exportação de dados
- Configurações de conta
- Notificações ou badges
- Métricas numéricas ("X entradas esta semana")
