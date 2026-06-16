import { complete as defaultComplete } from '@/lib/ai/client'
import { extractJSONBlock } from '@/lib/ai/extractJSON'
import type { LLMRequest } from '@/lib/ai/provider'
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

/** Chamada de LLM injetável — default usa o client real; testes passam um mock. */
export type CompleteFn = (req: LLMRequest) => Promise<string>

export interface GenerateDraftInput extends ContentPromptInput {
  format: DraftFormat
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
  complete: CompleteFn
): Promise<AttemptResult> {
  const raw = await complete({ role: 'synthesis', system, user, maxTokens: MAX_TOKENS })

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
  const { format, ...promptInput } = input
  const { system, buildUser } = promptFor(format)
  const baseUser = buildUser(promptInput)

  const first = await attempt(system, baseUser, format, complete)
  if (isClean(first)) {
    return { variants: toVariants(first.output) }
  }

  const feedback = first.violations.length > 0 ? violationFeedback(first.violations) : MALFORMED_FEEDBACK
  const second = await attempt(system, baseUser + feedback, format, complete)
  if (isClean(second)) {
    return { variants: toVariants(second.output) }
  }

  throw new GenerationFailedError(second.violations.map((v) => v.assert))
}
