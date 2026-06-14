/**
 * Smoke test da geração do espelho — caminho REAL (chama o Sonnet de verdade).
 *
 * Não roda no `npm test`/CI: fica desligado até `RUN_SMOKE=1`. Quando ligado, faz UMA
 * chamada paga ao Anthropic (~US$0,012) usando os módulos de produção (prompt → provider →
 * extração de JSON → validação Zod) e IMPRIME o espelho gerado, para inspeção visual.
 *
 * Como rodar:
 *   RUN_SMOKE=1 npx vitest run tests/smoke/mirror-generation.smoke.test.ts --reporter verbose
 *
 * Não toca no banco nem precisa de login — só prova que a IA gera um espelho válido a partir
 * de entradas. A persistência (`mirror_snapshots`) e a UI de revelação (006) ficam de fora.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { getProvider } from '@/lib/ai/provider'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { MIRROR_SYSTEM_PROMPT, buildMirrorUserPrompt } from '@/lib/ai/mirror/prompts/firstMirror'
import { validateMirror } from '@/lib/ai/mirror/schemas'

// Vitest não carrega .env.local (o Next.js carrega). Lemos a chave manualmente, sem dep extra.
function loadAnthropicKey(): void {
  if (process.env.ANTHROPIC_API_KEY) return
  try {
    const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    const match = env.match(/^ANTHROPIC_API_KEY=(.*)$/m)
    if (match?.[1]) {
      process.env.ANTHROPIC_API_KEY = match[1].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // sem .env.local — o teste vai falhar com mensagem clara do provider
  }
}

// Entradas fictícias mas realistas, no formato que `/api/mirror/generate` lê de `entries`.
const SAMPLE_ENTRIES = [
  {
    id: 'entry-smoke-1',
    what_i_did: 'Conduzi a migração do banco de pagamentos sem downtime, num fim de semana, com o time todo de plantão',
    company: 'Nubank',
    role_title: 'Engenheira de Software Sênior',
    tags: ['decisão sob pressão', 'migração', 'infraestrutura'],
    impact: 'Zero incidentes em produção; o time replicou o playbook em outras migrações',
    metric: '0 minutos de downtime',
  },
  {
    id: 'entry-smoke-2',
    what_i_did: 'Traduzi um problema técnico denso de latência para os stakeholders de negócio decidirem o trade-off de custo',
    company: 'Nubank',
    role_title: 'Engenheira de Software Sênior',
    tags: ['comunicação', 'síntese para stakeholders'],
    impact: 'A liderança aprovou o investimento em cache na mesma reunião',
    metric: null,
  },
  {
    id: 'entry-smoke-3',
    what_i_did: 'Criei do zero o processo de onboarding técnico dos novos engenheiros porque ninguém tinha dono',
    company: 'iFood',
    role_title: 'Engenheira de Software',
    tags: ['0→1', 'mentoria', 'iniciativa'],
    impact: 'Tempo até o primeiro deploy caiu de 3 semanas para 4 dias',
    metric: '3 semanas → 4 dias',
  },
  {
    id: 'entry-smoke-4',
    what_i_did: 'Segurei a comunicação do time durante um incidente crítico enquanto a engenharia investigava',
    company: 'iFood',
    role_title: 'Engenheira de Software',
    tags: ['liderança', 'calma sob crise'],
    impact: 'Stakeholders permaneceram informados e calmos; a confiança no time aumentou',
    metric: null,
  },
]

const MAX_TOKENS = 2048

describe.runIf(process.env.RUN_SMOKE)('SMOKE: geração real do espelho (Sonnet)', () => {
  it('gera um espelho válido a partir de entradas e imprime o resultado', async () => {
    loadAnthropicKey()

    const raw = await getProvider().complete({
      role: 'synthesis',
      system: MIRROR_SYSTEM_PROMPT,
      user: buildMirrorUserPrompt(SAMPLE_ENTRIES, 'Ana', 'emerging'),
      maxTokens: MAX_TOKENS,
    })

    const mirror = validateMirror(extractJSONBlock(raw))

    // eslint-disable-next-line no-console
    console.log(
      '\n===== ESPELHO GERADO =====\n' +
        `\n${mirror.intro}\n` +
        `\n● Força principal — ${mirror.primary_strength.headline}\n  ${mirror.primary_strength.evidence.text}\n` +
        `\n● Skill invisível — ${mirror.invisible_skill.headline}\n  ${mirror.invisible_skill.evidence.text}\n` +
        `\n● Padrão de contexto — ${mirror.context_pattern.headline}\n  ${mirror.context_pattern.evidence.text}\n` +
        `\n${mirror.closing}\n` +
        `\n🏷  Temas de força: ${mirror.strength_themes.join(' · ')}\n` +
        '\n==========================\n'
    )

    expect(mirror.strength_themes.length).toBeGreaterThanOrEqual(3)
    expect(mirror.primary_strength.headline.length).toBeGreaterThan(0)
  }, 30000)
})
