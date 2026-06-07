# 004 — Pipeline de Captura: Extração + Reflexo (Claude Haiku)

## O que é

O serviço central que transforma input bruto (texto, transcrição de áudio, imagem, arquivo) em **duas coisas**:

1. **Entrada(s) estruturada(s)** — no esquema do Borogodó.
2. **Reflexo** — o diagnóstico que volta pra pessoa no `CaptureConversation`: resumo na voz dela + pílulas + **um movimento** (pergunta, afirmação ou sugestão).

É a metade-rápida do produto (Haiku). A metade-profunda (síntese do espelho, Sonnet) está no doc 005. Uma captura = **uma chamada Haiku** que devolve `{ entries, reflection }`.

```
input bruto + contexto (temas existentes, nº entradas, dias desde última)
        │
        ▼
  Claude Haiku  ── extrai entrada(s)  ── gera reflexo (resumo + pílulas + 1 movimento)
        │
        ▼
  { entries, reflection }
        │
        ├── salva entries (captura sem fricção)
        └── reflection → CaptureConversation (doc 002)
```

---

## Tipos

```typescript
// src/types/entry.ts
export type EntrySource = 'linkedin_pdf' | 'audio' | 'text' | 'chips' | 'image'

export interface ExtractedEntry {
  what_i_did: string
  decision?: string | null
  learning?: string | null
  impact?: string | null
  metric?: string | null
  entry_date?: string | null
  tags: string[]
  company?: string | null
  role_title?: string | null
  role_start?: string | null
  role_end?: string | null
  raw_content: string
  source: EntrySource
}

export interface Entry extends ExtractedEntry {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}
```

```typescript
// src/types/capture.ts
export type CaptureInput =
  | { kind: 'text'; content: string }
  | { kind: 'audio'; blob: Blob }
  | { kind: 'image'; file: File }
  | { kind: 'file'; file: File }

export type ReflectionMoveType = 'question' | 'affirmation' | 'suggestion'

export interface ReflectionMove {
  type: ReflectionMoveType
  text: string
  field?: 'metric' | 'impact' | 'decision' | 'learning'  // para 'question': qual campo enriquecer
}

export interface Reflection {
  summary: string        // 1–2 frases na voz da pessoa: "Entendi: você..."
  pills: string[]        // 2–4 dimensões detectadas (= tags da entrada)
  move: ReflectionMove   // UM movimento só
}

export interface CaptureResult {
  entries: Entry[]
  reflection: Reflection
}
```

---

## Contexto que alimenta o reflexo

O movimento (pergunta/afirmação/sugestão) só é bom se o modelo souber o que a pessoa já tem. O `/api/capture` monta um **contexto compacto** antes de chamar o Haiku:

```typescript
interface CaptureContext {
  strengthThemes: string[]   // do mirror_snapshot mais recente (até 6)
  recentSummaries: string[]  // what_i_did das últimas ~5 entradas (compacto)
  entryCount: number
}
```

Isso permite movimentos como *"isso bate com 2 entradas suas sobre migração"* (sugestão de conexão) ou *"liderança aparece pouco em você — vale registrar"* (gap), sem custo de Sonnet.

---

## API Route: /api/capture

```typescript
// src/app/api/capture/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { transcribeAudio } from '@/lib/ai/transcribe'
import { extractTextFromPDF } from '@/lib/pdf/extractText'
import { captureAndReflect } from '@/lib/ai/extraction/captureAndReflect'
import { buildCaptureContext } from '@/lib/ai/extraction/context'
import { saveEntries } from '@/lib/db/entries'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const form = await request.formData()
  const kind = form.get('kind') as string

  // 1. Normaliza qualquer modalidade em texto + source
  let rawText = ''
  let source: 'text' | 'audio' | 'file' | 'image' = 'text'

  if (kind === 'text') {
    rawText = form.get('content') as string
    source = 'text'
  } else if (kind === 'audio') {
    const blob = form.get('audio') as File
    rawText = await transcribeAudio(blob)     // Whisper
    source = 'audio'
  } else if (kind === 'file') {
    const file = form.get('file') as File
    rawText = await extractTextFromPDF(Buffer.from(await file.arrayBuffer()))
    source = 'file'
  } else if (kind === 'image') {
    // imagem vai direto pro Haiku como bloco de imagem (visão) — ver captureAndReflect
    source = 'image'
  }

  if (source !== 'image' && rawText.trim().length < 3) {
    return NextResponse.json({ error: 'Conta um pouco mais, ainda não consegui captar.' }, { status: 400 })
  }

  // 2. Contexto compacto
  const context = await buildCaptureContext(user.id)

  // 3. Haiku: extrai + reflete (uma chamada)
  const { entries, reflection } = await captureAndReflect({
    rawText,
    source,
    image: source === 'image' ? (form.get('image') as File) : undefined,
    context,
  })

  // 4. Salva (sem fricção)
  const saved = await saveEntries(entries, user.id)

  // 5. Dispara jobs assíncronos (não bloqueiam a resposta)
  triggerProactiveInsight(user.id).catch(() => {})
  maybeRegenerateMirror(user.id, context.entryCount + saved.length).catch(() => {}) // doc 005

  return NextResponse.json({ entries: saved, reflection })
}
```

