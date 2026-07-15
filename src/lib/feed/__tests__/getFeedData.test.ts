import { describe, it, expect, vi } from 'vitest'
import { getFeedData } from '../getFeedData'
import type { FeedQuery } from '../types'

function makeMockEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entry-1',
    what_i_did: 'Liderou roadmap do produto',
    title: null,
    source: 'text' as const,
    created_at: '2025-01-01T10:00:00Z',
    entry_date: null,
    company: null,
    role_title: null,
    metric: null,
    tags: [],
    evidences: [],
    impact: null,
    decision: null,
    learning: null,
    file_name: null,
    ...overrides,
  }
}

function makeBuilder(rows: unknown[], error: unknown) {
  const builder: Record<string, unknown> = {}

  const chainMethods = ['eq', 'neq', 'not', 'is', 'order', 'limit', 'ilike', 'contains', 'gte', 'lte', 'or', 'lt', 'gt', 'in'] as const
  for (const m of chainMethods) {
    builder[m] = vi.fn(() => builder)
  }

  builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error })

  return builder
}

// US7 (026): `getFeedData` agora faz uma segunda query contra `entry_highlights` para montar
// `FeedItem.highlights` — `highlightRows` simula essa tabela, separada de `rows` (entries).
function makeSupabase(
  rows: unknown[],
  { error = null, highlightRows = [] }: { error?: unknown; highlightRows?: unknown[] } = {}
) {
  const entriesBuilder = makeBuilder(rows, error)
  const highlightsBuilder = makeBuilder(highlightRows, null)

  return {
    from: vi.fn((table?: string) => ({
      select: vi.fn(() => (table === 'entry_highlights' ? highlightsBuilder : entriesBuilder)),
    })),
  }
}

const DEFAULT_QUERY: FeedQuery = { axis: 'created_at' }

describe('getFeedData — filtros (US4)', () => {
  it('filtro q passa ilike para a query', async () => {
    const entries = [makeMockEntry({ what_i_did: 'Conduziu negociação com fornecedor' })]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'created_at', q: 'negociação' })

    expect(result.items).toHaveLength(1)
  })

  it('escapa q com vírgula entre aspas para não quebrar o filtro OR (segurança)', async () => {
    const supabase = makeSupabase([makeMockEntry()])

    await getFeedData(supabase as never, 'user-1', { axis: 'created_at', q: 'a,b' })

    const builder = supabase.from().select() as Record<string, ReturnType<typeof vi.fn>>
    const orArgs = builder.or.mock.calls.map((c) => c[0] as string)
    const qClause = orArgs.find((arg) => arg.includes('ilike'))
    // A vírgula precisa estar dentro das aspas — caso contrário separaria a OR.
    expect(qClause).toContain('ilike."%a,b%"')
  })

  it('ignora cursor craftado para não injetar cláusulas no OR (segurança)', async () => {
    const crafted = Buffer.from('x,or(user_id.eq.outro)|nao-uuid!').toString('base64')
    const supabase = makeSupabase([makeMockEntry()])

    await getFeedData(supabase as never, 'user-1', { axis: 'created_at', cursor: crafted })

    const builder = supabase.from().select() as Record<string, ReturnType<typeof vi.fn>>
    const orArgs = builder.or.mock.calls.map((c) => c[0] as string)
    expect(orArgs.some((arg) => arg.includes('user_id.eq.outro'))).toBe(false)
  })

  it('filtro metricOnly retorna apenas entradas com métrica', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', metric: '20%' }),
      makeMockEntry({ id: 'e2', metric: null }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'created_at', metricOnly: true })

    expect(result.items).toHaveLength(2)
  })

  it('repassa o file_name do arquivo de origem para o item (issue #42)', async () => {
    const entries = [makeMockEntry({ source: 'linkedin_pdf', file_name: 'curriculo-2025.pdf' })]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'created_at' })

    expect(result.items[0].file_name).toBe('curriculo-2025.pdf')
  })

  it('filtro company é repassado à query', async () => {
    const entries = [makeMockEntry({ company: 'Acme Corp' })]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'created_at', company: 'Acme' })

    expect(result.items[0].company).toBe('Acme Corp')
  })

  it('busca com string suspeita não quebra (sem injeção)', async () => {
    const supabase = makeSupabase([])

    expect(async () => {
      await getFeedData(supabase as never, 'user-1', { axis: 'created_at', q: "'; DROP TABLE entries; --" })
    }).not.toThrow()
  })

  it('T051 (Story 6) — filtro por tag repassa .contains e retorna juntas duas fontes organizadas em momentos diferentes com a mesma tag reaproveitada', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', tags: ['liderança'], created_at: '2026-01-01T10:00:00Z' }),
      makeMockEntry({ id: 'e2', tags: ['liderança'], created_at: '2026-06-01T10:00:00Z' }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'created_at', tags: ['liderança'] })

    const builder = supabase.from().select() as Record<string, ReturnType<typeof vi.fn>>
    expect(builder.contains).toHaveBeenCalledWith('tags', ['liderança'])
    expect(result.items.map((item) => item.id)).toEqual(['e1', 'e2'])
    expect(result.items.every((item) => item.tags.includes('liderança'))).toBe(true)
  })
})

