# 005 — Primeiro Espelho (Claude Sonnet)

## O que é

O momento mais importante do produto. Após o onboarding, o Borogodó devolve para a pessoa uma leitura de quem ela é profissionalmente — baseada em evidência real, não em autoavaliação.

Esse é o "aha!": a pessoa vê a si mesma refletida de forma que nenhum formulário ou quiz conseguiria fazer.

Usa Claude Sonnet (qualidade máxima de raciocínio e escrita) — aqui é onde o custo maior se justifica.

---

## O que o espelho entrega

```
1. Força principal        — com citação direta de uma entrada
2. Skill invisível        — algo que aparece mas a pessoa nunca nomeou
3. Padrão de contexto     — tipo de situação onde ela brilha
4. Pergunta honesta       — "isso ressoa com você?" — não é retórica
```

**O que nunca aparece:**
- Bajulação genérica ("você é um comunicador incrível")
- Afirmações sem evidência
- Tom corporativo ou de avaliação de desempenho
- Lista de skills (isso é LinkedIn, não espelho)

---

## Fluxo UX da revelação

```
/onboarding/espelho
  │
  └── Carrega enquanto gera (Sonnet pode levar 3–8s)
      "Processando o que você me contou..."
      │
      └── Revelação progressiva (Framer Motion stagger)
          │
          ├── Linha 1 (fade in, 0ms delay)
          │   "Já consigo ver algumas coisas sobre você, {nome}."
          │
          ├── Card 1 (slide in, 800ms)
          │   "Você decide bem sob pressão."
          │   "Aparece em 3 das suas 5 entradas..."
          │
          ├── Card 2 (slide in, 1600ms)
          │   "Tem uma skill que você não nomeou:"
          │   "você vira complexidade em clareza..."
          │
          ├── Card 3 (slide in, 2400ms)
          │   "Você aparece em situações onde..."
          │
          └── Card final (fade in, 3200ms)
              "Isso ressoa com você?"
              [Sim, faz sentido]  [Nem tanto]
              │
              ├── [Sim] → /painel (com espelho salvo)
              └── [Nem tanto] → tela de ajuste
                  "O que não pareceu certo?"
                  (feedback alimenta ajuste futuro — não regera agora no v1)
```

---

## Layout visual da revelação

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Já consigo ver algumas coisas sobre você, Ana.    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  💡  Você decide bem sob pressão.                  │
│                                                     │
│  Esse padrão aparece em 3 das suas 5 entradas —    │
│  sempre com contexto de incerteza e prazo curto.   │
│  Na Empresa X você liderou a migração com 2 dias   │
│  de janela. Na Y, reformulou o roadmap no meio     │
│  do quarter.                                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🔍  Tem uma skill que você não nomeou.            │
│                                                     │
│  Você vira complexidade em clareza para outras     │
│  pessoas. Não é execução — é síntese. Aparece      │
│  toda vez que você descreve comunicação com        │
│  stakeholders ou times.                            │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🗺️  Você brilha em contextos de 0→1.             │
│                                                     │
│  Das suas experiências, as que têm mais detalhes   │
│  e energia são as de início — produto novo,        │
│  processo novo, time novo. Você parece funcionar   │
│  bem sem mapa pronto.                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Isso ressoa com você?                             │
│                                                     │
│  [Sim, faz sentido]          [Nem tanto]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Prompt do espelho (Claude Sonnet)

```typescript
// src/lib/ai/mirror/prompts/firstMirror.ts

export const FIRST_MIRROR_SYSTEM_PROMPT = `
Você é o espelho de carreira do Borogodó.

Seu trabalho é revelar para a pessoa aspectos de si mesma que ela talvez não veja —
a partir de evidência real das entradas que ela registrou, não de generalizações.

PRINCÍPIOS:
1. Específico > genérico. Nunca "você é um bom comunicador". Sempre "você traduz decisões
   técnicas complexas em clareza para stakeholders — aparece em 4 das suas entradas".
2. Use as palavras da própria pessoa sempre que possível. Se ela escreveu "virei o jogo",
   use essa expressão — não reescreva em corporês.
3. Honesto > bajulador. Se há lacunas evidentes nos dados, é possível mencioná-las com
   cuidado. Mas no primeiro espelho, o foco é revelar forças — lacunas vêm depois.
4. Tom: como um amigo inteligente que te conhece bem e está sendo honesto. Nem clínico,
   nem coach de LinkedIn, nem terapeuta. Direto, caloroso, brasileiro.
5. Cite evidências reais. Mencione empresa, projeto ou situação específica quando
   disponível — isso é o que torna o espelho crível.
6. A skill invisível é o insight mais valioso. Procure algo que a pessoa demonstra
   consistentemente mas nunca nomeou explicitamente como força própria.