---

## captureAndReflect — a chamada Haiku

```typescript
// src/lib/ai/extraction/captureAndReflect.ts
import Anthropic from '@anthropic-ai/sdk'
import { CAPTURE_SYSTEM_PROMPT, buildCaptureUserPrompt } from './prompts/capture'
import { validateCaptureResult } from './schemas'
import type { CaptureContext } from '@/types/capture'

const client = new Anthropic()

interface Args {
  rawText: string
  source: 'text' | 'audio' | 'file' | 'image'
  image?: File
  context: CaptureContext
}

export async function captureAndReflect(args: Args) {
  const { rawText, source, image, context } = args

  const userContent: Anthropic.MessageParam['content'] = image
    ? [
        { type: 'image', source: { type: 'base64', media_type: image.type as any,
          data: Buffer.from(await image.arrayBuffer()).toString('base64') } },
        { type: 'text', text: buildCaptureUserPrompt('', source, context) },
      ]
    : buildCaptureUserPrompt(rawText, source, context)

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    system: CAPTURE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Resposta inesperada')

  const json = block.text.match(/```json\n([\s\S]*?)\n```/)
  if (!json) throw new Error('JSON não encontrado')

  return validateCaptureResult(JSON.parse(json[1]), source)
}
```

---

## Prompt de captura (extração + reflexo)

```typescript
// src/lib/ai/extraction/prompts/capture.ts

export const CAPTURE_SYSTEM_PROMPT = `
Você é a inteligência de captura do Borogodó. A pessoa acabou de registrar um momento
de trabalho — escrito, falado, ou em imagem/arquivo. Pode ser bagunçado e informal.

Você faz DUAS coisas:

A) EXTRAÇÃO — transforme o input em uma ou mais entradas estruturadas:
   what_i_did, decision, learning, impact, metric, entry_date, tags.
   - Preserve a VOZ da pessoa em "what_i_did". Não reescreva em corporês.
   - tags = skills/temas concretos (não adjetivos genéricos).
   - Não invente o que não está no input.

B) REFLEXO — devolva um diagnóstico curto e caloroso pra mostrar na hora:
   - summary: 1–2 frases começando com "Entendi:" — o que você captou, na voz dela.
   - pills: 2–4 dimensões detectadas (geralmente = as tags principais).
   - move: UM movimento só, escolhido com julgamento:
       * "question" — quando falta algo que enriqueceria a entrada (ex: um número).
         Sempre OPCIONAL: a entrada já vale sem a resposta. Defina "field".
       * "affirmation" — quando o que ela trouxe é valioso E você pode ENSINAR por quê.
         Nunca bajulação vazia. Não "mandou bem"; sim "isso é material de entrevista
         porque a maioria não registra esse tipo de vitória".
       * "suggestion" — quando isso conecta com o histórico dela (ver CONTEXTO) ou revela
         um padrão. Ex: "isso bate com 2 entradas suas sobre X".

REGRA DE OURO DO MOVIMENTO: escolha o que mais serve a PESSOA agora, não o que enche.
Se nada agrega, prefira uma afirmação específica e curta. Nunca faça mais de um movimento.

CONTEXTO da pessoa (use para sugestões e gaps, não repita de volta):
{{CONTEXT}}

SAÍDA — apenas JSON dentro de bloco de código:
\`\`\`json
{
  "entries": [
    {
      "what_i_did": "...",
      "decision": null,
      "learning": null,
      "impact": "...",
      "metric": null,
      "entry_date": "YYYY-MM-DD ou null",
      "tags": ["...", "..."]
    }
  ],
  "reflection": {
    "summary": "Entendi: ...",
    "pills": ["...", "..."],
    "move": { "type": "question", "text": "...", "field": "metric" }
  }
}
\`\`\`
`

export function buildCaptureUserPrompt(
  rawText: string,
  source: string,
  context: { strengthThemes: string[]; recentSummaries: string[]; entryCount: number }
): string {
  const ctx = `
- Forças já detectadas: ${context.strengthThemes.join(', ') || 'nenhuma ainda'}
- Entradas recentes: ${context.recentSummaries.slice(0, 5).join(' | ') || 'nenhuma'}
- Total de entradas: ${context.entryCount}
  `.trim()

  const filled = CAPTURE_SYSTEM_PROMPT.replace('{{CONTEXT}}', ctx) // (ou injete no system)

  return source === 'image'
    ? `A pessoa enviou uma imagem relacionada ao trabalho dela. Extraia o contexto e reflita.\n\nContexto:\n${ctx}`
    : `Input (${source}):\n---\n${rawText.slice(0, 8000)}\n---\n\nContexto:\n${ctx}`
}
```

> Nota de implementação: injete `{{CONTEXT}}` no `system` uma vez por request (o exemplo acima simplifica). Mantenha o system estável para aproveitar **prompt caching**.

---

## Validação (Zod)

```typescript
// src/lib/ai/extraction/schemas.ts
import { z } from 'zod'

