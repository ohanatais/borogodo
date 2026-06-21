import { z } from 'zod'
import { complete as defaultComplete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import type { LLMRequest } from '@/lib/ai/provider'
import { validateContentRuleset } from '@/lib/ai/content/validateRuleset'
import { ANTI_AI_DISCIPLINE } from '@/lib/ai/content/prompts/discipline'
import type { ForwardStep } from '@/types/content'

/** Chamada de LLM injetável — default usa o client real; testes passam um mock. */
export type CompleteFn = (req: LLMRequest) => Promise<string>

/** A saída inventou (âncora sem lastro no body) ou veio malformada após 1 retry → não persiste nada. */
export class ForwardStepFailedError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'ForwardStepFailedError'
  }
}

const MAX_TOKENS = 1024

const planSchema = z.object({
  area: z.string().min(1),
  experienceAction: z.string().min(1),
  commitmentQuestion: z.string().min(1),
  /** Trechos LITERAIS copiados do body — a prova de lastro (anti-invenção). */
  anchoredOn: z.array(z.string().min(1)).min(1),
})
type Plan = z.infer<typeof planSchema>

const SYSTEM_PROMPT = `${ANTI_AI_DISCIPLINE}

Você é um coach de carreira que transforma o que a pessoa ESCREVEU sobre o próprio período num plano de
ação curto, no modelo GROW (foco no "Will": compromisso concreto) combinado com 70-20-10 (priorize uma
ação de EXPERIÊNCIA real no trabalho, não um curso).

Regras inegociáveis (a peça mais delicada da ferramenta):
- Use SOMENTE o que está no texto da pessoa. A "área" a desenvolver SÓ pode ser algo que ela mesma
  escreveu querer afiar/desenvolver. NÃO invente uma fraqueza, NÃO infle um caso, NÃO adicione fato,
  número ou projeto que não esteja no texto.
- "anchoredOn" deve conter de 1 a 3 trechos LITERAIS (cópia exata, palavra por palavra) do texto da
  pessoa que sustentam o plano. Se você não consegue copiar um trecho literal que sustente a área, não
  invente: escolha outra área que esteja de fato no texto.
- A ação de experiência e a pergunta de compromisso devem ser concretas e na voz de quem ajuda, nunca
  genéricas de coach.

SAÍDA: apenas JSON dentro de um bloco de código, neste formato:
\`\`\`json
{
  "area": "a área que a PESSOA escreveu querer desenvolver",
  "experienceAction": "uma ação de experiência concreta no trabalho",
  "commitmentQuestion": "uma pergunta de compromisso (quando/como você começa?)",
  "anchoredOn": ["trecho literal copiado do texto da pessoa"]
}
\`\`\``

/** Normaliza para a checagem de lastro: minúsculas + espaços colapsados (tolera diferença de espaçamento). */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

type AttemptResult =
  | { ok: true; plan: Plan }
  | { ok: false }

/** Uma tentativa: parse Zod + lastro (âncoras no body) + ruleset anti-IA nos textos gerados. */
function evaluate(raw: string, body: string): AttemptResult {
  let plan: Plan
  try {
    plan = planSchema.parse(extractJSONBlock(raw))
  } catch {
    return { ok: false }
  }

  // Anti-invenção BLOQUEANTE: toda âncora precisa existir literalmente no body da pessoa.
  const normalizedBody = normalize(body)
  const anchored = plan.anchoredOn.every((quote) => normalizedBody.includes(normalize(quote)))
  if (!anchored) return { ok: false }

  // Os textos gerados ainda passam pela disciplina anti-IA (é saída de modelo).
  const violations = [plan.area, plan.experienceAction, plan.commitmentQuestion].flatMap((t) =>
    validateContentRuleset(t)
  )
  if (violations.length > 0) return { ok: false }

  return { ok: true, plan }
}

/**
 * Passo-pra-frente (019, US2, research D5) — ÚNICA IA geradora da feature, com o guarda-corpo mais
 * forte: o conteúdo deriva só do `body` que a pessoa escreveu, e cada âncora precisa estar literalmente
 * no texto (anti-invenção bloqueante). Inventou área/caso → falha → 1 retry → `ForwardStepFailedError`
 * (a rota mapeia 422). v1: só plano de ação (GROW Will + 70-20-10). `claude-sonnet-4-6`.
 */
export async function forwardStep(
  input: { body: string },
  complete: CompleteFn = defaultComplete
): Promise<ForwardStep> {
  const user = `Texto que a pessoa escreveu na autoavaliação:\n\n${input.body}`

  const first = evaluate(await complete({ role: 'synthesis', system: SYSTEM_PROMPT, user, maxTokens: MAX_TOKENS }), input.body)
  const result = first.ok
    ? first
    : evaluate(
        await complete({
          role: 'synthesis',
          system: SYSTEM_PROMPT,
          user: `${user}\n\nA tentativa anterior falhou (inventou algo sem lastro ou veio fora do formato). Refaça usando SÓ trechos literais do texto acima.`,
          maxTokens: MAX_TOKENS,
        }),
        input.body
      )

  if (!result.ok) {
    throw new ForwardStepFailedError('forward step output not anchored in the person body')
  }

  return {
    kind: 'action_plan',
    anchoredOn: result.plan.anchoredOn,
    actionPlan: {
      area: result.plan.area,
      experienceAction: result.plan.experienceAction,
      commitmentQuestion: result.plan.commitmentQuestion,
    },
    generatedAt: new Date().toISOString(),
  }
}
