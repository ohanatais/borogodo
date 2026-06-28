import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockComplete = vi.hoisted(() => vi.fn())
const mockCount = vi.hoisted(() => vi.fn())
const mockSumDaily = vi.hoisted(() => vi.fn())
const mockInsert = vi.hoisted(() => vi.fn())
const mockSecondsUntil = vi.hoisted(() => vi.fn())
const mockTryMark = vi.hoisted(() => vi.fn())
const mockSendAlert = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai/provider')>()
  return { ...actual, getProvider: () => ({ complete: mockComplete }) }
})

vi.mock('@/lib/db/aiUsage', () => ({
  GENERATION_ACTIONS: ['mirror', 'post', 'self_assessment', 'chat'],
  countGenerationsLastHour: mockCount,
  sumDailyCostUsd: mockSumDaily,
  insertUsageEvent: mockInsert,
  secondsUntilGenerationFrees: mockSecondsUntil,
  tryMarkDailyAlert: mockTryMark,
}))

vi.mock('@/lib/ai/cost/limits', () => ({
  getLimits: () => ({ ratePerHour: 2, dailyCapUsd: 0.1, warnRatio: 0.7 }),
  OPS_ALERT_EMAIL: 'admin@borogodo.ai',
}))

vi.mock('@/lib/ai/cost/alert', () => ({ sendOpsAlert: mockSendAlert }))

import { complete } from '@/lib/ai/client'
import { DailyCapReachedError, RateLimitedError } from '@/lib/errors'

const okResult = {
  text: 'ok',
  model: 'claude-sonnet-4-6',
  usage: { inputTokens: 100, outputTokens: 50 },
}

function genRequest(action: 'mirror' | 'post' | 'chat' | 'self_assessment' = 'post') {
  return { role: 'synthesis' as const, system: 's', user: 'u', maxTokens: 100, userId: 'u1', action }
}

describe('guard complete()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComplete.mockResolvedValue(okResult)
    mockCount.mockResolvedValue(0)
    mockSumDaily.mockResolvedValue(0)
    mockInsert.mockResolvedValue(undefined)
    mockSecondsUntil.mockResolvedValue(1800)
    mockTryMark.mockResolvedValue(false)
    mockSendAlert.mockResolvedValue(undefined)
  })

  it('geração abaixo do limite passa e registra 1 evento de uso', async () => {
    const text = await complete(genRequest())
    expect(text).toBe('ok')
    expect(mockComplete).toHaveBeenCalledOnce()
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it('N+1ª geração na hora lança RateLimitedError sem chamar o provider', async () => {
    mockCount.mockResolvedValue(2) // já no limite (ratePerHour=2)
    await expect(complete(genRequest())).rejects.toBeInstanceOf(RateLimitedError)
    expect(mockComplete).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('RateLimitedError carrega o retryAfterSeconds', async () => {
    mockCount.mockResolvedValue(5)
    mockSecondsUntil.mockResolvedValue(900)
    await expect(complete(genRequest())).rejects.toMatchObject({ retryAfterSeconds: 900 })
  })

  it('captura com usuário no limite de geração NÃO é bloqueada, mas é contabilizada', async () => {
    mockCount.mockResolvedValue(99)
    mockSumDaily.mockResolvedValue(999)
    const req = { role: 'extraction' as const, system: 's', user: 'u', maxTokens: 100, userId: 'u1', action: 'capture' as const }
    const text = await complete(req)
    expect(text).toBe('ok')
    expect(mockComplete).toHaveBeenCalledOnce()
    expect(mockInsert).toHaveBeenCalledOnce()
  })

  it('gasto diário ≥ teto lança DailyCapReachedError para geração', async () => {
    mockSumDaily.mockResolvedValue(0.1) // == teto
    await expect(complete(genRequest())).rejects.toBeInstanceOf(DailyCapReachedError)
    expect(mockComplete).not.toHaveBeenCalled()
  })

  it('gasto diário ≥ teto NÃO bloqueia captura', async () => {
    mockSumDaily.mockResolvedValue(5)
    const req = { role: 'extraction' as const, system: 's', user: 'u', maxTokens: 100, userId: 'u1', action: 'capture' as const }
    await expect(complete(req)).resolves.toBe('ok')
  })

  it('cruzar o teto após registrar dispara o alerta de teto uma vez', async () => {
    // antes da chamada: 0 (passa o pré-check); depois: acima do teto.
    mockSumDaily.mockResolvedValueOnce(0).mockResolvedValue(0.2)
    mockTryMark.mockResolvedValue(true)
    await complete(genRequest())
    expect(mockTryMark).toHaveBeenCalledWith('capped')
    expect(mockSendAlert).toHaveBeenCalledWith('cap_reached')
  })

  it('cruzar só o limiar de aviso dispara o preventivo, não o de teto', async () => {
    mockSumDaily.mockResolvedValueOnce(0).mockResolvedValue(0.08) // 80% de 0.1
    mockTryMark.mockResolvedValue(true)
    await complete(genRequest())
    expect(mockSendAlert).toHaveBeenCalledWith('preventive')
  })

  it('falha ao registrar uso não derruba a resposta', async () => {
    mockInsert.mockRejectedValue(new Error('db down'))
    await expect(complete(genRequest())).resolves.toBe('ok')
  })
})