const entrySchema = z.object({
  what_i_did: z.string().min(1),
  decision: z.string().nullish(),
  learning: z.string().nullish(),
  impact: z.string().nullish(),
  metric: z.string().nullish(),
  entry_date: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  company: z.string().nullish(),
  role_title: z.string().nullish(),
})

const reflectionSchema = z.object({
  summary: z.string().min(1),
  pills: z.array(z.string()).min(1).max(4),
  move: z.object({
    type: z.enum(['question', 'affirmation', 'suggestion']),
    text: z.string().min(1),
    field: z.enum(['metric', 'impact', 'decision', 'learning']).optional(),
  }),
})

export function validateCaptureResult(raw: unknown, source: string) {
  const parsed = z.object({
    entries: z.array(entrySchema).min(1),
    reflection: reflectionSchema,
  }).parse(raw)

  return {
    entries: parsed.entries.map(e => ({ ...e, source, tags: e.tags ?? [], raw_content: '' })),
    reflection: parsed.reflection,
  }
}
```

---

## Wrappers por modalidade

`extractFromLinkedIn` (import em lote, **só extração**, sem reflexo individual) e os wrappers de áudio/texto continuam, mas a captura avulsa do painel usa `captureAndReflect`.

```typescript
// src/lib/ai/extraction/extractFromLinkedIn.ts  — usado pelo doc 003
import { extractEntries } from './extractEntries'
import { LINKEDIN_SYSTEM_PROMPT, buildLinkedInUserPrompt } from './prompts/linkedin'

export async function extractFromLinkedIn(pdfText: string) {
  return extractEntries({
    source: 'linkedin_pdf',
    systemPrompt: LINKEDIN_SYSTEM_PROMPT,
    userPrompt: buildLinkedInUserPrompt(pdfText),
    maxEntries: 20,
  })
}
```

(O `LINKEDIN_SYSTEM_PROMPT`, `extractEntries` base e o prompt de áudio seguem como na versão anterior deste doc — extração pura, sem o bloco de reflexo.)

---

## buildCaptureContext

```typescript
// src/lib/ai/extraction/context.ts
import { createServerClient } from '@/lib/db/supabase/server'
import type { CaptureContext } from '@/types/capture'

export async function buildCaptureContext(userId: string): Promise<CaptureContext> {
  const supabase = createServerClient()
  const [mirror, recent, count] = await Promise.all([
    supabase.from('mirror_snapshots').select('strength_themes')
      .eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('entries').select('what_i_did')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  return {
    strengthThemes: mirror.data?.strength_themes ?? [],
    recentSummaries: (recent.data ?? []).map(e => e.what_i_did),
    entryCount: count.count ?? 0,
  }
}
```

---

## Enriquecimento (responder a pergunta do reflexo)

```typescript
// src/app/api/entries/[id]/enrich/route.ts
// PATCH { answer, field } → atualiza o campo da entrada (ex: metric)
// Sem nova chamada de IA: o texto da resposta vira o valor do campo.
// Mantém a captura barata e a resposta instantânea.
```

---

## Tratamento de erros

| Cenário | Comportamento |
|---|---|
| Haiku não retorna JSON | Erro → CaptureConversation mostra retry; entrada não salva |
| Entrada falha validação | Erro → retry (no MVP, não salva parcial) |
| Input < 3 chars | 400 "Conta um pouco mais" antes de chamar IA |
| Áudio não transcreve | Erro claro; oferece digitar |
| Imagem sem contexto de trabalho | Reflexo pergunta "o que é isso?" em vez de inventar |

---

## Custo (Haiku) por captura

| Modalidade | Tokens aprox. | Custo |
|---|---|---|
| Texto curto + reflexo | ~700 in + 400 out | < $0.0002 |
| Áudio (após Whisper) | ~1.500 in + 400 out | < $0.0005 |
| Imagem (visão) | ~1.500 in + 400 out | < $0.001 |

Reflexo + extração numa chamada Haiku mantém a captura quase gratuita. Sonnet fica só pro espelho (doc 005).

---

## Fora do escopo

- Streaming token-a-token do reflexo (animação fixa no MVP)
- Múltiplos movimentos por reflexo (sempre um só)
- Reflexo no import em lote do LinkedIn (lá é diagnóstico de conjunto, doc 003)
- Deduplicação de entradas
- Embeddings / busca semântica
