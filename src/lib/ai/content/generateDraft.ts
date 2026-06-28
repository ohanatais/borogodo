import { complete as defaultComplete, type GuardedRequest } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import { validateDraftOutput, type DraftOutput } from '@/lib/ai/content/schemas'
import { validateContentRuleset } from '@/lib/ai/content/validateRuleset'
import { POST_SYSTEM_PROMPT, buildPostUserPrompt } from '@/lib/ai/content/prompts/post'
import {
  IMPACT_SUMMARY_SYSTEM_PROMPT,
  buildImpactSummaryUserPrompt,
} from '@/lib/ai/content/prompts/impactSummary'
import { MINI_BIO_SYSTEM_PROMPT, buildMiniBioUserPrompt } from '@/lib/ai/content/prompts/miniBio'
import type { ContentPromptInput } from '@/lib/ai/content/prompts/discipline'
import { GenerationFailedError } from '@/lib/errors'
import type { ContentRulesetViolation, DraftFormat, DraftVariant } from '@/types/content'

const MAX_TOKENS = 2048

/** Chamada de LLM injetável — default usa o guard real; testes passam um mock. */
export type CompleteFn = (req: GuardedRequest) => Promise<string>

export interface GenerateDraftInput extends ContentPromptInput {
  format: DraftFormat
  /** Quem disparou — threaded até o guard de custo (023). */
  userId: string
}

interface PromptParts {
  system: string
  buildUser: (input: ContentPromptInput) => string
}

function promptFor(format: DraftFormat): PromptParts {
  if (format === 'impact_summary') {
    return { system: IMPACT_SUMMARY_SYSTEM_PROMPT, buildUser: buildImpactSummaryUserPrompt }
  }
  if (format === 'mini_bio') {
    return { system: MINI_BIO_SYSTEM_PROMPT, buildUser: buildMiniBioUserPrompt }
  }
  // 019: 'self_assessment' deixou de ser gerado (modelo cockpit — a pessoa escreve). O motor segue
  // dono só das superfícies "pra fora" (post/impact_summary/mini_bio).
  return { system: POST_SYSTEM_PROMPT, buildUser: buildPostUserPrompt }
}

function toVariants(output: DraftOutput): DraftVariant[] {
  return output.variants.map((v) => ({ angle: v.angle, body: v.body, evidenceRefs: v.evidence_refs }))
}

interface AttemptResult {
  output: DraftOutput | null
  violations: ContentRulesetViolation[]
}

/** Uma tentativa: chama o LLM, valida forma (Zod) e conteúdo (ruleset). Malformado → output null. */
async function attempt(
  system: string,
  user: string,
  format: DraftFormat,
  userId: string,
  complete: CompleteFn
): Promise<AttemptResult> {
  const raw = await complete({ role: 'synthesis', action: 'post', userId, system, user, maxTokens: MAX_TOKENS })

  let output: DraftOutput
  try {
    output = validateDraftOutput(extractJSONBlock(raw), format)
  } catch {
    return { output: null, violations: [] }
  }

  const violations = output.variants.flatMap((v, i) => validateContentRuleset(v.body, `variants[${i}].body`))
  return { output, violations }
}

function isClean(result: AttemptResult): result is { output: DraftOutput; violations: [] } {
  return result.output !== null && result.violations.length === 0
}

/**
 * Guardrail de opinião (US2, revisado na 018): preserva o moat onde há dado, sem prender onde não há.
 * Se o usuário tem evidência disponível, a opinião gerada precisa citá-la (`evidence_refs` não-vazio
 * em ao menos uma variante) — opinião que ignora o próprio histórico é falha. Mas opinião sem
 * nenhuma evidência disponível é válida (página em branco): aí o guardrail não se aplica. Os banned
 * terms anti-opinião-oca (assert 11) seguem valendo nos dois casos.
 */
function passesOpinionGuardrail(input: GenerateDraftInput, output: DraftOutput): boolean {
  if (input.angleKind !== 'opinion') return true
  if (input.evidence.length === 0) return true
  return output.variants.some((v) => v.evidence_refs.length > 0)
}

const MALFORMED_FEEDBACK =
  '\n\nA tentativa anterior não voltou no formato JSON pedido. Devolva exatamente 2 variantes no formato especificado.'

function violationFeedback(violations: ContentRulesetViolation[]): string {
  const lines = violations.map((v) => `- (regra ${v.assert}) ${v.message}`).join('\n')
  return `\n\nA tentativa anterior violou as regras de voz abaixo. Reescreva corrigindo cada uma, mantendo a evidência:\n${lines}`
}

/**
 * Orquestrador puro de geração (T013). Recebe evidência + voz + formato (não toca no banco nem em
 * auth — isso fica na rota). Gera com `claude-sonnet-4-6` (role synthesis), valida Zod + ruleset
 * anti-IA, regenera UMA vez em violação/malformado e lança `GenerationFailedError` na 2ª falha.
 * Nunca devolve variante que não passou nas duas validações.
 */
export async function generateDraft(
  input: GenerateDraftInput,
  complete: CompleteFn = defaultComplete
): Promise<{ variants: DraftVariant[] }> {
  const { format, userId, ...promptInput } = input
  const { system, buildUser } = promptFor(format)
  const baseUser = buildUser(promptInput)

  const first = await attempt(system, baseUser, format, userId, complete)
  if (isClean(first) && passesOpinionGuardrail(input, first.output)) {
    return { variants: toVariants(first.output) }
  }

  const feedback = first.violations.length > 0 ? violationFeedback(first.violations) : MALFORMED_FEEDBACK
  const second = await attempt(system, baseUser + feedback, format, userId, complete)
  if (isClean(second) && passesOpinionGuardrail(input, second.output)) {
    return { variants: toVariants(second.output) }
  }

  throw new GenerationFailedError(second.violations.map((v) => v.assert))
}
