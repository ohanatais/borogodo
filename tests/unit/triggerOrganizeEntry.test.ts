import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLoggerError, mockOrganizeEntry, mockGetSupabaseAdmin } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
  mockOrganizeEntry: vi.fn(async () => ({ status: 'organized' as const })),
  mockGetSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/log', () => ({
  logger: { error: mockLoggerError },
}))

vi.mock('@/lib/entries/organizeEntry', () => ({
  organizeEntry: mockOrganizeEntry,
}))

vi.mock('@/lib/db/supabaseAdmin', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}))

import { triggerOrganizeEntry } from '@/lib/ai/extraction/jobs'

function makeAdmin(options: { organizingStartedAt?: string | null; selectError?: unknown; lockError?: unknown }) {
  const { organizingStartedAt = null, selectError = null, lockError = null } = options

  const selectBuilder = {
    select: vi.fn(() => selectBuilder),
    eq: vi.fn(() => selectBuilder),
    maybeSingle: vi.fn(async () => ({ data: { organizing_started_at: organizingStartedAt }, error: selectError })),
  }

  const updateBuilder = {
    update: vi.fn(() => updateBuilder),
    eq: vi.fn(() => updateBuilder),
    then: (resolve: (v: { data: null; error: unknown }) => unknown) => resolve({ data: null, error: lockError }),
  }

  let callCount = 0
  const from = vi.fn(() => {
    callCount += 1
    return callCount === 1 ? selectBuilder : updateBuilder
  })

  return { from }
}

describe('triggerOrganizeEntry (US3 — organização assíncrona no salvar)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T036 — chama organizeEntry quando não há organização em andamento', async () => {
    const admin = makeAdmin({})
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerOrganizeEntry('user-1', 'entry-1')

    expect(mockOrganizeEntry).toHaveBeenCalledTimes(1)
    expect(mockOrganizeEntry).toHaveBeenCalledWith(admin, 'user-1', 'entry-1')
  })

  it('T036 — não chama organizeEntry quando já há uma organização recente em andamento (guarda de concorrência, FR-031)', async () => {
    const admin = makeAdmin({ organizingStartedAt: new Date().toISOString() })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerOrganizeEntry('user-1', 'entry-1')

    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  it('T035/FR-030 — falha de organizeEntry não lança e não bloqueia o disparo assíncrono', async () => {
    const admin = makeAdmin({})
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockOrganizeEntry.mockRejectedValueOnce(new Error('falha de IA'))

    await expect(triggerOrganizeEntry('user-1', 'entry-1')).resolves.toBeUndefined()
  })

  it('não chama organizeEntry quando a fonte não é encontrada', async () => {
    const selectBuilder = {
      select: vi.fn(() => selectBuilder),
      eq: vi.fn(() => selectBuilder),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    }
    mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn(() => selectBuilder) })

    await triggerOrganizeEntry('user-1', 'entry-inexistente')

    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })
})
