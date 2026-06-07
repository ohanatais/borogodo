import type { LLMProvider, LLMRequest } from '@/lib/ai/provider'

/**
 * Stub documentado — costura para um provider OpenAI-compatible mais barato (ex.: DeepSeek).
 * Não habilitado no MVP: trocar o default para um provider não-Anthropic exige emenda à
 * constituição (Princípio III — ver research.md D10).
 */
export class DeepSeekProvider implements LLMProvider {
  async complete(request: LLMRequest): Promise<string> {
    void request
    throw new Error('DeepSeek não habilitado no MVP')
  }
}
