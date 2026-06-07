import { PDFParse } from 'pdf-parse'

/** Extrai o texto de um PDF a partir de um buffer (server-side). */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}
