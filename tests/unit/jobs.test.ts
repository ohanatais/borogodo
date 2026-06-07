import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))

vi.mock('@/lib/log', () => ({
  logger: { error: mockLoggerError },
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

describe('stubs (costuras para 004/005)', () => {
  it('triggerProactiveInsight resolve como no-op', async () => {
    await expect(triggerProactiveInsight('user-1')).resolves.toBeUndefined()
  })

  it('maybeRegenerateMirror resolve como no-op', async () => {
    await expect(maybeRegenerateMirror('user-1', 3)).resolves.toBeUndefined()
  })
})