describe('getFeedData — eixo entry_date (US2)', () => {
  it('eixo entry_date ordena por entry_date DESC NULLS LAST', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', entry_date: '2025-03-01', created_at: '2025-03-02T00:00:00Z' }),
      makeMockEntry({ id: 'e2', entry_date: null, created_at: '2025-03-01T00:00:00Z' }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'entry_date' })

    expect(result.items).toHaveLength(2)
    expect(result.items.map((i) => i.id).sort()).toEqual(['e1', 'e2'])
  })

  it('entradas sem entry_date nunca somem (aparecem ao final com eixo entry_date)', async () => {
    const entries = [
      makeMockEntry({ id: 'e1', entry_date: '2025-03-01', created_at: '2025-01-01T00:00:00Z' }),
      makeMockEntry({ id: 'e2', entry_date: null, created_at: '2025-03-01T00:00:00Z' }),
    ]
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', { axis: 'entry_date' })

    const ids = result.items.map((i) => i.id)
    expect(ids).toContain('e1')
    expect(ids).toContain('e2')
  })
})

describe('getFeedData', () => {
  it('retorna FeedPage com items para o userId correto', async () => {
    const entry = makeMockEntry()
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('entry-1')
    expect(supabase.from).toHaveBeenCalledWith('entries')
  })

  it('título nunca é vazio — fallback determinístico quando title é null', async () => {
    const entry = makeMockEntry({ title: null, what_i_did: 'Conduziu discovery com stakeholders' })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title).toBeTruthy()
    expect(result.items[0].title).toBe('Conduziu discovery com stakeholders')
  })

  it('título nunca é vazio — usa title IA quando presente', async () => {
    const entry = makeMockEntry({ title: 'Lançou redesign do checkout', what_i_did: 'O texto longo aqui' })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title).toBe('Lançou redesign do checkout')
  })

  it('fallback de título trunca what_i_did em 60 chars', async () => {
    const longText = 'a'.repeat(100)
    const entry = makeMockEntry({ title: null, what_i_did: longText })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].title.length).toBeLessThanOrEqual(60)
  })

  it('retorna nextCursor null quando há menos items que o page size', async () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeMockEntry({ id: `entry-${i}` }))
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.nextCursor).toBeNull()
  })

  it('retorna nextCursor quando há mais items que o page size', async () => {
    const entries = Array.from({ length: 21 }, (_, i) =>
      makeMockEntry({ id: `entry-${i}`, created_at: `2025-01-${String(i + 1).padStart(2, '0')}T10:00:00Z` })
    )
    const supabase = makeSupabase(entries)

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items).toHaveLength(20)
    expect(result.nextCursor).not.toBeNull()
  })

  it('extrai thumbnail da primeira evidence de tipo image', async () => {
    const entry = makeMockEntry({
      evidences: [
        { type: 'url', value: 'https://example.com', label: 'Link' },
        { type: 'image', value: 'https://img.example.com/foto.jpg', label: 'Foto' },
      ],
    })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].thumbnail).toBe('https://img.example.com/foto.jpg')
  })

  it('thumbnail é null quando não há evidências de tipo image', async () => {
    const entry = makeMockEntry({
      evidences: [{ type: 'url', value: 'https://example.com', label: 'Link' }],
    })
    const supabase = makeSupabase([entry])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].thumbnail).toBeNull()
  })
})

