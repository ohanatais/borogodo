# 003 — Onboarding (Primeira corrida da superfície de captura)

## O que é

O onboarding **não é uma tela separada** — é a primeira vez que a pessoa usa a superfície de captura (composer + conversa de captura, definida no doc 002). Ela escolhe uma modalidade de entrada, o produto reflete de volta um diagnóstico, e ao final gera o primeiro espelho (doc 005) e entrega no painel (doc 002).

> **A mesma superfície, dois contextos:** no onboarding ela aparece em tela cheia e guiada; no painel ela mora ancorada no rodapé. O gesto que a pessoa aprende aqui é o que ela usa pra sempre.

O caminho de maior impacto é o **LinkedIn PDF**: uma ação gera 5–15 entradas ricas e alimenta o primeiro espelho na mesma sessão.

---

## Decisões de produto

| Decisão | Escolha | Motivo |
|---|---|---|
| Onboarding = | primeira corrida da captura | Não duplicar superfícies; ensinar o gesto central |
| Três modalidades | LinkedIn PDF · áudio · perguntas guiadas | Cada uma é um "modo" do composer |
| Modalidade destacada | LinkedIn PDF | Menos esforço, mais dado |
| Resolução de arquivo | Revisão antes de confirmar | Import em lote (muitas entradas) pede revisão |
| Resolução de texto/áudio único | Salva + reflete (sem gate) | Captura sem fricção |
| Fim do onboarding | Primeiro espelho revelado → painel | O "aha!" tem que acontecer nesta sessão |

---

## Fluxo completo

```
/onboarding
  │
  └── Tela 1: Seleção de modalidade
      ┌──────────────────────────────────────────┐
      │  Como você quer começar?                 │
      │  ┌──────────────────────┐               │
      │  │  📄  PDF do LinkedIn  │ ← destaque   │
      │  │  Importa tudo agora   │              │
      │  └──────────────────────┘               │
      │  🎙️ Gravar áudio   💬 Perguntas guiadas  │
      └──────────────────────────────────────────┘
          │
          ├── [LinkedIn PDF]  → upload → CaptureConversation (revisão em lote)
          ├── [Áudio]         → grava   → CaptureConversation (reflexo)
          └── [Perguntas]     → chips   → CaptureConversation (reflexo) [doc futuro]
              │
              └── Entradas salvas
                  │
                  └── "Gerar meu espelho →"
                      │
                      └── POST /api/mirror/generate (Sonnet, doc 005)
                          │
                          └── /onboarding/espelho — revelação progressiva
                              │
                              └── [Sim, faz sentido] → /painel (populado, composer no rodapé)
```

O áudio e as perguntas usam o **mesmo `CaptureConversation`** do painel. Só o LinkedIn PDF tem o passo de revisão em lote descrito abaixo.

---

## Caminho LinkedIn PDF

### Tela de upload

```
┌─────────────────────────────────────────────────────┐
│  Exporte seu perfil do LinkedIn e traga aqui.      │
│  ┌─────────────────────────────────────────────┐   │
│  │          📄                                 │   │
│  │   Arraste o PDF aqui                        │   │
│  │   ou clique para escolher                   │   │
│  └─────────────────────────────────────────────┘   │
│  ▾ Como exportar do LinkedIn                       │
│    1. Acesse seu perfil                            │
│    2. "Mais" → "Salvar como PDF"                   │
│    3. Baixe e arraste aqui                         │
│  Seus dados ficam só com você. Sempre.             │
└─────────────────────────────────────────────────────┘
```

Validações client-side: só `.pdf`, máx 10 MB.

### Processamento — animação (não spinner)

```
✓  Encontrei 4 experiências profissionais
✓  Detectei skills em produto e liderança
⟳  Estruturando entradas...
```

Stagger via Framer Motion. A pessoa vê o produto "lendo".

### Revisão em lote (o reflexo do import de arquivo)

Diferente da captura única: como o PDF gera muitas entradas, mostra-se um **diagnóstico do conjunto** + revisão antes de confirmar.

```
┌─────────────────────────────────────────────────────┐
│  Encontrei 6 experiências.                         │
│                                                     │
│  • produto  • liderança  • 0→1  • discovery        │  ← pílulas do conjunto
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Product Manager · Empresa X · 2022–2024      │  │
│  │ Liderou o lançamento de 3 features...        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Analista de Produto · Empresa Y · 2020–2022  │  │
│  └──────────────────────────────────────────────┘  │
│  ... +4 mais                                        │
│                                                     │
│  [Parece certo, gerar meu espelho →]               │
│  [Revisar cada entrada]                            │
└─────────────────────────────────────────────────────┘
```

