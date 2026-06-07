# 002 — Painel Principal (Espelho Vivo + Composer)

## O que é

A tela principal após o login. É ao mesmo tempo o **artefato** (o espelho que você lê) e a **superfície de captura** (o composer onde você alimenta). O gesto central do produto: você joga algo no composer embaixo, e o espelho se reorganiza acima — em tempo real.

> **Princípio de fluxo:** o composer escreve, o espelho lê. Toda captura **resolve pra cima** — vira um reflexo que atualiza os indicadores e o espelho, nunca uma bolha de chat que se acumula abaixo. O painel nunca vira um log.

### A superfície de captura é canônica e compartilhada

Os componentes `CaptureComposer` e `CaptureConversation` definidos aqui vivem em `components/features/capture/` e são **reutilizados pelo onboarding** (doc 003). O onboarding é o primeiro uso dessa superfície; o painel é onde ela mora pra sempre.

### Referências de produto

- **Oura (2025):** um insight em linguagem simples no topo, não dump de dados.
- **WHOOP Coach:** o coaching É o dado; insights proativos sem ser pedido; sem troca de contexto.
- **Spotify:** home = motor de recomendação com UI por cima, contextual por hábito.
- **Duolingo:** streak + progresso + uma ação clara.

---

## 5 princípios

1. **O painel é o espelho** — primeira coisa vista é um insight, não navegação.
2. **Indicadores que provam que o produto trabalha** — não vaidade.
3. **Inteligência proativa** — surfeia algo novo a cada visita.
4. **Captura sempre à mão** — o composer é permanente; captura a um toque.
5. **A captura resolve pra cima** — o reflexo atualiza o espelho, não empilha um log.

---

## Layout principal

```
┌──────────────────────────────────────────────────────┐
│ boro·godó                           Ana  [avatar ▾] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ● Ativo                                            │
│  Você transforma complexidade em clareza —           │
│  e faz isso melhor do que percebe.      [Espelho →] │
│                                                      │
├──────────────────────────────────────────────────────┤
│  12 entradas  ·  3 meses  ·  4 forças  ·  há 2 dias │  ← anima ao capturar
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✦  Detectei algo novo esta semana                  │
│  ┌────────────────────────────────────────────────┐ │
│  │ Você mediou conflito entre áreas em 4          │ │
│  │ situações. Nunca chamou de força — mas é.      │ │
│  │                              [Ver contexto →]  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Últimas entradas                      [Ver todas]  │
│  ── Migração do banco concluída  ·  03 jun  📄      │
│  ── Reunião de alinhamento       ·  01 jun  🎙️      │
│  ── LinkedIn importado           ·  30 mai  📄      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  💬 Faz 2 dias. O que rolou no trabalho?            │  ← COMPOSER (fixo)
│     [🎙️]  [📎]  [🖼️]                    [enviar →] │
└──────────────────────────────────────────────────────┘
```

O composer fica ancorado no rodapé do painel, sempre visível. A CTA contextual (doc original) vira o **placeholder** do composer.

---

## O round-trip de captura (o coração do produto)

```
1. Usuário digita / grava / anexa no composer
         │
2. Abre a CaptureConversation (sheet focado, toma a tela)
   "Lendo o que você me contou..."  (animação, não spinner)
         │
3. POST /api/capture  → Haiku extrai entrada + gera reflexo
         │
4. Reflexo aparece (diagnóstico):
   ┌──────────────────────────────────────────┐
   │ Entendi:                                 │
   │ Você concluiu a migração sob prazo       │
   │ apertado — e deu certo.                  │
   │                                          │
   │  • decisão sob pressão  • entrega técnica│
   │                                          │
   │ Tem um número de impacto? Mesmo estimado.│
   │   [responder]        [salvar assim]      │
   └──────────────────────────────────────────┘
         │
5. Entrada já foi salva (captura sem fricção). Responder enriquece.
         │
6. Sheet colapsa → router.refresh()
   → indicadores sobem (12→13, "capturou hoje ✓")
   → nova pílula de força pode aparecer
   → espelho (headline) regenera se cruzou limiar (ver doc 005)
```

> **Decisão de fricção:** capturas únicas (texto/áudio/imagem) **salvam na hora** e o reflexo aparece depois — sem gate de confirmação. Imports em lote (arquivo com muitas entradas, ex. LinkedIn) mostram **revisão antes de confirmar**. Mesma superfície, resolução diferente conforme o volume.

---

## Componente: CaptureComposer

```
src/components/features/capture/CaptureComposer.tsx
```

Barra de input multimodal ancorada no rodapé.

