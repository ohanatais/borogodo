import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockComplete, mockInsertMirrorSnapshot } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockInsertMirrorSnapshot: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  getProvider: () => ({ complete: mockComplete }),
}))

vi.mock('@/lib/db/mirror', () => ({
  insertMirrorSnapshot: mockInsertMirrorSnapshot,
}))

import { generateAndSaveMirror } from '@/lib/ai/mirror/generateMirror'
import { NoEntriesError } from '@/lib/errors'

const VALID_MIRROR = {
  intro: 'Já consigo ver algumas coisas, Ana.',
  primary_strength: { headline: 'Síntese para stakeholders', evidence: 'Aparece em 4 entradas.' },
  invisible_skill: { headline: 'Estabiliza o time', evidence: 'Em 3 entradas você segurou a crise.' },
  context_pattern: { headline: 'Brilha em 0→1', evidence: 'Os relatos mais fortes são de quando faltava processo.' },
  closing: 'Isso ressoa com você?',
  strength_themes: ['decisão sob pressão', 'síntese para stakeholders', '0→1'],
}

const OWN_ENTRY = {
  what_i_did: 'Fechei a migração do banco no prazo',
  company: 'Acme',
  role_title: 'Engenheira',
  tags: ['migração'],
  impact: 'Reduziu downtime',
  metric: null,
}

const OTHER_USER_ENTRY = {
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

  it('lança erro sem persistir quando o Sonnet retorna JSON inválido', async () => {
    mockComplete.mockResolvedValue('não é json')
    const supabase = buildSupabase([OWN_ENTRY])

    await expect(generateAndSaveMirror(supabase as never, 'user-1')).rejects.toThrow()
    expect(mockInsertMirrorSnapshot).not.toHaveBeenCalled()
  })
})
