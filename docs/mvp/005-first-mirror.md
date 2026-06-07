# 005 — Espelho: Primeira Geração + Atualização Viva (Claude Sonnet)

## O que é

O espelho é a síntese profunda do Borogodó: a leitura de quem a pessoa é profissionalmente, com evidência real. Tem dois momentos:

1. **Primeira geração** — ao fim do onboarding, revela o primeiro espelho (o "aha!").
2. **Atualização viva** — conforme a pessoa captura no painel, o espelho evolui.

> **Modelo de duas velocidades (a chave da experiência "ver mudar"):**
> - **Instantâneo (Haiku, doc 004):** cada captura devolve reflexo + faz os indicadores subirem. É o que a pessoa *vê acontecer* na hora.
> - **Por limiar (Sonnet, este doc):** a síntese — a headline do espelho e os temas de força — regenera a cada N entradas ou ao abrir `/espelho`. Não a cada captura: por custo, latência, e porque uma síntese profunda não deve oscilar a cada frase.

Usa Claude Sonnet — único lugar do MVP onde o custo maior se justifica.

---

## O que o espelho entrega

```
1. Força principal        — com citação direta de uma entrada
2. Skill invisível        — algo que aparece mas a pessoa não nomeou
3. Padrão de contexto     — tipo de situação onde ela brilha
4. Pergunta honesta       — "isso ressoa com você?"
```

Nunca: bajulação genérica, afirmação sem evidência, tom de avaliação de desempenho, lista de skills.

---

## Quando o Sonnet roda (atualização viva)

```typescript
// src/lib/ai/mirror/maybeRegenerate.ts
// Chamado (async, não bloqueia) ao fim de /api/capture

const REGEN_EVERY = 3   // regenera a cada 3 novas entradas desde o último snapshot

export async function maybeRegenerateMirror(userId: string, newTotal: number): Promise<void> {
  const supabase = createServerClient()
  const { data: last } = await supabase
    .from('mirror_snapshots')
    .select('entry_count')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1).maybeSingle()

  const lastCount = last?.entry_count ?? 0
  if (newTotal - lastCount >= REGEN_EVERY) {
    await generateAndSaveMirror(userId)   // Sonnet
  }
}
```

Gatilhos de regeneração:
- **A cada 3 novas entradas** (background, ao capturar).
- **Ao abrir `/espelho`** se há entradas novas desde o último snapshot.
- **Fim do onboarding** (primeira geração, sempre).

Entre regenerações, o painel mostra o snapshot atual + os indicadores instantâneos. Se uma regeneração está rodando, a headline pode exibir um estado sutil: *"atualizando seu espelho..."*.

---

## Fluxo da primeira revelação (onboarding)

```
/onboarding/espelho
  └── POST /api/mirror/generate (Sonnet, 3–8s)
      "Processando o que você me contou..."
      │
      └── Revelação progressiva (Framer Motion stagger)
          ├── intro          (0ms)    "Já consigo ver algumas coisas, Ana."
          ├── força principal (800ms)
          ├── skill invisível (1600ms)
          ├── padrão          (2400ms)
          └── pergunta        (3200ms) [Sim, faz sentido] [Nem tanto]
              ├── [Sim] → /painel
              └── [Nem tanto] → "o que não pareceu certo?" (salva feedback; não regera no v1)
```

(Layout visual da revelação e o componente `MirrorReveal` seguem como na versão anterior — três cards `headline + evidence` com stagger, e a pergunta de fechamento.)

---

## Prompt do espelho (Sonnet)

```typescript
// src/lib/ai/mirror/prompts/firstMirror.ts
export const MIRROR_SYSTEM_PROMPT = `
Você é o espelho de carreira do Borogodó.
Revele para a pessoa aspectos de si que ela talvez não veja — a partir de evidência real
das entradas, não de generalização.

PRINCÍPIOS:
1. Específico > genérico. Nunca "você é bom comunicador". Sempre "você traduz decisões
   técnicas em clareza pra stakeholders — aparece em 4 entradas".
2. Use as palavras da própria pessoa quando possível.
3. Honesto > bajulador. No primeiro espelho, foque forças; lacunas vêm com mais dados.
4. Tom: amigo inteligente, honesto, brasileiro. Nem clínico, nem coach de LinkedIn.
5. Cite evidência real (empresa, projeto, situação) — é o que torna o espelho crível.
6. A skill invisível é o insight mais valioso: algo demonstrado com consistência mas
   nunca nomeado pela pessoa como força própria.

ALÉM DOS CARDS, retorne "strength_themes": 3–6 temas curtos de força (para os indicadores
do painel e para alimentar o contexto de captura). Ex: ["decisão sob pressão",
"síntese para stakeholders", "0→1"].

