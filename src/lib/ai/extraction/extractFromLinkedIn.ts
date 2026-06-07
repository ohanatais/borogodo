import { extractEntries } from '@/lib/ai/extraction/extractEntries'
import type { ExtractedEntry } from '@/types/entry'

const MAX_LINKEDIN_ENTRIES = 20

/** Wrapper sobre `extractEntries` para import de PDF de LinkedIn/currículo — reusado pela 006. */
export async function extractFromLinkedIn(pdfText: string): Promise<ExtractedEntry[]> {
  return extractEntries(pdfText, 'linkedin_pdf', MAX_LINKEDIN_ENTRIES)
}
