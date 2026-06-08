import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLoggerError = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockUpdate = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })))
const mockFrom = vi.hoisted(() => vi.fn(() => ({ update: mockUpdate })))
const mockCreateServerClient = vi.hoisted(() => vi.fn(async () => ({ from: mockFrom })))

vi.mock('@/lib/log', () => ({ logger: { error: mockLoggerError } }))
vi.mock('@/lib/db/supabase/server', () => ({ createServerClient: mockCreateServerClient }))

import { markInsightSeen } from '@/lib/actions/insights'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('markInsightSeen', () => {
  it('updates the insight as seen, scoped by id', async () => {
    mockEq.mockResolvedValue({ error: null })

    await markInsightSeen('insight-1')

    expect(mockFrom).toHaveBeenCalledWith('proactive_insights')
    expect(mockUpdate).toHaveBeenCalledWith({ seen: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'insight-1')
    expect(mockLoggerError).not.toHaveBeenCalled()
  })

  it('logs and gives up quietly when the update fails', async () => {
    mockEq.mockResolvedValue({ error: { message: 'falha de rede' } })

    await expect(markInsightSeen('insight-1')).resolves.toBeUndefined()

    expect(mockLoggerError).toHaveBeenCalledWith('failed to mark insight as seen', {
      message: 'falha de rede',
    })
  })
})
