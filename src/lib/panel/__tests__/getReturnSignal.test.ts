import { describe, it, expect } from 'vitest'
import { getReturnSignal } from '../getReturnSignal'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

const BASE_ENTRY = {
  id: 'e1',
  what_i_did: 'Entrega de feature',
  entry_date: '2025-01-10',
  created_at: daysAgo(0),
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getReturnSignal', () => {
  it('returns welcome when there are no entries (empty database)', () => {
    const result = getReturnSignal({
      entries: [],
      lastPanelSeenAt: null,
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('welcome')
  })

  it('returns has-new when there is at least one entry newer than last visit', () => {
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(0) }],
      lastPanelSeenAt: daysAgo(1),
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('has-new')
  })

  it('includes strength-aha only when mirror regenerated since last visit', () => {
    const lastSeen = daysAgo(3)
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(1) }],
      lastPanelSeenAt: lastSeen,
      latestMirrorGeneratedAt: daysAgo(2),
      lastMirrorSeenAt: lastSeen,
    })
    expect(result.type).toBe('has-new')
    expect(result.strengthAha).toBe(true)
  })

  it('does NOT include strength-aha when mirror has not regenerated since last visit', () => {
    const lastSeen = daysAgo(1)
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(0) }],
      lastPanelSeenAt: lastSeen,
      latestMirrorGeneratedAt: daysAgo(5),
      lastMirrorSeenAt: lastSeen,
    })
    expect(result.type).toBe('has-new')
    expect(result.strengthAha).toBe(false)
  })

  it('returns old-victory when no entries are newer than last visit', () => {
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(10) }],
      lastPanelSeenAt: daysAgo(5),
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('old-victory')
    expect(result.entry).toBeDefined()
  })

  it('never fabricates an analysis in old-victory branch', () => {
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(20) }],
      lastPanelSeenAt: daysAgo(5),
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('old-victory')
    expect(result.strengthAha).toBe(false)
  })

  it('returns has-new when last-panel-seen is null but entries exist', () => {
    const result = getReturnSignal({
      entries: [{ ...BASE_ENTRY, created_at: daysAgo(0) }],
      lastPanelSeenAt: null,
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('has-new')
  })

  it('in old-victory, picks the oldest entry to surface (anniversary feel)', () => {
    const entries = [
      { ...BASE_ENTRY, id: 'e1', created_at: daysAgo(20) },
      { ...BASE_ENTRY, id: 'e2', created_at: daysAgo(30) },
    ]
    const result = getReturnSignal({
      entries,
      lastPanelSeenAt: daysAgo(10),
      latestMirrorGeneratedAt: null,
      lastMirrorSeenAt: null,
    })
    expect(result.type).toBe('old-victory')
    expect(result.entry?.id).toBe('e2')
  })
})