---

## API Route: import do LinkedIn

```typescript
// src/app/api/onboarding/linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf/extractText'
import { extractFromLinkedIn } from '@/lib/ai/extraction/extractFromLinkedIn'
import { saveEntries } from '@/lib/db/entries'
import { createServerClient } from '@/lib/db/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file || file.type !== 'application/pdf')
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'Arquivo muito grande (máx 10 MB)' }, { status: 400 })

  const rawText = await extractTextFromPDF(Buffer.from(await file.arrayBuffer()))
  const entries = await extractFromLinkedIn(rawText)          // Haiku — só extração, sem reflexo individual
  const saved = await saveEntries(entries, user.id)

  await supabase.from('profiles').update({ onboarding_started: true }).eq('id', user.id)

  // pílulas do conjunto = união das tags
  const themes = Array.from(new Set(saved.flatMap(e => e.tags))).slice(0, 6)

  return NextResponse.json({ entries: saved, count: saved.length, themes })
}
```

> **Nota:** o import do LinkedIn usa só a **extração** do pipeline (doc 004), não o reflexo individual por entrada — o "reflexo" aqui é o diagnóstico do conjunto (contagem + pílulas). Já a captura avulsa de texto/áudio no painel usa o pipeline completo (extração + reflexo), via `/api/capture`.

---

## Extração de texto do PDF

```bash
npm install pdf-parse && npm install -D @types/pdf-parse
```

```typescript
// src/lib/pdf/extractText.ts
import pdfParse from 'pdf-parse'
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}
```

---

## LinkedInUpload (dropzone)

```typescript
// src/components/features/onboarding/LinkedInUpload.tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function LinkedInUpload() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    if (file.type !== 'application/pdf') return setError('Por favor, envie um PDF.')
    if (file.size > 10 * 1024 * 1024) return setError('Máximo: 10 MB.')

    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/onboarding/linkedin', { method: 'POST', body: fd })
    if (!res.ok) {
      setError((await res.json()).error ?? 'Algo deu errado. Tenta de novo.')
      setIsUploading(false)
      return
    }
    const { count } = await res.json()
    router.push(`/onboarding/revisao?count=${count}`)
  }, [router])

  // ... dropzone JSX (igual versão anterior: drag/drop + input file)
}
```

---

## Estrutura de arquivos

```
src/app/(app)/onboarding/
  page.tsx               ← seleção de modalidade
  linkedin/page.tsx      ← upload
  processando/page.tsx   ← animação
  revisao/page.tsx       ← revisão em lote
  espelho/page.tsx       ← revelação (doc 005)
src/components/features/onboarding/
  ModeSelector.tsx
  LinkedInUpload.tsx
  ProcessingStatus.tsx
  BatchReviewList.tsx    ← lista + pílulas do conjunto
  EntryReviewCard.tsx
src/lib/pdf/
  extractText.ts
  detectLinkedIn.ts
# áudio e perguntas reutilizam components/features/capture/* (doc 002)
```

---

## Schema — tabela `entries`

```sql
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  what_i_did text not null,
  decision text, learning text, impact text, metric text,
  entry_date date,
  tags text[] default '{}',
  source text not null,         -- 'linkedin_pdf'|'audio'|'text'|'chips'|'image'
  raw_content text,
  company text, role_title text, role_start date, role_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.entries enable row level security;
create policy "own entries" on public.entries for all using (auth.uid() = user_id);
create index entries_user_created_idx on public.entries(user_id, created_at desc);
```

---

## Microcopy

| Contexto | Texto |
|---|---|
| Seleção de modalidade | "Como você quer começar?" |
| Headline upload | "Exporte seu perfil do LinkedIn e traga aqui." |
| Processando | "Lendo seu perfil..." |
| Encontrou | "Encontrei {n} experiências." |
| CTA gerar | "Parece certo, gerar meu espelho →" |
| CTA revisar | "Revisar cada entrada" |
| Privacidade | "Seus dados ficam só com você. Sempre." |
| Erro PDF inválido | "Esse PDF não parece um perfil do LinkedIn. Tente exportar de novo." |

---

## Fora do escopo neste bloco

- Caminho "perguntas guiadas" detalhado (a refinar juntos depois)
- Edição campo a campo na revisão (botão existe, fluxo simplificado)
- Re-importação / atualização do LinkedIn
- Extração de recomendações do LinkedIn