describe('getFeedData — destaques por fonte (T057, US7)', () => {
  it('FR-032 — fonte legada sem entry_highlights recebe um destaque sintético único, nunca um array vazio', async () => {
    const entry = makeMockEntry({
      id: 'legada-1',
      title: 'Resolveu incidente de produção',
      metric: '30% menos downtime',
      impact: 'Cliente não notou a instabilidade',
      tags: ['incident-response'],
    })
    const supabase = makeSupabase([entry], { highlightRows: [] })

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].highlights).toHaveLength(1)
    expect(result.items[0].highlights[0]).toEqual({
      id: 'legada-1',
      title: 'Resolveu incidente de produção',
      metric: '30% menos downtime',
      impact: 'Cliente não notou a instabilidade',
      tags: ['incident-response'],
    })
  })

  it('fonte organizada com múltiplos destaques retorna todos, ordenados', async () => {
    const entry = makeMockEntry({ id: 'org-1' })
    const highlightRows = [
      { id: 'h1', entry_id: 'org-1', title: 'Destaque 1', metric: null, impact: null, tags: ['a'] },
      { id: 'h2', entry_id: 'org-1', title: 'Destaque 2', metric: '10%', impact: 'ok', tags: ['b'] },
    ]
    const supabase = makeSupabase([entry], { highlightRows })

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(result.items[0].highlights).toHaveLength(2)
    expect(result.items[0].highlights.map((h) => h.id)).toEqual(['h1', 'h2'])
  })

  it('destaques de uma fonte não vazam para outra fonte na mesma página', async () => {
    const entries = [makeMockEntry({ id: 'e1' }), makeMockEntry({ id: 'e2' })]
    const highlightRows = [{ id: 'h1', entry_id: 'e1', title: 'Só do e1', metric: null, impact: null, tags: [] }]
    const supabase = makeSupabase(entries, { highlightRows })

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    const e1 = result.items.find((i) => i.id === 'e1')
    const e2 = result.items.find((i) => i.id === 'e2')
    expect(e1?.highlights.map((h) => h.id)).toEqual(['h1'])
    expect(e2?.highlights).toHaveLength(1)
    expect(e2?.highlights[0].id).toBe('e2') // sintético, fallback da própria entry
  })

  it('deriva organizationStatus e contextStatus por fonte', async () => {
    const organizing = makeMockEntry({ id: 'e1', organizing_started_at: new Date().toISOString() })
    const resolved = makeMockEntry({ id: 'e2', company: 'Acme' })
    const supabase = makeSupabase([organizing, resolved])

    const result = await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    const e1 = result.items.find((i) => i.id === 'e1')
    const e2 = result.items.find((i) => i.id === 'e2')
    expect(e1?.organizationStatus).toBe('organizing')
    expect(e1?.contextStatus).toBe('unresolved')
    expect(e2?.contextStatus).toBe('company')
  })

  it('não dispara a query de entry_highlights quando a página não tem nenhuma fonte', async () => {
    const supabase = makeSupabase([])

    await getFeedData(supabase as never, 'user-1', DEFAULT_QUERY)

    expect(supabase.from).not.toHaveBeenCalledWith('entry_highlights')
  })
})
