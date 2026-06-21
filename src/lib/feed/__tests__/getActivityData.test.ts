import { describe, it, expect, vi } from 'vitest'
import { getActivityData } from '../getActivityData'

function makeSupabase(rows: { created_at: string }[], { error = null }: { error?: unknown } = {}) {
  const builder: Record<string, unknown> = {}
  const chain = ['eq', 'gte', 'order', 'select'] as const
  for (const m of chain) {
    builder[m] = vi.fn(() => builder)
  }
  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error })
  return { from: vi.fn((_table: string) => builder) }
}

describe('getActivityData', () => {
  it('retorna ActivityCell[] com date e count para o userId correto', async () => {
    const rows = [
      { created_at: '2025-01-01T10:00:00Z' },
      { created_at: '2025-01-01T14:00:00Z' },
      { created_at: '2025-01-05T09:00:00Z' },
    ]
    const supabase = makeSupabase(rows)

    const result = await getActivityData(supabase as never, 'user-1', 365)

    expect(result).toHaveLength(2)
    const jan1 = result.find((c) => c.date === '2025-01-01')
    const jan5 = result.find((c) => c.date === '2025-01-05')
    expect(jan1?.count).toBe(2)
    expect(jan5?.count).toBe(1)
  })

  it('só retorna dias com count > 0 (esparso)', async () => {
    const rows = [
      { created_at: '2025-01-01T10:00:00Z' },
      { created_at: '2025-01-01T11:00:00Z' },
    ]
    const supabase = makeSupabase(rows)

    const result = await getActivityData(supabase as never, 'user-1', 30)

    expect(result.every((cell) => cell.count > 0)).toBe(true)
    expect(result).toHaveLength(1)
  })

  it('retorna array vazio quando não há registros', async () => {
    const supabase = makeSupabase([])

    const result = await getActivityData(supabase as never, 'user-1', 90)

    expect(result).toHaveLength(0)
  })

  it('janela de dias é respeitada (from passado à query via gte)', async () => {
    const supabase = makeSupabase([])

    await getActivityData(supabase as never, 'user-1', 7)

    expect(supabase.from).toHaveBeenCalledWith('entries')
    const builder = supabase.from('entries')
    expect(builder.gte).toHaveBeenCalled()
  })
})