FORMATO DE SAÍDA — retorne JSON dentro de bloco de código:
\`\`\`json
{
  "intro": "frase de abertura personalizada (1 linha, usa o nome da pessoa)",
  "primary_strength": {
    "headline": "afirmação direta e específica (1 linha)",
    "evidence": "2–3 linhas conectando o padrão às entradas reais, com exemplos concretos"
  },
  "invisible_skill": {
    "headline": "nomeação da skill que a pessoa não nomeou (1 linha)",
    "evidence": "2–3 linhas explicando como isso aparece nas entradas"
  },
  "context_pattern": {
    "headline": "tipo de contexto onde ela brilha (1 linha)",
    "evidence": "2–3 linhas com exemplos das entradas"
  },
  "closing_question": "pergunta honesta e direta (1 linha, termina com ponto de interrogação)"
}
\`\`\`
`

export function buildFirstMirrorUserPrompt(
  entries: { what_i_did: string; company?: string; role_title?: string; tags: string[]; impact?: string; metric?: string }[],
  userName: string
): string {
  const entriesText = entries
    .map((e, i) => `
Entrada ${i + 1}:
- O que fiz: ${e.what_i_did}
${e.company ? `- Empresa: ${e.company}` : ''}
${e.role_title ? `- Cargo: ${e.role_title}` : ''}
${e.impact ? `- Impacto: ${e.impact}` : ''}
${e.metric ? `- Métrica: ${e.metric}` : ''}
${e.tags.length ? `- Skills detectadas: ${e.tags.join(', ')}` : ''}
    `.trim()
    )
    .join('\n\n')

  return `
Nome da pessoa: ${userName}

Entradas de carreira (${entries.length} entradas):

${entriesText}

Gere o primeiro espelho de carreira para ${userName}.
Lembre: específico, baseado em evidência, na voz de um amigo honesto.
`
}
```

---

## API Route: gerar espelho

```typescript
// src/app/api/mirror/generate/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getRecentEntries } from '@/lib/db/entries'
import { generateFirstMirror } from '@/lib/ai/mirror/generateMirror'
import { saveMirrorSnapshot } from '@/lib/db/mirror'

export async function POST() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca todas as entradas (para o primeiro espelho, usa tudo)
  const { data: entries } = await supabase
    .from('entries')
    .select('what_i_did, company, role_title, tags, impact, metric')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'Sem entradas para gerar espelho' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name?.split(' ')[0] ?? 'você'

  // Gera espelho com Sonnet
  const mirror = await generateFirstMirror(entries, userName)

  // Salva snapshot
  await saveMirrorSnapshot({
    userId: user.id,
    mirror,
    entryCount: entries.length,
  })

  // Marca onboarding como completo
  await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  return NextResponse.json({ mirror })
}
```

---

## generateMirror — função de AI

```typescript
// src/lib/ai/mirror/generateMirror.ts
import Anthropic from '@anthropic-ai/sdk'
import { FIRST_MIRROR_SYSTEM_PROMPT, buildFirstMirrorUserPrompt } from './prompts/firstMirror'
import { validateMirror } from './schemas'
import type { MirrorSnapshot } from '@/types/mirror'

const client = new Anthropic()

export async function generateFirstMirror(
  entries: { what_i_did: string; company?: string; role_title?: string; tags: string[]; impact?: string; metric?: string }[],
  userName: string
): Promise<MirrorSnapshot['mirror']> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: FIRST_MIRROR_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildFirstMirrorUserPrompt(entries, userName),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Resposta inesperada')

  const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) throw new Error('JSON não encontrado na resposta')

  const parsed = JSON.parse(jsonMatch[1])
  return validateMirror(parsed)
}
```

---

## Schema do espelho

```typescript
// src/types/mirror.ts

export interface MirrorSection {
  headline: string
  evidence: string
}

export interface Mirror {
  intro: string
  primary_strength: MirrorSection
  invisible_skill: MirrorSection
  context_pattern: MirrorSection
  closing_question: string
}

export interface MirrorSnapshot {
  id: string
  user_id: string
  mirror: Mirror
  entry_count: number
  generated_at: string
  resonated?: boolean | null   // feedback da pessoa
  feedback_text?: string | null
}
```

```sql
-- Tabela mirror_snapshots
create table public.mirror_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  mirror        jsonb not null,         -- Mirror object serializado
  entry_count   int not null,
  generated_at  timestamptz default now(),
  resonated     boolean,               -- feedback: true=sim / false=nem tanto / null=não respondeu
  feedback_text text
);

alter table public.mirror_snapshots enable row level security;

create policy "Usuário acessa só o próprio espelho"
  on public.mirror_snapshots for all
  using (auth.uid() = user_id);

create index mirror_snapshots_user_id_idx on public.mirror_snapshots(user_id, generated_at desc);
```

---

## Componente de revelação progressiva

```typescript
// src/components/features/mirror/MirrorReveal.tsx
'use client'
import { motion } from 'framer-motion'
import type { Mirror } from '@/types/mirror'

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

