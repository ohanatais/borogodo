import { getProvider, type LLMRequest } from '@/lib/ai/provider'

/** Ponto único de entrada para chamadas de LLM — delega ao provider ativo (`getProvider`). */
export async function complete(request: LLMRequest): Promise<string> {
  return getProvider().complete(request)
}
