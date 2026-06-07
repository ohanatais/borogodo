import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetText, mockDestroy, mockConstructor, MockPDFParse } = vi.hoisted(() => {
  const mockGetText = vi.fn()
  const mockDestroy = vi.fn(async () => {})
  const mockConstructor = vi.fn()

  class MockPDFParse {
    getText = mockGetText
    destroy = mockDestroy

    constructor(options: unknown) {
      mockConstructor(options)
    }
  }

  return { mockGetText, mockDestroy, mockConstructor, MockPDFParse }
})

vi.mock('pdf-parse', () => ({
  PDFParse: MockPDFParse,
}))

import { extractTextFromPDF } from '@/lib/pdf/extractText'

describe('extractTextFromPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna o texto extraído e libera o parser', async () => {
    mockGetText.mockResolvedValue({ text: 'texto extraído do PDF' })
    const buffer = Buffer.from('conteúdo binário do PDF')

    const text = await extractTextFromPDF(buffer)

    expect(text).toBe('texto extraído do PDF')
    expect(mockConstructor).toHaveBeenCalledWith({ data: buffer })
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })

  it('libera o parser mesmo quando a extração falha', async () => {
    mockGetText.mockRejectedValue(new Error('PDF corrompido'))

    await expect(extractTextFromPDF(Buffer.from('lixo'))).rejects.toThrow('PDF corrompido')
    expect(mockDestroy).toHaveBeenCalledTimes(1)
  })
})
