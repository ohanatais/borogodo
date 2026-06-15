import { describe, it, expect, vi } from 'vitest'
import { loadSeedEvidence } from '../loadSeed'
import { buildProjectSeedRef } from '@/lib/content/projectSeed'

vi.mock('@/lib/db/mirror', () => ({ getLatestSnapshot: vi.fn() }))

interface Row {
  id: string
  what_i_did: string
  company: string | null
  role_title: string | null
  impact: string | null
  metric: string | null
}

function makeSupabase(rows: Row[]) {
  const calls: { eq: unknown[][] } = { eq: [] }
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn((...args: unknown[]) => {
    calls.eq.push(args)
    return builder
  })
  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null })
  return { supabase: { from: vi.fn(() => builder) }, calls }
}

describe('loadSeedEvidence — project (US3)', () => {
  it('agrega só as entradas da empresa+projeto e devolve evidência rotulada', async () => {
    const rows: Row[] = [
      { id: '1', what_i_did: 'Liderou o lançamento', company: 'Acme', role_title: 'PM', impact: '+30% adoção', metric: null },
      { id: '2', what_i_did: 'Fechou parceria', company: 'Acme', role_title: 'PM', impact: null, metric: 'R$ 1M' },
    ]
    const { supabase, calls } = makeSupabase(rows)

    const seed = await loadSeedEvidence(supabase as never, 'user-1', 'project', buildProjectSeedRef('Acme', 'Lançamento'))

    expect(seed).not.toBeNull()
    expect(seed!.seedSummary).toBe('Lançamento')
    expect(seed!.evidence).toHaveLength(2)
    // Escopo de isolamento (FR-012): user_id E company E project_name.
    expect(calls.eq).toEqual(
      expect.arrayContaining([
        ['user_id', 'user-1'],
        ['company', 'Acme'],
        ['project_name', 'Lançamento'],
      ])
    )
  })

  it('1 entrada se comporta como o seed de entrada (mesma evidência, mesmo motor)', async () => {
    const rows: Row[] = [
      { id: '1', what_i_did: 'Construiu sozinha', company: 'Acme', role_title: 'Founder', impact: null, metric: null },
    ]
    const { supabase } = makeSupabase(rows)

    const seed = await loadSeedEvidence(supabase as never, 'user-1', 'project', buildProjectSeedRef('Acme', 'Solo'))

    expect(seed!.evidence).toHaveLength(1)
  })

  it('devolve null quando o projeto não tem entradas (ou não é do usuário)', async () => {
    const { supabase } = makeSupabase([])
    const seed = await loadSeedEvidence(supabase as never, 'user-1', 'project', buildProjectSeedRef('Acme', 'Vazio'))
    expect(seed).toBeNull()
  })

  it('devolve null para seedRef de projeto malformado (não consulta o banco)', async () => {
    const { supabase } = makeSupabase([])
    const seed = await loadSeedEvidence(supabase as never, 'user-1', 'project', 'sem-separador')
    expect(seed).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
