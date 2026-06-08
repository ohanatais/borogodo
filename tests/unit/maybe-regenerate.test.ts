import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGenerateAndSaveMirror, mockGetSupabaseAdmin, mockLoggerError } = vi.hoisted(() => ({
  mockGenerateAndSaveMirror: vi.fn(),
  mockGetSupabaseAdmin: vi.fn(),
  mockLoggerError: vi.fn(),
}))

vi.mock('@/lib/ai/mirror/generateMirror', () => ({
  generateAndSaveMirror: mockGenerateAndSaveMirror,
}))

vi.mock('@/lib/db/supabaseAdmin', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

vi.mock('@/lib/log', () => ({
  logger: { error: mockLoggerError, info: vi.fn(), warn: vi.fn() },
}))

import { maybeRegenerateMirror } from '@/lib/ai/mirror/maybeRegenerate'

function buildAdmin(lastCount: number | null) {
  const maybeSingle = vi.fn(async () => ({ data: lastCount === null ? null : { entry_count: lastCount }, error: null }))
  const limit = vi.fn(() => ({ maybeSingle }))
  const order = vi.fn(() => ({ limit }))
  const eq = vi.fn((column: string) => {
    expect(column).toBe('user_id')
    return { order }
  })
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    expect(table).toBe('mirror_snapshots')
    return { select }
  })

  return { from }
}

describe('maybeRegenerateMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateAndSaveMirror.mockResolvedValue({ id: 'snap-2' })
  })

  it('dispara generateAndSaveMirror quando newTotal - lastCount >= 3', async () => {
    const admin = buildAdmin(2)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1', 5)

    expect(mockGenerateAndSaveMirror).toHaveBeenCalledWith(admin, 'user-1')
  })

  it('não dispara quando newTotal - lastCount < 3', async () => {
    const admin = buildAdmin(4)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1', 6)

    expect(mockGenerateAndSaveMirror).not.toHaveBeenCalled()
  })

  it('considera lastCount = 0 quando não há snapshot anterior', async () => {
    const admin = buildAdmin(null)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1', 3)

    expect(mockGenerateAndSaveMirror).toHaveBeenCalledWith(admin, 'user-1')
  })

  it('loga e preserva o snapshot anterior quando a geração falha', async () => {
    const admin = buildAdmin(0)
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGenerateAndSaveMirror.mockRejectedValue(new Error('Sonnet indisponível'))

    await expect(maybeRegenerateMirror('user-1', 3)).resolves.toBeUndefined()

    expect(mockLoggerError).toHaveBeenCalled()
    const [, meta] = mockLoggerError.mock.calls[0] as [string, Record<string, unknown> | undefined]
    expect(JSON.stringify(meta ?? {})).not.toContain('user-1')
  })
})