```typescript
'use client'
import { useState, useRef } from 'react'
import { Mic, Paperclip, ImageIcon, ArrowUp } from 'lucide-react'
import { CaptureConversation } from './CaptureConversation'

interface Props {
  placeholder: string   // a CTA contextual (vem do server: dias desde última captura)
}

export function CaptureComposer({ placeholder }: Props) {
  const [text, setText] = useState('')
  const [activeCapture, setActiveCapture] = useState<CaptureInput | null>(null)

  const handleSubmit = () => {
    if (!text.trim()) return
    setActiveCapture({ kind: 'text', content: text })
    setText('')
  }

  const handleFile = (file: File) => {
    const kind = file.type.startsWith('image/') ? 'image' : 'file'
    setActiveCapture({ kind, file })
  }

  const handleAudio = (blob: Blob) => {
    setActiveCapture({ kind: 'audio', blob })
  }

  return (
    <>
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-2xl px-4 py-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </div>
          <AudioButton onRecorded={handleAudio} />
          <FileButton accept=".pdf,.md,.docx,.txt" icon={Paperclip} onFile={handleFile} />
          <FileButton accept="image/*" icon={ImageIcon} onFile={handleFile} />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {activeCapture && (
        <CaptureConversation
          input={activeCapture}
          onResolved={() => setActiveCapture(null)}
        />
      )}
    </>
  )
}
```

---

## Componente: CaptureConversation

```
src/components/features/capture/CaptureConversation.tsx
```

O sheet focado que abre durante a captura, mostra o reflexo (diagnóstico) e resolve.

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { CaptureInput, Reflection } from '@/types/capture'

interface Props {
  input: CaptureInput
  onResolved: () => void
}

export function CaptureConversation({ input, onResolved }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<'reading' | 'reflecting' | 'error'>('reading')
  const [reflection, setReflection] = useState<Reflection | null>(null)
  const [entryId, setEntryId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const formData = buildFormData(input)
      const res = await fetch('/api/capture', { method: 'POST', body: formData })
      if (!res.ok) { setPhase('error'); return }
      const data = await res.json()       // { entries, reflection }
      setReflection(data.reflection)
      setEntryId(data.entries[0]?.id ?? null)
      setPhase('reflecting')
      router.refresh()                     // indicadores sobem no painel atrás
    }
    run()
  }, [input])

  const handleEnrich = async (answer: string) => {
    if (entryId) {
      await fetch(`/api/entries/${entryId}/enrich`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, field: reflection?.move.field }),
      })
      router.refresh()
    }
    onResolved()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center px-4"
    >
      {phase === 'reading' && <ReadingState />}
      {phase === 'reflecting' && reflection && (
        <ReflectionCard
          reflection={reflection}
          onEnrich={handleEnrich}
          onDismiss={onResolved}
        />
      )}
      {phase === 'error' && <CaptureError onRetry={() => setPhase('reading')} onClose={onResolved} />}
    </motion.div>
  )
}
```

O `Reflection`, `CaptureInput` e a API `/api/capture` são definidos no doc 004 (pipeline). O `ReflectionCard` renderiza resumo + pílulas + o movimento.

---

## Atualização viva do painel — o que muda quando

| Elemento | Velocidade | Gatilho |
|---|---|---|
| Strip de indicadores (N entradas, há X dias) | **Instantâneo** | `router.refresh()` após captura |
| Pílulas de força (no espelho/indicadores) | **Instantâneo** | reflexo do Haiku já traz tags novas |
| Card de insight proativo | **Quase instantâneo** | job Haiku roda ao salvar entrada |
| Headline do espelho | **Por limiar** | regenera a cada N entradas ou ao abrir `/espelho` (doc 005) |

O "ver as mudanças acontecendo" é entregue pelos três primeiros (instantâneos via Haiku). A headline (Sonnet) muda com menos frequência — de propósito, por custo e porque uma síntese profunda não deve oscilar a cada frase.

---

## Estados por volume de dados

| Estado | Condição | Pill | Indicadores | Insight proativo |
|---|---|---|---|---|
| **Construindo** | 1–3 entradas | 🟠 Em construção | entradas + dias | "Adicione mais 2 entradas pro espelho emergir" |
| **Emergindo** | 4–9 entradas | 🟡 Tomando forma | todos os 4 | Primeira força detectada |
| **Ativo** | 10+ entradas | 🟢 Ativo | todos + streak | Insight rotativo (novo por visita) |

```typescript
function getMirrorStatus(entryCount: number): 'building' | 'emerging' | 'active' {
  if (entryCount < 4)  return 'building'
  if (entryCount < 10) return 'emerging'
  return 'active'
}

