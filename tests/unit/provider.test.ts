import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getProvider, resetProviderCache } from '@/lib/ai/provider'
import { AnthropicProvider } from '@/lib/ai/providers/anthropic'
import { DeepSeekProvider } from '@/lib/ai/providers/deepseek'

describe('getProvider', () => {
  const originalProvider = process.env.AI_PROVIDER

  beforeEach(() => {
    resetProviderCache()
  })

  afterEach(() => {
    process.env.AI_PROVIDER = originalProvider
    resetProviderCache()
  })

  it('returns the Anthropic provider by default', () => {
    delete process.env.AI_PROVIDER

    expect(getProvider()).toBeInstanceOf(AnthropicProvider)
  })

  it('returns the DeepSeek stub when AI_PROVIDER=deepseek', () => {
    process.env.AI_PROVIDER = 'deepseek'

    expect(getProvider()).toBeInstanceOf(DeepSeekProvider)
  })

  it('falls back to Anthropic for an unknown AI_PROVIDER value', () => {
    process.env.AI_PROVIDER = 'something-else'

    expect(getProvider()).toBeInstanceOf(AnthropicProvider)
  })
})

describe('DeepSeekProvider', () => {
  it('throws because it is not enabled in the MVP', async () => {
    const provider = new DeepSeekProvider()

    await expect(
      provider.complete({ role: 'extraction', system: 's', user: 'u', maxTokens: 10 })
    ).rejects.toThrow('não habilitado no MVP')
  })
})
