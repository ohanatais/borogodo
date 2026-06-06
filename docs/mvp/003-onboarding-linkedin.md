# 003 — Onboarding: Caminho LinkedIn PDF

## O que é

O caminho de maior impacto do onboarding: a pessoa faz upload do seu perfil exportado do LinkedIn e, em uma única ação, o produto ingere anos de trajetória profissional, extrai entradas estruturadas e gera o primeiro espelho.

**Por que começa por aqui:**
- Todo profissional tem o PDF disponível (Export > Save as PDF no LinkedIn)
- Zero esforço de escrita — a pessoa só faz upload
- Gera 5–15 entradas ricas imediatamente (cada cargo vira uma entrada)
- Reutiliza o pipeline de extração dos outros caminhos

---

## Decisões de produto

| Decisão | Escolha | Motivo |
|---|---|---|
| Ponto de entrada | Tela de seleção de modo | Sem presumir o formato; a pessoa escolhe |
| Formato aceito | Apenas PDF no MVP | LinkedIn só exporta PDF; outros formatos vêm depois |
| Revisão de entradas | Sim, mas simplificada | A pessoa confirma o conjunto, não edita campo a campo |
| Erros de extração | Mostrar o que encontrou + opção de continuar assim mesmo | Não bloquear o fluxo por extração imperfeita |
| Após confirmação | Vai direto para geração do espelho | O "aha!" precisa acontecer nessa sessão |

---

## Fluxo UX completo

```
/onboarding
  │
  └── Tela 1: Seleção de modo
      ┌──────────────────────────────────────────┐
      │  Como você quer começar?                 │
      │                                          │
      │  ┌──────────────────────┐               │
      │  │  📄  PDF do LinkedIn  │ ← destaque   │
      │  │  Importa tudo agora   │              │
      │  └──────────────────────┘               │
      │                                          │
      │  🎙️ Gravar áudio   💬 Perguntas guiadas  │
      └──────────────────────────────────────────┘
          │
          └── [clica em LinkedIn PDF]
              │
              └── Tela 2: Upload
                  ┌────────────────────────────────────┐
                  │  Exporte seu perfil do LinkedIn    │
                  │  e arraste aqui                    │
                  │                                    │
                  │  [área de drop / botão de upload]  │
                  │                                    │
                  │  Como exportar? [link expandível]  │
                  └────────────────────────────────────┘
                      │
                      └── Upload realizado
                          │
                          └── Tela 3: Processamento (animada)
                              "Lendo seu perfil..."
                              [barra de progresso ou animação de texto]
                              Entradas aparecem uma a uma enquanto extraem
                              │
                              └── Tela 4: Revisão
                                  "Encontrei X experiências"
                                  [lista simplificada das entradas]
                                  [Parece certo, seguir]  [Revisar antes]
                                  │
                                  └── → pipeline de extração salva
                                      → /onboarding/espelho (geração do mirror)
```

---

## Tela 2: Upload — detalhes de UX

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Exporte seu perfil do LinkedIn e traga aqui.      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │          📄                                 │   │
│  │                                             │   │
│  │   Arraste o PDF aqui                        │   │
│  │   ou clique para escolher                   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ▾ Como exportar do LinkedIn                       │
│    1. Acesse seu perfil                            │
│    2. Clique em "Mais" → "Salvar como PDF"         │
│    3. Baixe e arraste aqui                         │
│                                                     │
│  Seus dados ficam só com você. Sempre.             │
└─────────────────────────────────────────────────────┘
```

**Validações client-side:**
- Aceita apenas `.pdf`
- Tamanho máximo: 10 MB
- Se o arquivo não for um PDF do LinkedIn (detectado depois da extração), mostra mensagem clara: "Esse PDF não parece um perfil do LinkedIn. Tente exportar novamente."

---

## Tela 3: Processamento — animação

Não mostrar um spinner genérico. Mostrar o produto "trabalhando":

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Lendo seu perfil...                               │
│                                                     │
│  ✓  Encontrei 4 experiências profissionais         │
│  ✓  Detectei skills em produto e liderança         │
│  ⟳  Estruturando entradas...                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Cada linha aparece com delay (Framer Motion stagger). A pessoa vê que algo real está acontecendo, não uma caixa preta.

---

## Tela 4: Revisão — simplificada

O objetivo não é edição linha a linha — é confirmação rápida:

```
┌─────────────────────────────────────────────────────┐
│  Encontrei 6 experiências                          │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Product Manager · Empresa X · 2022–2024      │  │
│  │ Liderou o lançamento de 3 features...        │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Analista de Produto · Empresa Y · 2020–2022  │  │
│  │ Estruturou o processo de discovery...        │  │
│  └──────────────────────────────────────────────┘  │
│  ... +4 mais                                        │
│                                                     │
│  [Parece certo, gerar meu espelho →]               │
│  [Revisar cada entrada]                            │
└─────────────────────────────────────────────────────┘
```

---

## Estrutura de arquivos

```
src/
  app/
    (app)/
      onboarding/
        page.tsx               ← OnboardingPage: seleção de modo
        linkedin/
          page.tsx             ← LinkedInUploadPage
        processando/
          page.tsx             ← ProcessingPage (polling / streaming)
        revisao/
          page.tsx             ← ReviewPage
        espelho/
          page.tsx             ← MirrorRevealPage (ver doc 005)
  components/
    features/
      onboarding/
        ModeSelector.tsx       ← três opções de entrada
        LinkedInUpload.tsx     ← dropzone + instruções
        ProcessingStatus.tsx   ← animação de progresso
        EntryReviewList.tsx    ← lista de entradas extraídas
        EntryReviewCard.tsx    ← card individual de revisão
  lib/
    pdf/
      extractText.ts          ← extrai texto bruto do PDF
      detectLinkedIn.ts       ← valida se é um PDF do LinkedIn
