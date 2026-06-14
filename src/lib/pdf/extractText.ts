import { extractText, getDocumentProxy } from 'unpdf'

/** Extrai o texto de um PDF a partir de um buffer (server-side). */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}
