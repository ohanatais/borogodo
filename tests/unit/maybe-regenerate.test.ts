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

// Builds a mock admin that handles both mirror_snapshots (lastCount) and entries (totalCount).
function buildAdmin(lastSnapshotCount: number | null, totalEntryCount: number, readError: { message: string } | null = null) {
  const snapshotMaybeSingle = vi.fn(async () => ({
    data: readError || lastSnapshotCount === null ? null : { entry_count: lastSnapshotCount },
    error: readError,
  }))

  const countThen = (resolve: (value: { count: number | null; error: null }) => unknown) =>
    resolve({ count: readError ? null : totalEntryCount, error: null })

  const snapshotChain: Record<string, unknown> = {
    select: vi.fn(() => snapshotChain),
    eq: vi.fn(() => snapshotChain),
    order: vi.fn(() => snapshotChain),
    limit: vi.fn(() => snapshotChain),
    maybeSingle: snapshotMaybeSingle,
  }

  const entriesChain: Record<string, unknown> = {
    select: vi.fn(() => entriesChain),
    eq: vi.fn(() => entriesChain),
    then: countThen,
  }

  const from = vi.fn((table: string) => {
    if (table === 'mirror_snapshots') return snapshotChain
    if (table === 'entries') return entriesChain
    throw new Error(`unexpected table: ${table}`)
  })

  return { from }
}

describe('maybeRegenerateMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateAndSaveMirror.mockResolvedValue({ id: 'snap-2' })
  })

  it('dispara generateAndSaveMirror quando total - lastCount >= 3', async () => {
    const admin = buildAdmin(2, 5)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1')

    expect(mockGenerateAndSaveMirror).toHaveBeenCalledWith(admin, 'user-1')
  })

  it('não dispara quando total - lastCount < 3', async () => {
    const admin = buildAdmin(4, 6)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1')

    expect(mockGenerateAndSaveMirror).not.toHaveBeenCalled()
  })

  it('considera lastCount = 0 quando não há snapshot anterior e gera com 3+ entradas', async () => {
    const admin = buildAdmin(null, 3)
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await maybeRegenerateMirror('user-1')

    expect(mockGenerateAndSaveMirror).toHaveBeenCalledWith(admin, 'user-1')
  })

  it('pula a regeneração e loga quando a leitura falha (não trata erro como zero)', async () => {
    const admin = buildAdmin(null, 0, { message: 'connection reset' })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await expect(maybeRegenerateMirror('user-1')).resolves.toBeUndefined()

    expect(mockGenerateAndSaveMirror).not.toHaveBeenCalled()
    expect(mockLoggerError).toHaveBeenCalled()
  })

  it('loga e preserva o snapshot anterior quando a geração falha', async () => {
    const admin = buildAdmin(0, 3)
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockGenerateAndSaveMirror.mockRejectedValue(new Error('Sonnet indisponível'))

    await expect(maybeRegenerateMirror('user-1')).resolves.toBeUndefined()

    expect(mockLoggerError).toHaveBeenCalled()
    const [, meta] = mockLoggerError.mock.calls[0] as [string, Record<string, unknown> | undefined]
    expect(JSON.stringify(meta ?? {})).not.toContain('user-1')
  })
})
