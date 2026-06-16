import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'

// ─── Web Speech Mock ──────────────────────────────────────────────────────────

function makeMockRecognition() {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
  const instance = {
    continuous: false,
    interimResults: false,
    lang: '',
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    addEventListener: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners[event] ??= []
      listeners[event].push(cb)
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    emit(event: string, detail?: unknown) {
      for (const cb of listeners[event] ?? []) cb(detail)
    },
  }
  return instance
}

type MockRecognition = ReturnType<typeof makeMockRecognition>

let mockRecognitionInstance: MockRecognition | null = null

vi.stubGlobal('SpeechRecognition', function MockSpeechRecognition() {
  mockRecognitionInstance = makeMockRecognition()
  return mockRecognitionInstance
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRecognitionInstance = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has supported=true when SpeechRecognition is available', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.supported).toBe(true)
  })

  it('has supported=false when SpeechRecognition is not available', () => {
    vi.stubGlobal('SpeechRecognition', undefined)
    vi.stubGlobal('webkitSpeechRecognition', undefined)
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.supported).toBe(false)
    vi.stubGlobal('SpeechRecognition', function MockSpeechRecognition() {
      mockRecognitionInstance = makeMockRecognition()
      return mockRecognitionInstance
    })
  })

  it('is idle initially', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.state).toBe('idle')
    expect(result.current.transcript).toBe('')
  })

  it('start changes state to listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })
    expect(result.current.state).toBe('listening')
  })

  it('accumulates transcript from result events', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })

    act(() => {
      mockRecognitionInstance?.emit('result', {
        results: [[{ transcript: 'Fiz uma entrega' }]],
        resultIndex: 0,
      })
    })

    expect(result.current.transcript).toContain('Fiz uma entrega')
  })

  it('stop changes state to stopped', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })
    act(() => { result.current.stop() })
    expect(result.current.state).toBe('stopped')
  })

  it('cancel resets transcript and state to idle', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })
    act(() => {
      mockRecognitionInstance?.emit('result', {
        results: [[{ transcript: 'Texto indesejado' }]],
        resultIndex: 0,
      })
    })
    act(() => { result.current.cancel() })

    expect(result.current.state).toBe('idle')
    expect(result.current.transcript).toBe('')
  })

  it('rerecord clears previous transcript and starts a new session', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })
    act(() => {
      mockRecognitionInstance?.emit('result', {
        results: [[{ transcript: 'Texto anterior' }]],
        resultIndex: 0,
      })
    })
    act(() => { result.current.stop() })
    act(() => { result.current.rerecord() })

    expect(result.current.transcript).toBe('')
    expect(result.current.state).toBe('listening')
  })

  it('handles permission denied error with honest state', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => { result.current.start() })
    act(() => {
      mockRecognitionInstance?.emit('error', { error: 'not-allowed' })
    })

    expect(result.current.state).toBe('permission-denied')
  })

  it('handles unsupported gracefully — does not throw on start', () => {
    vi.stubGlobal('SpeechRecognition', undefined)
    vi.stubGlobal('webkitSpeechRecognition', undefined)
    const { result } = renderHook(() => useSpeechRecognition())
    expect(() => act(() => { result.current.start() })).not.toThrow()
    vi.stubGlobal('SpeechRecognition', function MockSpeechRecognition() {
      mockRecognitionInstance = makeMockRecognition()
      return mockRecognitionInstance
    })
  })
})
