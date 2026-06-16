import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextResponse } from 'next/server'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}))

vi.mock('@/lib/db/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  }),
}))

vi.mock('@/lib/ai/extraction/context', () => ({
  buildCaptureContext: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/ai/extraction/captureAndReflect', () => ({
  captureAndReflect: vi.fn().mockResolvedValue({ entries: [], reflection: null }),
}))

vi.mock('@/lib/ai/extraction/extractFromLinkedIn', () => ({
  extractFromDocument: vi.fn(),
}))

vi.mock('@/lib/pdf/extractText', () => ({
  extractTextFromPDF: vi.fn(),
}))

vi.mock('@/lib/db/entries', () => ({
  saveEntries: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/ai/extraction/jobs', () => ({
  fireAndForget: vi.fn(),
  maybeRegenerateMirror: vi.fn(),
  triggerProactiveInsight: vi.fn(),
}))

vi.mock('@/lib/errors', () => ({
  errorMessage: (e: unknown) => String(e),
  NoExtractableContentError: class NoExtractableContentError extends Error {},
}))

vi.mock('@/lib/log', () => ({ logger: { error: vi.fn() } }))

vi.mock('@/i18n/routing', () => ({
  routing: { locales: ['pt-BR', 'en'], defaultLocale: 'pt-BR' },
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTextRequest(text: string): Request {
  const formData = new FormData()
  formData.set('kind', 'text')
  formData.set('content', text)
  return new Request('http://localhost/api/capture', { method: 'POST', body: formData })
}

const MAX_TEXT_LENGTH = 20_000

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/capture — text length limit', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('accepts text at the maximum length', async () => {
    const text = 'a'.repeat(MAX_TEXT_LENGTH)
    const res = await POST(makeTextRequest(text))
    expect(res.status).not.toBe(400)
  })

  it('rejects text above the maximum length with 400', async () => {
    const text = 'a'.repeat(MAX_TEXT_LENGTH + 1)
    const res = await POST(makeTextRequest(text))
    expect(res.status).toBe(400)
    const body = await (res as NextResponse).json() as { error: string }
    expect(body.error).toBeTruthy()
  })

  it('does not truncate — rejects entirely rather than cutting', async () => {
    const { captureAndReflect } = await import('@/lib/ai/extraction/captureAndReflect')
    const text = 'a'.repeat(MAX_TEXT_LENGTH + 1)
    await POST(makeTextRequest(text))
    expect(captureAndReflect).not.toHaveBeenCalled()
  })
})
