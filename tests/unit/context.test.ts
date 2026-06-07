import { describe, it, expect, vi } from 'vitest'
import { buildCaptureContext } from '@/lib/ai/extraction/context'

function buildSupabaseMock(options: {
  mirror?: { strength_themes: string[] } | null
  recentEntries?: { what_i_did: string }[]
  entryCount?: number
}) {
  const { mirror = null, recentEntries = [], entryCount = 0 } = options

  return {
    from: vi.fn((table: string) => {
      if (table === 'mirror_snapshots') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({ data: mirror, error: null })),
                })),
              })),
            })),
          })),
        }
      }

      if (table === 'entries') {
        return {
          select: vi.fn((_column?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: vi.fn(async () => ({ count: entryCount, error: null })),
              }
            }

            return {
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({ data: recentEntries, error: null })),
                })),
              })),
            }
          }),
        }
      }

      throw new Error(`unexpected table: ${table}`)
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('buildCaptureContext', () => {
  it('retorna strengthThemes vazio quando não há mirror_snapshot (tolerante — feature 004 ainda não existe)', async () => {
    const supabase = buildSupabaseMock({ mirror: null })

    const context = await buildCaptureContext(supabase, 'user-1')

    expect(context.strengthThemes).toEqual([])
  })

  it('lê strengthThemes do mirror mais recente quando existe (até 6)', async () => {
    const supabase = buildSupabaseMock({
      mirror: { strength_themes: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
    })

    const context = await buildCaptureContext(supabase, 'user-1')

    expect(context.strengthThemes).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  it('retorna até 5 resumos recentes e a contagem total', async () => {
    const supabase = buildSupabaseMock({
      recentEntries: [{ what_i_did: 'A' }, { what_i_did: 'B' }],
      entryCount: 12,
    })

    const context = await buildCaptureContext(supabase, 'user-1')

    expect(context.recentSummaries).toEqual(['A', 'B'])
    expect(context.entryCount).toBe(12)
  })

  it('é tolerante a erro de consulta (retorna contexto mínimo)', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: null, error: new Error('boom') })),
              })),
            })),
            // for the count query (head: true) path
          })),
        })),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const context = await buildCaptureContext(supabase, 'user-1')

    expect(context.strengthThemes).toEqual([])
    expect(context.recentSummaries).toEqual([])
    expect(context.entryCount).toBe(0)
  })
})
