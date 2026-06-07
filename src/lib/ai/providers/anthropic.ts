import Anthropic from '@anthropic-ai/sdk'
import { modelFor } from '@/lib/ai/models'
import type { LLMProvider, LLMRequest } from '@/lib/ai/provider'

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (cachedClient) {
    return cachedClient
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada')
  }

  cachedClient = new Anthropic({ apiKey })
  return cachedClient
}

/** Provider default do MVP — Haiku para extração, Sonnet para síntese (Princípio III). */
export class AnthropicProvider implements LLMProvider {
  async complete(request: LLMRequest): Promise<string> {
    const message = await getClient().messages.create({
      model: modelFor('anthropic', request.role),
      max_tokens: request.maxTokens,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    })

    const block = message.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('Resposta inesperada do modelo')
    }

    return block.text
  }
}
