import { AnthropicProvider } from '@/lib/ai/providers/anthropic'
import { DeepSeekProvider } from '@/lib/ai/providers/deepseek'

export type AIRole = 'extraction' | 'synthesis'

export interface LLMRequest {
  role: AIRole
  system: string
  user: string
  maxTokens: number
}

export interface LLMProvider {
  complete(request: LLMRequest): Promise<string>
}

export type ProviderName = 'anthropic' | 'deepseek'

function resolveProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER

  if (value === 'deepseek') {
    return 'deepseek'
  }

  return 'anthropic'
}

let cachedProvider: LLMProvider | null = null

/**
 * Resolve o provider de IA ativo a partir de `AI_PROVIDER` (default `anthropic`).
 * Trocar o default para um provider não-Anthropic exige emenda à constituição (Princípio III).
 */
export function getProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider
  }

  cachedProvider = createProvider(resolveProviderName())
  return cachedProvider
}

function createProvider(name: ProviderName): LLMProvider {
  if (name === 'deepseek') {
    return new DeepSeekProvider()
  }

  return new AnthropicProvider()
}

/** Uso interno de testes — evita estado compartilhado entre casos. */
export function resetProviderCache(): void {
  cachedProvider = null
}
