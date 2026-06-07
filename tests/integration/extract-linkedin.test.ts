import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockComplete = vi.fn()

vi.mock('@/lib/ai/provider', () => ({
  getProvider: () => ({ complete: mockComplete }),
}))

const ENTRY = {
  what_i_did: 'Liderou o time de pagamentos por 2 anos',
  decision: null,
  learning: null,
  impact: 'Aumentou a conversão em 15%',
  metric: null,
  entry_date: null,
  tags: ['liderança', 'pagamentos'],
  company: 'Acme',
  role_title: 'Engenheira Sênior',
}

function jsonResponse(entries: unknown[]): string {
  return '```json\n' + JSON.stringify({ entries }) + '\n```'
}

describe('extractFromLinkedIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna entradas estruturadas válidas com source linkedin_pdf', async () => {
    mockComplete.mockResolvedValue(jsonResponse([ENTRY, { ...ENTRY, what_i_did: 'Migrou o checkout para microsserviços' }]))

    const { extractFromLinkedIn } = await import('@/lib/ai/extraction/extractFromLinkedIn')
    const entries = await extractFromLinkedIn('texto extraído do PDF do LinkedIn')

    expect(entries).toHaveLength(2)
    expect(entries.every((entry) => entry.source === 'linkedin_pdf')).toBe(true)
    expect(entries[0]?.company).toBe('Acme')
  })

  it('respeita o limite máximo de 20 entradas', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...ENTRY, what_i_did: `Entrada ${i}` }))
    mockComplete.mockResolvedValue(jsonResponse(many))

    const { extractFromLinkedIn } = await import('@/lib/ai/extraction/extractFromLinkedIn')
    const entries = await extractFromLinkedIn('texto extraído do PDF do LinkedIn')

    expect(entries).toHaveLength(20)
  })

  it('lança erro quando o modelo não retorna JSON válido', async () => {
    mockComplete.mockResolvedValue('isso não é json')

    const { extractFromLinkedIn } = await import('@/lib/ai/extraction/extractFromLinkedIn')

    await expect(extractFromLinkedIn('texto extraído do PDF do LinkedIn')).rejects.toThrow()
  })

  it('lança erro (lote inválido) quando uma entrada falha na validação Zod', async () => {
    mockComplete.mockResolvedValue(jsonResponse([{ ...ENTRY, what_i_did: '' }]))

    const { extractFromLinkedIn } = await import('@/lib/ai/extraction/extractFromLinkedIn')

    await expect(extractFromLinkedIn('texto extraído do PDF do LinkedIn')).rejects.toThrow()
  })
})
