import type { AIRole, ProviderName } from '@/lib/ai/provider'

const MODELS_BY_PROVIDER: Record<ProviderName, Record<AIRole, string>> = {
  anthropic: {
    extraction: 'claude-haiku-4-5',
    synthesis: 'claude-sonnet-4-6',
  },
  deepseek: {
    extraction: 'deepseek-chat',
    synthesis: 'deepseek-chat',
  },
}

/** Resolve o model id concreto para um papel lógico, dado o provider ativo. */
export function modelFor(provider: ProviderName, role: AIRole): string {
  return MODELS_BY_PROVIDER[provider][role]
}
