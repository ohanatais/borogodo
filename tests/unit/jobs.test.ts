import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLoggerError, mockRegenerateMirror } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
  mockRegenerateMirror: vi.fn(async () => {}),
}))

vi.mock('@/lib/log', () => ({
  logger: { error: mockLoggerError },
}))

vi.mock('@/lib/ai/mirror/maybeRegenerate', () => ({
  maybeRegenerateMirror: mockRegenerateMirror,
}))

import { fireAndForget, triggerProactiveInsight, maybeRegenerateMirror } from '@/lib/ai/extraction/jobs'

describe('fireAndForget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não propaga erro do job e registra falha sem dados de usuário', async () => {
    const failingJob = Promise.reject(new Error('falha de rede'))

    expect(() => fireAndForget('triggerProactiveInsight', failingJob)).not.toThrow()
    await failingJob.catch(() => {})
    await Promise.resolve()

    expect(mockLoggerError).toHaveBeenCalledWith('async job failed', {
      job: 'triggerProactiveInsight',
      message: 'falha de rede',
    })
  })

  it('não registra nada quando o job é bem-sucedido', async () => {
    const okJob = Promise.resolve()

    fireAndForget('maybeRegenerateMirror', okJob)
    await okJob

    expect(mockLoggerError).not.toHaveBeenCalled()
  })
})

describe('triggerProactiveInsight (stub costura para 005)', () => {
  it('resolve como no-op', async () => {
    await expect(triggerProactiveInsight('user-1')).resolves.toBeUndefined()
  })
})

describe('maybeRegenerateMirror (costura ligada à 004)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delega para a regeneração real sem alterar a assinatura', async () => {
    await maybeRegenerateMirror('user-1', 5)

    expect(mockRegenerateMirror).toHaveBeenCalledWith('user-1', 5)
  })
})