interface Props {
  mirror: Mirror
  onResonated: (value: boolean) => void
}

export function MirrorReveal({ mirror, onResonated }: Props) {
  const sections = [
    { icon: '💡', ...mirror.primary_strength },
    { icon: '🔍', ...mirror.invisible_skill },
    { icon: '🗺️', ...mirror.context_pattern },
  ]

  return (
    <motion.div
      className="space-y-6 max-w-xl mx-auto px-4 py-10"
      initial="hidden"
      animate="visible"
    >
      <motion.p
        variants={fadeSlide}
        className="font-display text-xl text-foreground"
      >
        {mirror.intro}
      </motion.p>

      {sections.map((section, i) => (
        <motion.div
          key={i}
          variants={fadeSlide}
          transition={{ delay: 0.6 + i * 0.7 }}
          className="bg-card border border-border rounded-xl p-6 space-y-2"
        >
          <p className="text-lg font-semibold">
            {section.icon}&nbsp;&nbsp;{section.headline}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {section.evidence}
          </p>
        </motion.div>
      ))}

      <motion.div
        variants={fadeSlide}
        transition={{ delay: 0.6 + sections.length * 0.7 }}
        className="pt-4 text-center space-y-4"
      >
        <p className="font-medium text-foreground">{mirror.closing_question}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onResonated(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium"
          >
            Sim, faz sentido
          </button>
          <button
            onClick={() => onResonated(false)}
            className="px-6 py-2 border border-border rounded-full text-muted-foreground"
          >
            Nem tanto
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

---

## MirrorRevealPage

```typescript
// src/app/(app)/onboarding/espelho/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MirrorReveal } from '@/components/features/mirror/MirrorReveal'
import type { Mirror } from '@/types/mirror'

export default function EspelhoPage() {
  const router = useRouter()
  const [mirror, setMirror] = useState<Mirror | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/mirror/generate', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao gerar espelho')
        const data = await res.json()
        setMirror(data.mirror)
      })
      .catch(() => setError('Algo deu errado. Tenta de novo?'))
      .finally(() => setLoading(false))
  }, [])

  const handleFeedback = async (resonated: boolean) => {
    await fetch('/api/mirror/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resonated }),
    })
    router.push('/painel')
  }

  if (loading) return <MirrorLoading />
  if (error) return <MirrorError message={error} />
  if (!mirror) return null

  return <MirrorReveal mirror={mirror} onResonated={handleFeedback} />
}

function MirrorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">🪞</div>
        <p className="text-muted-foreground">Processando o que você me contou...</p>
      </div>
    </div>
  )
}
```

---

## Estimativa de custo (Claude Sonnet)

| Cenário | Tokens estimados | Custo aprox. |
|---|---|---|
| 5 entradas do LinkedIn | ~2.500 input + 600 output | ~$0.01 |
| 10 entradas do LinkedIn | ~4.000 input + 600 output | ~$0.016 |
| Primeira vez de todos os usuários | — | < $0.02 por usuário |

Sonnet aqui é a escolha certa. É o único lugar no MVP onde qualidade máxima de escrita e raciocínio justificam o custo.

---

## Casos de borda

| Cenário | Comportamento |
|---|---|
| < 2 entradas | Gera espelho mesmo assim, mas intro reconhece que é "um primeiro vislumbre" |
| Entradas genéricas sem detalhes | Sonnet extrai o que consegue; se muito vago, closing_question pergunta mais |
| Erro na API do Anthropic | Página de erro com "Tenta de novo" — não perde as entradas já salvas |
| Usuário fecha a janela durante a revelação | Pode voltar ao /painel; espelho já está salvo no Supabase |
| Feedback "nem tanto" | Salva o feedback, redireciona para /painel sem reger — foco no próximo onboarding |

---

## Microcopy

| Contexto | Texto |
|---|---|
| Loading | "Processando o que você me contou..." |
| Ícone loading | 🪞 (pulsando) |
| Label força principal | "💡" (sem rótulo de texto — deixa o headline falar) |
| Label skill invisível | "🔍" |
| Label padrão | "🗺️" |
| Pergunta de feedback | Vem do prompt — personalizada por Sonnet |
| Botão positivo | "Sim, faz sentido" |
| Botão negativo | "Nem tanto" |
| Erro | "Algo deu errado ao gerar seu espelho. Tenta de novo?" |

---

## Fora do escopo neste bloco

- Regerar espelho com feedback imediato ("nem tanto" não regera no v1)
- Espelho completo com lacunas e gaps (vem depois, quando há mais entradas)
- Streaming da resposta do Sonnet (nice to have — adiciona muito UX mas tem complexidade)
- Comparação entre snapshots ("seu espelho mudou desde X")
- Compartilhamento do espelho
