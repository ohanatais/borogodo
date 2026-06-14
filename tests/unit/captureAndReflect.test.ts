import { describe, it, expect, vi, beforeEach } from 'vitest'
import { captureAndReflect } from '@/lib/ai/extraction/captureAndReflect'
import type { CaptureContext } from '@/types/capture'

const mockComplete = vi.fn()

vi.mock('@/lib/ai/provider', () => ({
  getProvider: () => ({ complete: mockComplete }),
}))

const CONTEXT: CaptureContext = { strengthThemes: [], recentSummaries: [], entryCount: 0 }

const VALID_ENTRY = {
  what_i_did: 'Fechei a migração do banco no prazo',
  decision: null,
  learning: null,
  impact: 'Reduziu o downtime em 30%',
  metric: null,
  entry_date: '2026-06-03',
  tags: ['migração'],
}

const VALID_REFLECTION = {
  summary: 'Entendi: você concluiu a migração sob prazo apertado.',
  pills: ['decisão sob pressão'],
  move: { type: 'affirmation', text: 'Isso é material de entrevista.' },
}

function jsonBlock(payload: unknown): string {
  return '```json\n' + JSON.stringify(payload) + '\n```'
}

describe('captureAndReflect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extrai o bloco JSON, valida e retorna entries + reflection', async () => {
    mockComplete.mockResolvedValue(jsonBlock({ entries: [VALID_ENTRY], reflection: VALID_REFLECTION }))

    const result = await captureAndReflect('Fechei a migração do banco no prazo', 'text', CONTEXT)

    expect(result.entries).toHaveLength(1)
    expect(result.entries[0]?.source).toBe('text')
    expect(result.reflection).toEqual(VALID_REFLECTION)
  })

  it('lança erro quando a resposta não contém bloco JSON', async () => {
    mockComplete.mockResolvedValue('desculpe, não consigo ajudar com isso')

    await expect(captureAndReflect('texto válido', 'text', CONTEXT)).rejects.toThrow(
      'JSON não encontrado na resposta do modelo'
    )
  })

  it('lança erro quando o bloco contém JSON malformado', async () => {
    mockComplete.mockResolvedValue('```json\n{ entries: [ }\n```')

    await expect(captureAndReflect('texto válido', 'text', CONTEXT)).rejects.toThrow()
  })

  it('aceita reflexo com pills vazio e retorna array vazio', async () => {
    mockComplete.mockResolvedValue(
      jsonBlock({ entries: [VALID_ENTRY], reflection: { ...VALID_REFLECTION, pills: [] } })
    )

    const result = await captureAndReflect('texto válido', 'text', CONTEXT)
    expect(result.reflection.pills).toEqual([])
  })
})
