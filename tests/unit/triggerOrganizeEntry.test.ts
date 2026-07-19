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

/**
 * Simula `tryAcquireOrganizingLock` (`src/lib/entries/organizingLock.ts`) — o lock passou a ser
 * um único `UPDATE ... WHERE organizing_started_at IS NULL OR organizing_started_at < cutoff`
 * (atômico), não mais um `SELECT` seguido de `UPDATE` separados. `lockAcquired: false` simula a
 * linha não casando o `UPDATE` (já organizando ou não encontrada); `existingRow: null` faz a
 * checagem de fallback (`SELECT ... maybeSingle`) tratar isso como fonte inexistente.
 */
function makeAdmin(options: { lockAcquired?: boolean; existingRow?: { id: string } | null } = {}) {
  const { lockAcquired = true, existingRow = { id: 'entry-1' } } = options

  const updateBuilder = {
    update: vi.fn(() => updateBuilder),
    eq: vi.fn(() => updateBuilder),
    or: vi.fn(() => updateBuilder),
    select: vi.fn(async () => ({ data: lockAcquired ? [{ id: 'entry-1' }] : [], error: null })),
  }

  const selectBuilder = {
    select: vi.fn(() => selectBuilder),
    eq: vi.fn(() => selectBuilder),
    maybeSingle: vi.fn(async () => ({ data: existingRow, error: null })),
  }

  let callCount = 0
  const from = vi.fn(() => {
    callCount += 1
    return callCount === 1 ? updateBuilder : selectBuilder
  })

  return { from }
}

describe('triggerOrganizeEntry (US3 — organização assíncrona no salvar)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T036 — chama organizeEntry quando adquire o lock (nenhuma organização em andamento)', async () => {
    const admin = makeAdmin({ lockAcquired: true })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerOrganizeEntry('user-1', 'entry-1')

    expect(mockOrganizeEntry).toHaveBeenCalledTimes(1)
    expect(mockOrganizeEntry).toHaveBeenCalledWith(admin, 'user-1', 'entry-1')
  })

  it('T036 — não chama organizeEntry quando já há uma organização recente em andamento (guarda de concorrência, FR-031)', async () => {
    const admin = makeAdmin({ lockAcquired: false, existingRow: { id: 'entry-1' } })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerOrganizeEntry('user-1', 'entry-1')

    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

  it('T035/FR-030 — falha de organizeEntry não lança e não bloqueia o disparo assíncrono', async () => {
    const admin = makeAdmin({ lockAcquired: true })
    mockGetSupabaseAdmin.mockReturnValue(admin)
    mockOrganizeEntry.mockRejectedValueOnce(new Error('falha de IA'))

    await expect(triggerOrganizeEntry('user-1', 'entry-1')).resolves.toBeUndefined()
  })

  it('não chama organizeEntry quando a fonte não é encontrada', async () => {
    const admin = makeAdmin({ lockAcquired: false, existingRow: null })
    mockGetSupabaseAdmin.mockReturnValue(admin)

    await triggerOrganizeEntry('user-1', 'entry-inexistente')

    expect(mockOrganizeEntry).not.toHaveBeenCalled()
  })

})
