# 004 — Pipeline de Extração (Claude Haiku)

## O que é

O serviço central que transforma conteúdo bruto (texto de PDF, transcrição de áudio, chips + texto do onboarding) em entradas estruturadas no esquema do Borogodó.

É reutilizado pelos três caminhos de entrada: LinkedIn PDF, áudio e perguntas guiadas.
Usa Claude Haiku (velocidade + custo) para extração. Sonnet é reservado para o espelho.

---

## Esquema de uma entrada estruturada

```typescript
// src/types/entry.ts

export type EntrySource = 'linkedin_pdf' | 'audio' | 'text' | 'chips'

export type EntryType = 'o_que_fiz' | 'decisao' | 'aprendizado' | 'impacto'

export interface ExtractedEntry {
  what_i_did: string          // obrigatório — o que aconteceu
  decision?: string           // decisão tomada (se houver)
  learning?: string           // aprendizado gerado
  impact?: string             // impacto qualitativo
  metric?: string             // número ou evidência quantitativa (ex: "30% menos churn")
  entry_date?: string         // data ISO da experiência (não da captura)
  tags: string[]              // skills/temas detectados
  company?: string            // empresa (LinkedIn e áudio principalmente)
  role_title?: string         // cargo
  role_start?: string         // início do cargo (ISO date)
  role_end?: string           // fim do cargo (null = atual)
  raw_content: string         // texto original antes da extração
  source: EntrySource
}

export interface Entry extends ExtractedEntry {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}
```

---

## Arquitetura do pipeline

```
Input (texto bruto)
  │
  ├── extractFromLinkedIn(text)   ← vem do PDF do LinkedIn
  ├── extractFromAudio(transcript) ← vem do Whisper
  └── extractFromText(text)        ← vem de chips + texto livre
          │
          ▼
  extractEntries(rawText, source, options)
  [função compartilhada]
          │
          ▼
  Claude Haiku
  [prompt calibrado por source]
          │
          ▼
  ExtractedEntry[]
  [validação de schema]
          │
          ▼
  saveEntries(entries, userId)
  [Supabase insert]
          │
          ▼
  Entry[]
  [retorna para o chamador]
```

---

## Estrutura de arquivos

```
src/
  lib/
    ai/
      extraction/
        extractFromLinkedIn.ts    ← wrapper com prompt LinkedIn
        extractFromAudio.ts       ← wrapper com prompt áudio
        extractFromText.ts        ← wrapper com prompt texto/chips
        extractEntries.ts         ← função base compartilhada
        schemas.ts                ← schema de validação (Zod)
        prompts/
          linkedin.ts             ← prompt system + user para LinkedIn
          audio.ts                ← prompt para transcrição de áudio
          text.ts                 ← prompt para texto livre
    db/
      entries.ts                  ← saveEntries(), getEntries(), etc.
```

---

## extractEntries — função base

```typescript
// src/lib/ai/extraction/extractEntries.ts
import Anthropic from '@anthropic-ai/sdk'
import { validateEntries } from './schemas'
import type { ExtractedEntry, EntrySource } from '@/types/entry'

const client = new Anthropic()

interface ExtractionOptions {
  source: EntrySource
  systemPrompt: string
  userPrompt: string
  maxEntries?: number
}

export async function extractEntries(options: ExtractionOptions): Promise<ExtractedEntry[]> {
  const { source, systemPrompt, userPrompt, maxEntries = 20 } = options

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Resposta inesperada do modelo')
  }

  // Extrai JSON da resposta
  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) {
    throw new Error('Modelo não retornou JSON válido')
  }

  const parsed = JSON.parse(jsonMatch[1])
  const entries = Array.isArray(parsed) ? parsed : parsed.entries ?? []

  // Adiciona source em todas as entradas
  const withSource = entries.slice(0, maxEntries).map((e: Partial<ExtractedEntry>) => ({
    ...e,
    source,
    tags: e.tags ?? [],
  }))

  // Valida schema
  return validateEntries(withSource)
}
```

---

## Prompt: LinkedIn PDF

```typescript
// src/lib/ai/extraction/prompts/linkedin.ts

export const LINKEDIN_SYSTEM_PROMPT = `
Você é um assistente especializado em extrair informações de trajetória profissional
de perfis do LinkedIn exportados como PDF.

Seu trabalho é transformar o texto bruto do PDF em entradas estruturadas de carreira.
Cada entrada corresponde a uma experiência profissional relevante.

