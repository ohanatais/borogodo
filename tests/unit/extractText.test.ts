import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetDocumentProxy, mockExtractText } = vi.hoisted(() => {
  const mockGetDocumentProxy = vi.fn()
  const mockExtractText = vi.fn()
  return { mockGetDocumentProxy, mockExtractText }
})

vi.mock('unpdf', () => ({
  getDocumentProxy: mockGetDocumentProxy,
  extractText: mockExtractText,
}))

import { extractTextFromPDF } from '@/lib/pdf/extractText'

describe('extractTextFromPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna o texto extraído do PDF', async () => {
    const fakePdf = {}
    mockGetDocumentProxy.mockResolvedValue(fakePdf)
    mockExtractText.mockResolvedValue({ text: 'texto extraído do PDF', totalPages: 1 })

    const text = await extractTextFromPDF(Buffer.from('conteúdo binário do PDF'))

    expect(text).toBe('texto extraído do PDF')
    expect(mockGetDocumentProxy).toHaveBeenCalledWith(expect.any(Uint8Array))
    expect(mockExtractText).toHaveBeenCalledWith(fakePdf, { mergePages: true })
  })

  it('propaga o erro quando a extração falha', async () => {
    mockGetDocumentProxy.mockRejectedValue(new Error('PDF inválido'))

    await expect(extractTextFromPDF(Buffer.from('lixo'))).rejects.toThrow('PDF inválido')
  })
})