const STATUS_CONFIG = {
  building: { dot: 'bg-orange-500', label: 'Em construção' },
  emerging: { dot: 'bg-amber-500',  label: 'Tomando forma' },
  active:   { dot: 'bg-green-500',  label: 'Ativo' },
} as const
```

---

## Componentes do painel (read side)

### MirrorHeadline
- Extrai `primary_strength.headline` do `mirror_snapshot` mais recente.
- Pill de status cromática + frase + link `/espelho`.
- Sem mirror ainda → "Seu espelho está se formando — continue capturando."

### IndicatorStrip
```
12 entradas  ·  3 meses  ·  4 forças  ·  há 2 dias
```
| Indicador | Fonte | Mostra quando |
|---|---|---|
| N entradas | `count(entries)` | Sempre |
| X meses | `max(entry_date) - min(entry_date)` | ≥ 2 entradas datadas |
| Y forças | `count(mirror.strength_themes)` | Há mirror_snapshot |
| Há Z dias | `now() - max(created_at)` | Sempre |

Variações "há Z dias": hoje → "Capturou hoje ✓"; 1 → "Há 1 dia"; 2–6 → "Há {n} dias"; 7+ → "Há 1 semana" (sem número exato — evita culpa). Funciona como streak do Duolingo, sem cobrança.

### ProactiveInsightCard
- Surfeia um `proactive_insight` não visto. Se não há, **não renderiza** (nunca vazio).
- Tipos: skill invisível, padrão emergente, conexão, gap de evidência.

### RecentEntries
- Máx 3, abaixo da dobra. Ícone por fonte (📝/🎙️/📄/🖼️). Click expande in-place.

---

## Fluxo de dados (server component)

```typescript
// src/app/(app)/painel/page.tsx
const [countRes, entriesRes, mirrorRes, insightRes] = await Promise.all([
  supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  supabase.from('entries').select('id, what_i_did, source, entry_date, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
  supabase.from('mirror_snapshots').select('primary_strength, strength_themes, generated_at')
    .eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  supabase.from('proactive_insights').select('*')
    .eq('user_id', userId).eq('seen', false).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
])

const entryCount = countRes.count ?? 0
const lastEntry = entriesRes.data?.[0]
const daysSince = lastEntry
  ? Math.floor((Date.now() - new Date(lastEntry.created_at).getTime()) / 86400000)
  : null

const composerPlaceholder = getCapturePrompt(daysSince, mirrorRes.data?.strength_themes)
```

```typescript
// CTA contextual → placeholder do composer
function getCapturePrompt(days: number | null, themes?: string[]): string {
  if (days === null) return 'Conta uma coisa que você fez no trabalho.'
  if (days === 0) return 'Boa. Tem mais alguma coisa do dia?'
  if (days === 1) return 'O que aconteceu no trabalho ontem?'
  if (days <= 3) return `Faz ${days} dias. O que rolou no trabalho?`
  if (themes?.length) return `Sua força em "${themes[0]}" pede mais evidência. Tem algo recente?`
  return 'Uma semana é muito tempo. Conta o que você fez.'
}
```

---

## Estrutura de arquivos

```
src/
  app/(app)/
    painel/
      page.tsx              ← server component
      loading.tsx           ← skeleton
  components/features/
    capture/                ← SUPERFÍCIE COMPARTILHADA (usada também no onboarding)
      CaptureComposer.tsx   ← barra de input multimodal
      CaptureConversation.tsx ← sheet focado + reflexo
      ReflectionCard.tsx    ← resumo + pílulas + movimento
      ReadingState.tsx      ← animação "lendo..."
      AudioButton.tsx       ← grava via MediaRecorder
      FileButton.tsx        ← upload genérico
    painel/
      MirrorHeadline.tsx
      IndicatorStrip.tsx
      ProactiveInsightCard.tsx
      RecentEntries.tsx
      EntryItem.tsx
    layout/
      AppHeader.tsx
```

---

## Schema adicional

```sql
create table public.proactive_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,         -- 'invisible_skill'|'emerging_pattern'|'connection'|'evidence_gap'
  headline text not null,
  body text not null,
  entry_ids uuid[] default '{}',
  seen boolean default false,
  generated_at timestamptz default now()
);
alter table public.proactive_insights enable row level security;
create policy "own insights" on public.proactive_insights for all using (auth.uid() = user_id);
create index proactive_insights_user_unseen_idx on public.proactive_insights(user_id, seen, generated_at desc);

alter table public.mirror_snapshots add column if not exists strength_themes text[] default '{}';
```

---

## Microcopy

| Contexto | Texto |
|---|---|
| Pill construindo/emergindo/ativo | "● Em construção" / "● Tomando forma" / "● Ativo" |
| Headline sem mirror | "Seu espelho está se formando — continue capturando." |
| Composer (placeholder) | contextual via `getCapturePrompt()` |
| Reading state | "Lendo o que você me contou..." |
| Reflexo (abertura) | "Entendi:" |
| Movimento — pergunta | "Tem um número de impacto? Mesmo estimado conta." |
| Movimento — afirmação | "Isso é material de história de entrevista. Guardei." |
| Movimento — sugestão | "Isso bate com 2 outras entradas suas. Tá virando padrão." |
| Botões do reflexo | "Responder" · "Salvar assim" |
| Insight proativo (label) | "✦ Detectei algo novo esta semana" |

---

## Fora do escopo neste bloco

- Espelho completo (`/espelho`)
- Filtros/busca em entradas (`/entradas`)
- Geração de conteúdo
- Notificações push / e-mail
- Streaming token-a-token do reflexo (animação fixa no MVP)