SAÍDA — apenas JSON:
\`\`\`json
{
  "intro": "abertura personalizada (1 linha, com o nome)",
  "primary_strength": { "headline": "...", "evidence": "2–3 linhas com exemplos reais" },
  "invisible_skill":  { "headline": "...", "evidence": "..." },
  "context_pattern":  { "headline": "...", "evidence": "..." },
  "closing_question": "pergunta honesta (1 linha, termina com '?')",
  "strength_themes": ["...", "...", "..."]
}
\`\`\`
`
```

`buildMirrorUserPrompt(entries, userName)` monta o bloco das entradas (what_i_did, company, role, impact, metric, tags) — igual à versão anterior.

---

## generateAndSaveMirror

```typescript
// src/lib/ai/mirror/generateMirror.ts
import Anthropic from '@anthropic-ai/sdk'
import { MIRROR_SYSTEM_PROMPT, buildMirrorUserPrompt } from './prompts/firstMirror'
import { validateMirror } from './schemas'
import { createServerClient } from '@/lib/db/supabase/server'

const client = new Anthropic()

export async function generateAndSaveMirror(userId: string) {
  const supabase = createServerClient()

  const { data: entries } = await supabase
    .from('entries')
    .select('what_i_did, company, role_title, tags, impact, metric')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!entries?.length) throw new Error('Sem entradas')

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
  const userName = profile?.name?.split(' ')[0] ?? 'você'

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: MIRROR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildMirrorUserPrompt(entries, userName) }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Resposta inesperada')
  const json = block.text.match(/```json\n([\s\S]*?)\n```/)
  if (!json) throw new Error('JSON não encontrado')

  const mirror = validateMirror(JSON.parse(json[1]))

  await supabase.from('mirror_snapshots').insert({
    user_id: userId,
    mirror,
    strength_themes: mirror.strength_themes,
    primary_strength: mirror.primary_strength,
    entry_count: entries.length,
  })

  return mirror
}
```

`/api/mirror/generate` (onboarding) chama `generateAndSaveMirror` e ainda marca `onboarding_completed = true`.

---

## Como a atualização viva fecha o loop com a captura

```
captura no composer (doc 002/004)
   │
   ├── Haiku: reflexo + entrada salva  ── indicadores sobem (INSTANTÂNEO)
   │
   └── maybeRegenerateMirror()
          │ (a cada 3 entradas)
          └── Sonnet: novo snapshot ── strength_themes atualizados
                                          │
                                          ├── headline do painel muda
                                          └── viram CONTEXTO da próxima captura (doc 004)
```

Os `strength_themes` do espelho voltam a alimentar o reflexo da captura seguinte — é o que permite movimentos como *"sua força em X pede mais evidência"*. O espelho informa a captura, a captura realimenta o espelho.

---

## Schema

```typescript
// src/types/mirror.ts
export interface MirrorSection { headline: string; evidence: string }
export interface Mirror {
  intro: string
  primary_strength: MirrorSection
  invisible_skill: MirrorSection
  context_pattern: MirrorSection
  closing_question: string
  strength_themes: string[]
}
```

```sql
create table public.mirror_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mirror jsonb not null,
  primary_strength jsonb,
  strength_themes text[] default '{}',
  entry_count int not null,
  generated_at timestamptz default now(),
  resonated boolean,
  feedback_text text
);
alter table public.mirror_snapshots enable row level security;
create policy "own mirror" on public.mirror_snapshots for all using (auth.uid() = user_id);
create index mirror_snapshots_user_idx on public.mirror_snapshots(user_id, generated_at desc);
```

---

## Custo (Sonnet)

| Cenário | Tokens | Custo |
|---|---|---|
| Primeiro espelho (5–10 entradas) | ~3.000 in + 700 out | ~$0.012 |
| Regeneração a cada 3 entradas | idem | ~$0.012 |

Com `REGEN_EVERY = 3`, um usuário ativo que captura ~12 entradas/mês gera ~4 sínteses Sonnet/mês ≈ $0.05/mês. Sustentável.

---

## Casos de borda

| Cenário | Comportamento |
|---|---|
| < 2 entradas | Gera mesmo assim; intro reconhece "primeiro vislumbre" |
| Regeneração falha (background) | Mantém snapshot anterior; tenta de novo na próxima captura |
| Usuário abre /espelho durante regen | Mostra snapshot atual + "atualizando..." |
| Feedback "nem tanto" | Salva; não regera no v1 |

---

## Microcopy

| Contexto | Texto |
|---|---|
| Loading (primeira vez) | "Processando o que você me contou..." |
| Regenerando (painel) | "atualizando seu espelho..." |
| Botões de feedback | "Sim, faz sentido" · "Nem tanto" |
| Erro | "Algo deu errado ao gerar seu espelho. Tenta de novo?" |

---

## Fora do escopo

- Regerar com feedback imediato ("nem tanto" não regera no v1)
- Espelho completo com lacunas/gaps detalhados
- Streaming da resposta do Sonnet
- Comparação entre snapshots ("seu espelho mudou desde X")
- Compartilhamento do espelho
