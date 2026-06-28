import { describe, it, expect } from 'vitest'
import { aiLimitResponse } from '../limitResponse'
import { parseAiLimit } from '../clientLimit'
import { DailyCapReachedError, RateLimitedError } from '@/lib/errors'

describe('aiLimitResponse (servidor → 429)', () => {
  it('mapeia RateLimitedError para 429 com code, retryAfterSeconds e header Retry-After', async () => {
    const res = aiLimitResponse(new RateLimitedError(1800))
    expect(res).not.toBeNull()
    expect(res?.status).toBe(429)
    expect(res?.headers.get('Retry-After')).toBe('1800')
    const body = await res?.json()
    expect(body).toMatchObject({ code: 'ai_rate_limited', retryAfterSeconds: 1800 })
  })

  it('mapeia DailyCapReachedError para 429 com code ai_overloaded', async () => {
    const res = aiLimitResponse(new DailyCapReachedError())
    expect(res?.status).toBe(429)
    const body = await res?.json()
    expect(body).toMatchObject({ code: 'ai_overloaded' })
  })

  it('devolve null para erros que não são do freio', () => {
    expect(aiLimitResponse(new Error('outro'))).toBeNull()
  })
})

describe('parseAiLimit (cliente lê o 429)', () => {
  function res429(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 429, headers: { 'Content-Type': 'application/json' } })
  }

  it('converte ai_rate_limited em minutos arredondados pra cima (mín. 1)', async () => {
    expect(await parseAiLimit(res429({ code: 'ai_rate_limited', retryAfterSeconds: 1800 }))).toEqual({
      kind: 'rateLimited',
      minutes: 30,
    })
    expect(await parseAiLimit(res429({ code: 'ai_rate_limited', retryAfterSeconds: 10 }))).toEqual({
      kind: 'rateLimited',
      minutes: 1,
    })
  })

  it('reconhece ai_overloaded', async () => {
    expect(await parseAiLimit(res429({ code: 'ai_overloaded' }))).toEqual({ kind: 'overloaded', minutes: 0 })
  })

  it('devolve null para respostas que não são 429 do freio', async () => {
    expect(await parseAiLimit(new Response('ok', { status: 200 }))).toBeNull()
    expect(await parseAiLimit(res429({ error: 'outra coisa' }))).toBeNull()
  })
})
