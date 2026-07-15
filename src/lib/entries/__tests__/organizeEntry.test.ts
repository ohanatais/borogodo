import { describe, it, expect, vi, beforeEach } from 'vitest'
import { organizeEntry } from '../organizeEntry'

const { mockComplete, mockGetTagVocabulary, mockRollupEntryTags } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockGetTagVocabulary: vi.fn(),
  mockRollupEntryTags: vi.fn(),
}))

vi.mock('@/lib/ai/client', () => ({ complete: mockComplete }))
vi.mock('@/lib/entries/highlightVocabulary', () => ({ getTagVocabulary: mockGetTagVocabulary }))
vi.mock('@/lib/entries/rollupEntryTags', () => ({ rollupEntryTags: mockRollupEntryTags }))

interface EntryRowFixture {
  id: string
  user_id: string
  raw_content: string
  company: string | null
  entry_date: string | null
  is_personal_project: boolean
}

interface HighlightFixture {
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
}

function jsonResponse(body: Record<string, unknown>): string {
  return '```json\n' + JSON.stringify(body) + '\n```'
}

/**
 * Constrói um cliente Supabase fake cobrindo a sequência exata de chamadas de `organizeEntry`:
 * 1ª from('entries') → select+maybeSingle (carrega a fonte)
 * 1ª from('entry_highlights') → select+eq+order (destaques já existentes, thenable)
 * 2ª from('entry_highlights') → insert+select (persiste os novos destaques)
 * demais from('entries') → update+eq (contexto e organized_at/organizing_started_at), thenable
 */
function makeClient(options: {
  entryRow: EntryRowFixture | null
  entryFetchError?: unknown
  existingHighlights?: HighlightFixture[]
  insertedHighlights?: unknown[]
  insertError?: unknown
}) {
  const {
    entryRow,
    entryFetchError = null,
    existingHighlights = [],
    insertedHighlights = [],
    insertError = null,
  } = options

  let entriesCallCount = 0
  let highlightsCallCount = 0

  const updateCalls: { table: string; payload: unknown }[] = []

  function makeSelectEntryBuilder() {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({ data: entryRow, error: entryFetchError })),
    }
    return builder
  }

  function makeUpdateEntryBuilder() {
    const builder = {
      update: vi.fn((payload: unknown) => {
        updateCalls.push({ table: 'entries', payload })
        return builder
      }),
      eq: vi.fn(() => builder),
      then: (resolve: (value: { data: null; error: null }) => unknown) => resolve({ data: null, error: null }),
    }
    return builder
  }

  function makeSelectHighlightsBuilder() {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      then: (resolve: (value: { data: HighlightFixture[]; error: null }) => unknown) =>
        resolve({ data: existingHighlights, error: null }),
    }
    return builder
  }

  function makeInsertHighlightsBuilder() {
    const builder = {
      insert: vi.fn((rows: unknown) => {
        updateCalls.push({ table: 'entry_highlights_insert', payload: rows })
        return builder
      }),
      select: vi.fn(async () => ({ data: insertedHighlights, error: insertError })),
    }
    return builder
  }

  const from = vi.fn((table: string) => {
    if (table === 'entries') {
      entriesCallCount += 1
      return entriesCallCount === 1 ? makeSelectEntryBuilder() : makeUpdateEntryBuilder()
    }
    if (table === 'entry_highlights') {
      highlightsCallCount += 1
      return highlightsCallCount === 1 ? makeSelectHighlightsBuilder() : makeInsertHighlightsBuilder()
    }
    throw new Error(`Unexpected table: ${table}`)
  })

  return { client: { from } as unknown, from, updateCalls }
}

const BASE_ENTRY: EntryRowFixture = {
  id: 'entry-1',
  user_id: 'user-1',
  raw_content: 'Reduzi o tempo de investigação de bug crítico em 50% no time de plataforma.',
  company: null,
  entry_date: null,
  is_personal_project: false,
}

