import { AnthropicProvider } from '@/lib/ai/providers/anthropic'
import { DeepSeekProvider } from '@/lib/ai/providers/deepseek'

export type AIRole = 'extraction' | 'synthesis'

/**
 * Ação lógica que disparou a chamada de IA. Decide, no guard (`src/lib/ai/client.ts`), se a
 * chamada entra no limite por hora e na trava diária (023-freio-de-custo).
 * - `capture`/`insight`/`sufficiency`/`organize`: NUNCA bloqueadas (captura é o moat; insight é
 *   proativo do sistema; sufficiency é checagem barata de prontidão do espelho; `organize`
 *   (026-organizar-destaques) é extração Haiku sobre um registro já salvo, mesma família de
 *   `capture` — nunca conta contra o freio de geração).
 * - `mirror`/`post`/`self_assessment`/`chat`/`voice`: ações de geração (Sonnet) disparadas pela
 *   pessoa, sujeitas ao limite por hora e à trava diária. `voice` (calibração de voz) entra como
 *   extensão consciente da lista da spec: é Sonnet pago e user-triggered, então também tem freio.
 */
export type AIAction =
  | 'capture'
  | 'insight'
  | 'sufficiency'
  | 'organize'
  | 'mirror'
  | 'post'
  | 'self_assessment'
  | 'chat'
  | 'voice'

export interface LLMRequest {
  role: AIRole
  system: string
  user: string
  maxTokens: number
}

/** Tokens consumidos numa chamada — base para o cálculo de custo (023). */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

/** Resposta do provider: texto + uso de tokens + model id efetivo (023 — o custo nasce daqui). */
export interface CompletionResult {
  text: string
  usage: TokenUsage
  model: string
}

export interface LLMProvider {
  complete(request: LLMRequest): Promise<CompletionResult>
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
 *
 * NÃO chamar direto da aplicação: toda chamada paga passa pelo guard `complete()` em
 * `src/lib/ai/client.ts`, que aplica o freio de custo e registra o uso (023-freio-de-custo).
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