```

---

## Extração de texto do PDF (client-side vs server-side)

**Decisão: server-side via API Route**

Razões:
- PDFs grandes podem travar o browser
- A chave da Anthropic não pode ficar no client
- Processamento centralizado = logs e auditoria

```typescript
// src/app/api/onboarding/linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdf/extractText'
import { extractEntriesFromLinkedIn } from '@/lib/ai/extractFromLinkedIn'
import { createServerClient } from '@/lib/db/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 10 MB)' }, { status: 400 })
  }

  // Extrai texto do PDF
  const arrayBuffer = await file.arrayBuffer()
  const rawText = await extractTextFromPDF(Buffer.from(arrayBuffer))

  // Extrai entradas estruturadas com Claude Haiku
  const entries = await extractEntriesFromLinkedIn(rawText, user.id)

  // Salva no banco
  const { data: savedEntries, error } = await supabase
    .from('entries')
    .insert(entries)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar entradas' }, { status: 500 })
  }

  // Marca onboarding como iniciado (não completo ainda)
  await supabase
    .from('profiles')
    .update({ onboarding_started: true })
    .eq('id', user.id)

  return NextResponse.json({ entries: savedEntries, count: savedEntries.length })
}
```

---

## Biblioteca para extração de PDF

Usar `pdf-parse` (leve, server-side, sem dependências nativas):

```bash
npm install pdf-parse
npm install -D @types/pdf-parse
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

## LinkedInUpload (componente de dropzone)

```typescript
// src/components/features/onboarding/LinkedInUpload.tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function LinkedInUpload() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (file.type !== 'application/pdf') {
      setError('Por favor, envie um arquivo PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo é muito grande. Máximo: 10 MB.')
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/onboarding/linkedin', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json()
      setError(data.error ?? 'Algo deu errado. Tente de novo.')
      setIsUploading(false)
      return
    }

    // Redireciona para revisão passando count via query
    const { count } = await response.json()
    router.push(`/onboarding/revisao?count=${count}`)
  }, [router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      }`}
    >
      {isUploading ? (
        <p className="text-muted-foreground">Enviando...</p>
      ) : (
        <>
          <span className="text-4xl">📄</span>
          <p className="mt-4 font-medium">Arraste o PDF aqui</p>
          <p className="text-sm text-muted-foreground mt-1">ou</p>
          <label className="mt-3 inline-block cursor-pointer text-primary underline underline-offset-2 text-sm">
            escolha o arquivo
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </>
      )}
    </div>
  )
}
```

---

## Schema — tabela `entries`

```sql
create table public.entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  -- Conteúdo estruturado
  what_i_did    text not null,
  decision      text,
  learning      text,
  impact        text,
  metric        text,

  -- Metadados
  entry_date    date,               -- data da experiência (não da captura)
  tags          text[] default '{}',
  source        text not null,      -- 'linkedin_pdf' | 'audio' | 'text' | 'chips'
  raw_content   text,               -- texto original antes da extração

  -- Para o LinkedIn: dados de cargo
  company       text,
  role_title    text,
  role_start    date,
  role_end      date,

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS
alter table public.entries enable row level security;

create policy "Usuário acessa só as próprias entradas"
  on public.entries for all
  using (auth.uid() = user_id);

-- Índices
create index entries_user_id_idx on public.entries(user_id);
create index entries_created_at_idx on public.entries(user_id, created_at desc);
```

---

## Microcopy

| Contexto | Texto |
|---|---|
| Headline upload | "Exporte seu perfil do LinkedIn e traga aqui." |
| Instrução | "Arraste o PDF aqui ou clique para escolher." |
| Instrução expandível | "Como exportar? (3 passos)" |
| Processando | "Lendo seu perfil..." |
| Encontrou | "Encontrei {n} experiências" |
| CTA revisão | "Parece certo, gerar meu espelho →" |
| CTA revisão alternativa | "Revisar cada entrada" |
| Nota de privacidade | "Seus dados ficam só com você. Sempre." |
| Erro PDF inválido | "Esse PDF não parece um perfil do LinkedIn. Tente exportar novamente." |
| Erro tamanho | "O arquivo é muito grande. Máximo: 10 MB." |

---

## Fora do escopo neste bloco

- Upload de outros formatos (curriculum Word, PDF genérico) — v2
- Edição campo a campo na revisão — pode vir depois
- Re-importação (atualizar perfil LinkedIn) — v2
- Progress bar com porcentagem real — usar animação fixa no MVP
- Extração de recomendações do LinkedIn — v2
