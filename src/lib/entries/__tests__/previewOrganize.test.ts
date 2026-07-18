import { describe, it, expect, vi, beforeEach } from 'vitest'
import { previewOrganize } from '../previewOrganize'

const { mockComplete, mockGetTagVocabulary } = vi.hoisted(() => ({
  mockComplete: vi.fn(),
  mockGetTagVocabulary: vi.fn(),
}))

vi.mock('@/lib/ai/client', () => ({ complete: mockComplete }))
vi.mock('@/lib/entries/highlightVocabulary', () => ({ getTagVocabulary: mockGetTagVocabulary }))

function jsonResponse(body: Record<string, unknown>): string {
  return '```json\n' + JSON.stringify(body) + '\n```'
}

describe('previewOrganize — "Organizar" no Drawer, antes de salvar (sem entry existente)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTagVocabulary.mockResolvedValue([])
  })

  it('devolve highlights/company/entry_date extraídos, sem persistir nada (não recebe supabase pra escrever)', async () => {
    mockComplete.mockResolvedValue(
      jsonResponse({
        highlights: [{ title: 'Aceite do módulo em 2 ciclos', metric: 'Aceite em 2 ciclos', impact: 'Reduziu retrabalho', tags: ['discovery'] }],
        company: 'Acme',
        entry_date: '2026-03-01',
      })
    )

    const outcome = await previewOrganize({} as never, 'user-1', {
      rawText: 'Fiz o discovery do módulo X e o cliente aceitou em 2 ciclos.',
      company: null,
      isPersonalProject: false,
      entryDate: null,
    })

    expect(outcome).toEqual({
      status: 'organized',
      result: {
        highlights: [{ title: 'Aceite do módulo em 2 ciclos', metric: 'Aceite em 2 ciclos', impact: 'Reduziu retrabalho', tags: ['discovery'] }],
        company: 'Acme',
        entry_date: '2026-03-01',
      },
    })
  })

  it('injeta o vocabulário de tags da pessoa no prompt (FR-022)', async () => {
    mockGetTagVocabulary.mockResolvedValue(['liderança', 'discovery'])
    mockComplete.mockResolvedValue(jsonResponse({ highlights: [], company: null, entry_date: null }))

    await previewOrganize({} as never, 'user-1', {
      rawText: 'texto qualquer',
      company: null,
      isPersonalProject: false,
      entryDate: null,
    })

    const call = mockComplete.mock.calls[0][0]
    expect(call.user).toContain('liderança')
    expect(call.user).toContain('discovery')
  })

  it('nunca lança — falha de IA ou JSON inválido vira {status: "failed"} (mesma garantia de FR-030)', async () => {
    mockComplete.mockRejectedValue(new Error('timeout'))

    const outcome = await previewOrganize({} as never, 'user-1', {
      rawText: 'texto qualquer',
      company: null,
      isPersonalProject: false,
      entryDate: null,
    })

    expect(outcome).toEqual({ status: 'failed' })
  })

  it('nunca pede pra inferir empresa/período já resolvidos (FR-004/FR-006, mesma regra do organizeEntry)', async () => {
    mockComplete.mockResolvedValue(jsonResponse({ highlights: [], company: null, entry_date: null }))

    await previewOrganize({} as never, 'user-1', {
      rawText: 'texto qualquer',
      company: 'Acme',
      isPersonalProject: false,
      entryDate: '2026-01-01',
    })

    const call = mockComplete.mock.calls[0][0]
    expect(call.user).toContain('NÃO infira')
  })
})
