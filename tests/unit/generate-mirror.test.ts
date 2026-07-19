import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockComplete, mockInsertMirrorSnapshot } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockInsertMirrorSnapshot: vi.fn(),
}))

// 023: generateMirror passa pelo guard (`client.complete`). Mockamos ele direto.
vi.mock('@/lib/ai/client', () => ({
  complete: mockComplete,
}))

vi.mock('@/lib/db/mirror', () => ({
  insertMirrorSnapshot: mockInsertMirrorSnapshot,
}))

import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { NoEntriesError } from '@/lib/errors'

const ev = (text: string) => ({ text, entry_ids: [] })

const VALID_MIRROR = {
  intro: 'Já consigo ver algumas coisas, Ana.',
  primary_strength: { headline: 'Síntese para stakeholders', evidence: ev('Aparece em 4 entradas.') },
  invisible_skill: { headline: 'Estabiliza o time', evidence: ev('Em 3 entradas você segurou a crise.') },
  context_pattern: { headline: 'Brilha em 0→1', evidence: ev('Os relatos mais fortes são de quando faltava processo.') },
  closing: 'Isso ressoa com você?',
  strength_themes: ['decisão sob pressão', 'síntese para stakeholders', '0→1'],
}

const OWN_ENTRY = {
  id: 'entry-unit-1',
  what_i_did: 'Fechei a migração do banco no prazo',
  company: 'Acme',
  role_title: 'Engenheira',
  tags: ['migração'],
  impact: 'Reduziu downtime',
  metric: null,
  entry_highlights: [
    { title: 'Migração concluída no prazo', metric: null, impact: 'Reduziu downtime', tags: ['migração'] },
  ],
}

const OTHER_USER_ENTRY = {
  id: 'entry-unit-other',
  what_i_did: 'Liderou o lançamento de um produto concorrente',
  company: 'OutraCo',
  role_title: 'PM',
  tags: ['lançamento'],
  impact: null,
  metric: null,
}

interface SupabaseOptions {
  entriesError?: { message: string }
  profileName?: string | null
}

function buildSupabase(entriesForUser: Record<string, unknown>[], options: SupabaseOptions = {}) {
  const { entriesError = null, profileName = 'Ana Lima' } = options

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn((column: string, value: string) => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => {
              if (table === 'entries') {
                expect(column).toBe('user_id')
                if (entriesError) {
                  return { data: null, error: entriesError }
                }
                return { data: value === 'user-1' ? entriesForUser : [OTHER_USER_ENTRY], error: null }
              }

              return { data: [], error: null }
            }),
          })),
          maybeSingle: vi.fn(async () => ({ data: { name: profileName }, error: null })),
        })),
      })),
    })),
  }
}

describe('generateAndSaveMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockComplete.mockResolvedValue('```json\n' + JSON.stringify(VALID_MIRROR) + '\n```')
    mockInsertMirrorSnapshot.mockResolvedValue({ id: 'snap-1', mirror: VALID_MIRROR })
  })

  it('monta o contexto do Sonnet só com entradas do próprio usuário', async () => {
    const supabase = buildSupabase([OWN_ENTRY])

    await generateAndSaveMirror(supabase as never, 'user-1')

    const userPrompt = mockComplete.mock.calls[0]?.[0]?.user as string
    expect(userPrompt).toContain(OWN_ENTRY.what_i_did)
    expect(userPrompt).not.toContain(OTHER_USER_ENTRY.what_i_did)
  })

  it('inclui os destaques organizados como índice da fonte no contexto do espelho', async () => {
    const supabase = buildSupabase([OWN_ENTRY])

    await generateAndSaveMirror(supabase as never, 'user-1')

    const userPrompt = mockComplete.mock.calls[0]?.[0]?.user as string
    expect(userPrompt).toContain('Destaques: Migração concluída no prazo')
  })

  it('valida e persiste o espelho gerado, com entry_count correto', async () => {
    const supabase = buildSupabase([OWN_ENTRY, OWN_ENTRY])

    await generateAndSaveMirror(supabase as never, 'user-1')

    expect(mockInsertMirrorSnapshot).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({ userId: 'user-1', entryCount: 2 })
    )
  })

  it('lança NoEntriesError sem persistir quando o usuário não tem entradas', async () => {
    const supabase = buildSupabase([])

    await expect(generateAndSaveMirror(supabase as never, 'user-1')).rejects.toThrow(NoEntriesError)
    expect(mockInsertMirrorSnapshot).not.toHaveBeenCalled()
  })

  it('distingue erro de DB de "sem entradas" (não lança NoEntriesError em falha de query)', async () => {
    const supabase = buildSupabase([], { entriesError: { message: 'connection reset' } })

    await expect(generateAndSaveMirror(supabase as never, 'user-1')).rejects.toThrow(
      'Não foi possível carregar as entradas'
    )
    expect(mockInsertMirrorSnapshot).not.toHaveBeenCalled()
  })

  it('usa o fallback "você" quando o nome do perfil é vazio', async () => {
    const supabase = buildSupabase([OWN_ENTRY], { profileName: '' })

    await generateAndSaveMirror(supabase as never, 'user-1')

    const userPrompt = mockComplete.mock.calls[0]?.[0]?.user as string
    expect(userPrompt).toContain('Pessoa: você')
  })

  it('resolve rótulos E1, E2 para UUIDs reais antes de persistir', async () => {
    const mirrorWithLabels = {
      ...VALID_MIRROR,
      primary_strength: {
        headline: 'Síntese para stakeholders',
        evidence: { text: 'Aparece em entradas.', entry_ids: ['E1'] },
      },
    }
    mockComplete.mockResolvedValueOnce('```json\n' + JSON.stringify(mirrorWithLabels) + '\n```')

    const supabase = buildSupabase([OWN_ENTRY])
    await generateAndSaveMirror(supabase as never, 'user-1')

    const persistedMirror = mockInsertMirrorSnapshot.mock.calls[0]?.[1]?.mirror
    expect(persistedMirror.primary_strength.evidence.entry_ids).toEqual([OWN_ENTRY.id])
  })

  it('descarta rótulos sem match no mapa (não vaza labels brutos)', async () => {
    const mirrorWithUnknownLabel = {
      ...VALID_MIRROR,
      primary_strength: {
        headline: 'Síntese',
        evidence: { text: 'Evidência.', entry_ids: ['E99'] },
      },
    }
    mockComplete.mockResolvedValueOnce('```json\n' + JSON.stringify(mirrorWithUnknownLabel) + '\n```')

    const supabase = buildSupabase([OWN_ENTRY])
    await generateAndSaveMirror(supabase as never, 'user-1')

    const persistedMirror = mockInsertMirrorSnapshot.mock.calls[0]?.[1]?.mirror
    expect(persistedMirror.primary_strength.evidence.entry_ids).toEqual([])
  })

  it('lança erro sem persistir quando o Sonnet retorna JSON inválido', async () => {
    mockComplete.mockResolvedValue('não é json')
    const supabase = buildSupabase([OWN_ENTRY])

    await expect(generateAndSaveMirror(supabase as never, 'user-1')).rejects.toThrow()
    expect(mockInsertMirrorSnapshot).not.toHaveBeenCalled()
  })
})