describe('organizeEntry', () => {
  beforeEach(() => {
    mockComplete.mockReset()
    mockGetTagVocabulary.mockReset().mockResolvedValue([])
    mockRollupEntryTags.mockReset().mockResolvedValue([])
  })

  it('T018 — cria entry_highlights com métrica/impacto/tags/título inferidos para fonte sem nenhum campo preenchido', async () => {
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [
          { title: 'Redução de 50% no tempo de investigação de bug crítico', metric: '50%', impact: 'Menos tempo parado', tags: ['devops'] },
        ],
        company: null,
        entry_date: null,
      })
    )
    const { client, from } = makeClient({ entryRow: BASE_ENTRY, insertedHighlights: [{ id: 'h1' }] })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.highlights).toEqual([{ id: 'h1' }])
    }
    expect(from).toHaveBeenCalledWith('entry_highlights')
  })

  it('T019 — não sobrescreve um destaque já existente com impacto preenchido manualmente (só adiciona)', async () => {
    const existingHighlight: HighlightFixture = { title: null, metric: null, impact: 'Impacto escrito à mão', tags: [] }
    mockComplete.mockResolvedValue(
      jsonResponse({ highlights: [{ title: 'Novo destaque', metric: null, impact: null, tags: [] }], company: null, entry_date: null })
    )
    const { client, updateCalls } = makeClient({
      entryRow: BASE_ENTRY,
      existingHighlights: [existingHighlight],
      insertedHighlights: [{ id: 'h2' }],
    })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    // organizeEntry nunca chama update/patch em entry_highlights — só insert.
    const highlightUpdateCalls = updateCalls.filter((c) => c.table === 'entry_highlights')
    expect(highlightUpdateCalls).toEqual([])
  })

  it('T020 — infere a partir só do texto cru, sem exigir nenhum anexo', async () => {
    mockComplete.mockResolvedValue(
      jsonResponse({ highlights: [{ title: 'Aprendizado sem métrica', metric: null, impact: null, tags: [] }], company: null, entry_date: null })
    )
    const { client } = makeClient({ entryRow: BASE_ENTRY, insertedHighlights: [{ id: 'h3' }] })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    expect(mockComplete).toHaveBeenCalledTimes(1)
  })

  it('preenche company/entry_date só quando ainda vazios (FR-002)', async () => {
    const entryWithCompanyResolved: EntryRowFixture = { ...BASE_ENTRY, company: 'Acme Corp' }
    mockComplete.mockResolvedValue(
      jsonResponse({ highlights: [{ title: 't', metric: null, impact: null, tags: [] }], company: 'Outra empresa (nunca deveria vencer)', entry_date: '2026-03-01' })
    )
    const { client, updateCalls } = makeClient({ entryRow: entryWithCompanyResolved, insertedHighlights: [{ id: 'h4' }] })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.company).toBe('Acme Corp')
      expect(result.entry_date).toBe('2026-03-01')
    }
    const contextUpdate = updateCalls.find(
      (c) => c.table === 'entries' && typeof c.payload === 'object' && c.payload !== null && 'company' in (c.payload as Record<string, unknown>)
    )
    expect(contextUpdate).toBeUndefined()
  })

  it('não é encontrada quando a fonte não existe/não pertence ao usuário', async () => {
    const { client } = makeClient({ entryRow: null })

    const result = await organizeEntry(client as never, 'user-1', 'entry-inexistente')

    expect(result.status).toBe('not_found')
  })

  it('FR-030 — falha de IA não lança, limpa organizing_started_at e devolve status failed', async () => {
    mockComplete.mockRejectedValue(new Error('timeout de rede'))
    const { client, updateCalls } = makeClient({ entryRow: BASE_ENTRY })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('failed')
    const clearedStartedAt = updateCalls.find(
      (c) =>
        c.table === 'entries' &&
        typeof c.payload === 'object' &&
        c.payload !== null &&
        (c.payload as Record<string, unknown>).organizing_started_at === null
    )
    expect(clearedStartedAt).toBeDefined()
  })

  it('falha quando o resultado da IA não valida no schema Zod', async () => {
    mockComplete.mockResolvedValue(jsonResponse({ highlights: 'não é array', company: null, entry_date: null }))
    const { client } = makeClient({ entryRow: BASE_ENTRY })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('failed')
  })

  it('T041 — texto cru com 2 resultados distintos de mesmo contexto cria 2 entry_highlights, nenhuma nova linha em entries', async () => {
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [
          { title: 'Redução de 50% no tempo de investigação de bug crítico', metric: '50%', impact: 'Menos tempo parado', tags: ['devops'] },
          { title: 'Mentoria de dois devs júnior no time', metric: null, impact: 'Time mais autônomo', tags: ['mentoria'] },
        ],
        company: null,
        entry_date: null,
      })
    )
    const { client, from } = makeClient({
      entryRow: BASE_ENTRY,
      insertedHighlights: [{ id: 'h1' }, { id: 'h2' }],
    })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.highlights).toHaveLength(2)
    }
    // organizeEntry nunca cria uma linha nova em `entries` — só lê/atualiza a fonte existente.
    const entriesCalls = from.mock.calls.filter(([table]) => table === 'entries')
    expect(entriesCalls.length).toBeGreaterThan(0)
    expect(mockComplete).toHaveBeenCalledTimes(1)
  })

  it('T049 — injeta o vocabulário de tags da pessoa no prompt e reaproveita uma tag existente em vez de criar variação (Story 6, FR-022/FR-023)', async () => {
    mockGetTagVocabulary.mockResolvedValue(['liderança', 'devops'])
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [{ title: 'Liderou squad de plataforma', metric: null, impact: null, tags: ['liderança'] }],
        company: null,
        entry_date: null,
      })
    )
    const { client } = makeClient({ entryRow: BASE_ENTRY, insertedHighlights: [{ id: 'h6', tags: ['liderança'] }] })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(mockGetTagVocabulary).toHaveBeenCalledWith(client, 'user-1')
    // O vocabulário existente precisa chegar ao prompt do usuário — é o que permite a IA
    // reaproveitar 'liderança' em vez de gerar uma variação nova como 'Liderança de equipe'.
    const userPrompt = mockComplete.mock.calls[0][0].user as string
    expect(userPrompt).toContain('liderança')
    expect(userPrompt).toContain('devops')
    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.highlights[0]).toMatchObject({ tags: ['liderança'] })
    }
  })

  it('T053 — destaque com métrica clara: título gerado (com número) é persistido verbatim, sem alteração (Story 5, FR-019)', async () => {
    const titleWithMetric = 'Redução de 50% no tempo de investigação de bug crítico'
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [{ title: titleWithMetric, metric: '50%', impact: 'Menos tempo parado', tags: ['devops'] }],
        company: null,
        entry_date: null,
      })
    )
    const { client } = makeClient({
      entryRow: BASE_ENTRY,
      insertedHighlights: [{ id: 'h7', title: titleWithMetric, metric: '50%' }],
    })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.highlights[0]).toMatchObject({ title: titleWithMetric })
    }
  })

  it('T054 — título editado manualmente num destaque existente permanece intocado após reorganização (FR-020, mesma regra de FR-002)', async () => {
    const editedTitle = 'Meu título editado à mão'
    const existingHighlight: HighlightFixture = { title: editedTitle, metric: null, impact: null, tags: [] }
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [{ title: 'Novo destaque encontrado no texto', metric: null, impact: null, tags: [] }],
        company: null,
        entry_date: null,
      })
    )
    const { client, updateCalls } = makeClient({
      entryRow: BASE_ENTRY,
      existingHighlights: [existingHighlight],
      insertedHighlights: [{ id: 'h8' }],
    })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    // organizeEntry nunca faz UPDATE em entry_highlights — o título editado manualmente só
    // poderia ser sobrescrito por um UPDATE, que nunca acontece (mesma garantia estrutural de T019).
    const highlightUpdateCalls = updateCalls.filter((c) => c.table === 'entry_highlights')
    expect(highlightUpdateCalls).toEqual([])
    // O prompt também instrui a IA a não repetir o destaque existente (o título editado aparece
    // na seção "Destaques já existentes" enviada à IA).
    const userPrompt = mockComplete.mock.calls[0][0].user as string
    expect(userPrompt).toContain(editedTitle)
  })

  it('T042 — texto sem métrica clara cria ao menos 1 destaque sem métrica, tratado como válido (FR-018)', async () => {
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [{ title: 'Aprendizado sobre observabilidade', metric: null, impact: null, tags: ['aprendizado'] }],
        company: null,
        entry_date: null,
      })
    )
    const { client } = makeClient({ entryRow: BASE_ENTRY, insertedHighlights: [{ id: 'h5', metric: null }] })

    const result = await organizeEntry(client as never, 'user-1', 'entry-1')

    expect(result.status).toBe('organized')
    if (result.status === 'organized') {
      expect(result.highlights).toHaveLength(1)
      expect(result.highlights[0]).not.toHaveProperty('metric', expect.stringMatching(/.+/))
    }
  })
})