REGRAS:
1. Extraia UMA entrada por cargo/experiência significativa
2. Priorize evidências concretas: projetos, entregas, decisões, impactos com números
3. Se o cargo tem descrição longa, extraia os pontos mais relevantes em "what_i_did"
4. Detecte skills implícitas nas descrições (ex: "liderou time de 5" → tag "liderança")
5. Se há métricas mencionadas (%, R$, tempo), coloque em "metric"
6. "entry_date" deve ser a data de início do cargo no formato ISO (YYYY-MM-DD)
7. Nunca invente informação que não está no texto
8. Se o texto mencionar apenas cargo e empresa sem descrição, ainda extraia — use o título como "what_i_did"

FORMATO DE SAÍDA — responda APENAS com JSON válido dentro de bloco de código:
\`\`\`json
[
  {
    "what_i_did": "descrição clara do que foi feito nesse cargo",
    "decision": "decisão importante tomada, se houver",
    "learning": "aprendizado gerado, se mencionado",
    "impact": "impacto qualitativo descrito",
    "metric": "número ou evidência quantitativa",
    "entry_date": "YYYY-MM-DD",
    "tags": ["skill1", "skill2"],
    "company": "nome da empresa",
    "role_title": "título do cargo",
    "role_start": "YYYY-MM-DD",
    "role_end": "YYYY-MM-DD ou null se atual",
    "raw_content": "trecho original do PDF que originou essa entrada"
  }
]
\`\`\`
`

export function buildLinkedInUserPrompt(pdfText: string): string {
  return `
Extraia as experiências profissionais do seguinte perfil do LinkedIn:

---
${pdfText.slice(0, 12000)} ${pdfText.length > 12000 ? '\n[... texto truncado ...]' : ''}
---

Retorne as entradas em ordem cronológica reversa (mais recente primeiro).
`
}
```

---

## Prompt: Áudio (transcrição)

```typescript
// src/lib/ai/extraction/prompts/audio.ts

export const AUDIO_SYSTEM_PROMPT = `
Você é um assistente especializado em extrair entradas de carreira de transcrições de áudio.
A pessoa gravou uma narrativa informal sobre seu trabalho — pode ser desorganizada, com hesitações.

Seu trabalho é identificar os momentos relevantes e transformá-los em entradas estruturadas.

REGRAS:
1. Ignore hesitações, repetições e linguagem coloquial — foque no conteúdo
2. Uma frase pode gerar uma entrada; um parágrafo longo pode gerar várias
3. Se a pessoa menciona projeto, decisão, entrega ou aprendizado → é uma entrada
4. Mantenha o tom da pessoa no "what_i_did" — não reescreva em corporês
5. Detecte skills implícitas no que foi descrito
6. Se há data mencionada, use. Se não há, não invente.

FORMATO — responda APENAS com JSON válido dentro de bloco de código:
\`\`\`json
[
  {
    "what_i_did": "...",
    "decision": "...",
    "learning": "...",
    "impact": "...",
    "metric": "...",
    "entry_date": "YYYY-MM-DD ou null",
    "tags": ["skill1", "skill2"],
    "company": "nome se mencionado",
    "role_title": "cargo se mencionado",
    "raw_content": "trecho original da transcrição"
  }
]
\`\`\`
`

export function buildAudioUserPrompt(transcript: string): string {
  return `
Extraia entradas de carreira da seguinte transcrição de áudio:

---
${transcript}
---
`
}
```

---

## Prompt: Texto livre / chips

```typescript
// src/lib/ai/extraction/prompts/text.ts

export const TEXT_SYSTEM_PROMPT = `
Você é um assistente especializado em estruturar registros de trabalho.
A pessoa descreveu algo que fez, decidiu ou aprendeu — pode ser um parágrafo curto ou longo.

Seu trabalho é extrair uma ou mais entradas estruturadas a partir desse texto.

REGRAS:
1. Se o texto descreve um evento único → uma entrada
2. Se o texto descreve vários eventos → várias entradas
3. Preserve a voz da pessoa em "what_i_did"
4. Extraia métricas mesmo que vagas ("reduziu bastante" → coloque em impact, não em metric)
5. Tags devem ser skills ou temas concretos, não adjetivos genéricos

FORMATO — responda APENAS com JSON válido dentro de bloco de código:
\`\`\`json
[
  {
    "what_i_did": "...",
    "decision": "...",
    "learning": "...",
    "impact": "...",
    "metric": "...",
    "entry_date": "YYYY-MM-DD ou null",
    "tags": ["skill1", "skill2"],
    "raw_content": "texto original"
  }
]
\`\`\`
`
```

---

## Schema de validação (Zod)

```typescript
// src/lib/ai/extraction/schemas.ts
import { z } from 'zod'
import type { ExtractedEntry } from '@/types/entry'

