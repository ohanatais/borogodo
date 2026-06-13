import { extractEntries } from '@/lib/ai/extraction/extractEntries'
import type { ExtractedEntry } from '@/types/entry'

const MAX_DOCUMENT_ENTRIES = 20

/** Extrai entradas de qualquer documento profissional em texto (currículo, LinkedIn, relatório, etc.). */
export async function extractFromDocument(documentText: string): Promise<ExtractedEntry[]> {
  return extractEntries(documentText, 'linkedin_pdf', MAX_DOCUMENT_ENTRIES)
}

/** @deprecated use extractFromDocument */
export const extractFromLinkedIn = extractFromDocument
