import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEnrichmentNudge } from '../getEnrichmentNudge'
import type { ProactiveInsight } from '@/types/insight'

// ─── Mock ─────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/supabaseAdmin', () => ({
  getSupabaseAdmin: vi.fn(() => ({})),
}))

vi.mock('@/lib/db/insights', () => ({
  insertProactiveInsight: vi.fn(),
  countUnseenInsights: vi.fn(),
}))

import { insertProactiveInsight, countUnseenInsights } from '@/lib/db/insights'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEAN_ENTRY = {
  id: 'e1',
  what_i_did: 'Entreguei a feature',
  metric: null,
  impact: null,
}

const FAT_ENTRY = {
  id: 'e2',
  what_i_did: 'Reduzi o churn em 20%',
  metric: '20% de redução',
  impact: 'Reteve 40 clientes',
}

function makeInsight(entryId: string): ProactiveInsight {
  return {
    id: 'i1',
    user_id: 'u1',
    type: 'enrichment_nudge',
    headline: 'Pergunta cirúrgica',
    body: 'Teve algum número ou prazo nisso?',
    entry_ids: [entryId],
    seen: false,
    generated_at: new Date().toISOString(),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getEnrichmentNudge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(insertProactiveInsight).mockResolvedValue(makeInsight('e1'))
    vi.mocked(countUnseenInsights).mockResolvedValue(0)
  })

  it('generates ONE enrichment_nudge for a lean entry (no metric/impact)', async () => {
    const result = await getEnrichmentNudge('u1', [LEAN_ENTRY], [])
    expect(result).not.toBeNull()
    expect(insertProactiveInsight).toHaveBeenCalledOnce()
    expect(vi.mocked(insertProactiveInsight).mock.calls[0]?.[1]?.type).toBe('enrichment_nudge')
    expect(vi.mocked(insertProactiveInsight).mock.calls[0]?.[1]?.entryIds).toEqual(['e1'])
  })

  it('does NOT generate a nudge when the entry is fat (has metric or impact)', async () => {
    const result = await getEnrichmentNudge('u1', [FAT_ENTRY], [])
    expect(result).toBeNull()
    expect(insertProactiveInsight).not.toHaveBeenCalled()
  })

  it('does NOT generate a nudge when the lean entry already has an existing nudge', async () => {
    const existingNudge = makeInsight('e1')
    const result = await getEnrichmentNudge('u1', [LEAN_ENTRY], [existingNudge])
    expect(result).toBeNull()
    expect(insertProactiveInsight).not.toHaveBeenCalled()
  })

  it('does NOT generate a nudge when there is already an unseen enrichment_nudge', async () => {
    vi.mocked(countUnseenInsights).mockResolvedValue(1)
    const result = await getEnrichmentNudge('u1', [LEAN_ENTRY], [])
    expect(result).toBeNull()
    expect(insertProactiveInsight).not.toHaveBeenCalled()
  })

  it('does nothing and returns null when all entries are fat', async () => {
    const result = await getEnrichmentNudge('u1', [FAT_ENTRY, FAT_ENTRY], [])
    expect(result).toBeNull()
    expect(insertProactiveInsight).not.toHaveBeenCalled()
  })
})