const extractedEntrySchema = z.object({
  what_i_did: z.string().min(1),
  decision: z.string().optional().nullable(),
  learning: z.string().optional().nullable(),
  impact: z.string().optional().nullable(),
  metric: z.string().optional().nullable(),
  entry_date: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  company: z.string().optional().nullable(),
  role_title: z.string().optional().nullable(),
  role_start: z.string().optional().nullable(),
  role_end: z.string().optional().nullable(),
  raw_content: z.string().default(''),
  source: z.enum(['linkedin_pdf', 'audio', 'text', 'chips']),
})

export function validateEntries(raw: unknown[]): ExtractedEntry[] {
  return raw.flatMap((item) => {
    const result = extractedEntrySchema.safeParse(item)
    if (result.success) return [result.data as ExtractedEntry]
    console.warn('Entrada inválida ignorada:', result.error.issues)
    return []
  })
}
```

---

## Wrapper: extractFromLinkedIn

```typescript
// src/lib/ai/extraction/extractFromLinkedIn.ts
import { extractEntries } from './extractEntries'
import { LINKEDIN_SYSTEM_PROMPT, buildLinkedInUserPrompt } from './prompts/linkedin'
import type { ExtractedEntry } from '@/types/entry'

export async function extractFromLinkedIn(pdfText: string): Promise<ExtractedEntry[]> {
  return extractEntries({
    source: 'linkedin_pdf',
    systemPrompt: LINKEDIN_SYSTEM_PROMPT,
    userPrompt: buildLinkedInUserPrompt(pdfText),
    maxEntries: 20,
  })
}
```

---

## saveEntries — persistência

```typescript
// src/lib/db/entries.ts
import { createServerClient } from '@/lib/db/supabase/server'
import type { ExtractedEntry, Entry } from '@/types/entry'

export async function saveEntries(
  entries: ExtractedEntry[],
  userId: string
): Promise<Entry[]> {
  const supabase = createServerClient()

  const toInsert = entries.map((e) => ({
    ...e,
    user_id: userId,
  }))

  const { data, error } = await supabase
    .from('entries')
    .insert(toInsert)
    .select()

  if (error) throw new Error(`Erro ao salvar entradas: ${error.message}`)

  return data as Entry[]
}

export async function getRecentEntries(userId: string, limit = 3): Promise<Entry[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Erro ao buscar entradas: ${error.message}`)

  return data as Entry[]
}

export async function countEntries(userId: string): Promise<number> {
  const supabase = createServerClient()

  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw new Error(`Erro ao contar entradas: ${error.message}`)

  return count ?? 0
}
```

---

## Tratamento de erros

| Cenário | Comportamento |
|---|---|
| Modelo não retorna JSON | Log de erro + retorna `[]` + mostra mensagem para tentar de novo |
| Entrada falha na validação | Ignora a entrada inválida, continua com as válidas |
| Supabase falha no insert | Lança erro → API route retorna 500 → UI mostra retry |
| Texto muito curto (<50 chars) | Haiku tenta mesmo assim; se retornar vazio, UI pede mais contexto |
| PDF ilegível / escaneado | `extractText` retorna string vazia → erro claro na UI |

---

## Estimativa de custo (Claude Haiku)

| Cenário | Tokens estimados | Custo aprox. |
|---|---|---|
| LinkedIn PDF (5 cargos) | ~3.000 input + 1.000 output | ~$0.001 |
| Áudio 3 min (transcrição) | ~1.500 input + 800 output | < $0.001 |
| Texto livre (1 parágrafo) | ~500 input + 300 output | < $0.0001 |

Haiku é a escolha certa aqui. Sonnet é reservado para o espelho (doc 005).

---

## Fora do escopo neste bloco

- Streaming de entradas enquanto extrai (v2 — nice to have)
- Extração incremental de PDFs muito longos (>20 páginas)
- Deduplicação de entradas (detectar se a pessoa já importou o mesmo cargo)
- Embeddings para busca semântica (v2)
- Classificação automática de tipo de entrada (o_que_fiz vs decisao) — tags são suficientes no v1
