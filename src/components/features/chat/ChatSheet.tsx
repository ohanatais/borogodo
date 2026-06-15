'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ChatMessage, type MessageData } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { StarterPrompts } from './StarterPrompts'
import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatOpenDetail {
  context?: {
    type: 'espelho' | 'historico' | 'empresa' | 'entry'
    entityId?: string
  }
  prefillMessage?: string
}

type State = {
  open: boolean
  messages: MessageData[]
  draft: string
  status: 'idle' | 'streaming' | 'error'
  context: ChatOpenDetail['context'] | null
}

type Action =
  | { type: 'OPEN'; payload: ChatOpenDetail }
  | { type: 'CLOSE' }
  | { type: 'SET_DRAFT'; text: string }
  | { type: 'USER_SENT'; id: string; content: string }
  | { type: 'ASSISTANT_STARTED'; id: string }
  | { type: 'ASSISTANT_DELTA'; id: string; text: string }
  | { type: 'ASSISTANT_DONE'; id: string; citations: Citation[]; suggestions: string[] }
  | { type: 'ASSISTANT_ERROR'; id: string; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        open: true,
        context: action.payload.context ?? state.context,
        draft: action.payload.prefillMessage ?? '',
      }
    case 'CLOSE':
      return { ...state, open: false }
    case 'SET_DRAFT':
      return { ...state, draft: action.text }
    case 'USER_SENT':
      return {
        ...state,
        draft: '',
        status: 'streaming',
        messages: [
          ...state.messages,
          { id: action.id, role: 'user', content: action.content },
        ],
      }
    case 'ASSISTANT_STARTED':
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: action.id, role: 'assistant', content: '', isStreaming: true },
        ],
      }
    case 'ASSISTANT_DELTA':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.text } : m
        ),
      }
    case 'ASSISTANT_DONE':
      return {
        ...state,
        status: 'idle',
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, isStreaming: false, citations: action.citations, suggestions: action.suggestions }
            : m
        ),
      }
    case 'ASSISTANT_ERROR':
      return {
        ...state,
        status: 'error',
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, isStreaming: false, content: action.message }
            : m
        ),
      }
    default:
      return state
  }
}

const initialState: State = {
  open: false,
  messages: [],
  draft: '',
  status: 'idle',
  context: null,
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatSheet() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  // Listen for custom open event from /espelho, /historico, etc.
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<ChatOpenDetail>).detail
      dispatch({ type: 'OPEN', payload: detail ?? {} })
    }
    window.addEventListener('borogodo:chat-open', handler)
    return () => window.removeEventListener('borogodo:chat-open', handler)
  }, [])

  // Auto-scroll on new message / delta
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.messages])

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || state.status === 'streaming') return

      const userMsgId = crypto.randomUUID()
      const assistantMsgId = crypto.randomUUID()

      dispatch({ type: 'USER_SENT', id: userMsgId, content: trimmed })
      dispatch({ type: 'ASSISTANT_STARTED', id: assistantMsgId })

      // Build history from existing messages (exclude current streaming placeholder)
      const history = state.messages.map((m) => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
            context: state.context,
          }),
        })

        if (!res.ok || !res.body) {
          dispatch({
            type: 'ASSISTANT_ERROR',
            id: assistantMsgId,
            message: 'Não consegui responder agora. Tenta de novo?',
          })
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            const json = JSON.parse(part.slice(6)) as { type: string; text?: string; citations?: Citation[]; suggestions?: string[]; message?: string }

            if (json.type === 'delta' && json.text) {
              dispatch({ type: 'ASSISTANT_DELTA', id: assistantMsgId, text: json.text })
            } else if (json.type === 'done') {
              dispatch({
                type: 'ASSISTANT_DONE',
                id: assistantMsgId,
                citations: json.citations ?? [],
                suggestions: json.suggestions ?? [],
              })
            } else if (json.type === 'error') {
              dispatch({
                type: 'ASSISTANT_ERROR',
                id: assistantMsgId,
                message: json.message ?? 'Erro desconhecido',
              })
            }
          }
        }
      } catch {
        dispatch({
          type: 'ASSISTANT_ERROR',
          id: assistantMsgId,
          message: 'Erro de conexão. Tenta de novo?',
        })
      }
    },
    [state.messages, state.status, state.context]
  )

  function handleSubmit() {
    void sendMessage(state.draft)
  }

  function handleSuggestionClick(suggestion: string) {
    void sendMessage(suggestion)
  }

  function handleStarterClick(starter: string) {
    void sendMessage(starter)
  }

  const isEmpty = state.messages.length === 0

  return (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE' })}>
      <Dialog.Portal>
        {/* Overlay — semitransparent but still visible behind */}
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
        />

        {/* Sheet content */}
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed z-50 flex flex-col focus:outline-none"
          style={{
            // Mobile: bottom sheet full-width
            // Desktop: right side panel
            right: 0,
            bottom: 0,
            left: 0,
            top: 'auto',
            maxHeight: '90dvh',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            background: 'var(--color-creme)',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
          }}
          // Desktop overrides via inline media breakpoints are not possible in pure Tailwind inline styles.
          // We rely on CSS-in-JS approach below. For a quick solution we use a wrapper class with responsive tweaks.
        >
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <Dialog.Title className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Perguntar sobre minha carreira
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar chat"
                className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ minHeight: '200px', maxHeight: '60dvh' }}
          >
            {isEmpty ? (
              <StarterPrompts onSelect={handleStarterClick} />
            ) : (
              <div className="flex flex-col gap-4">
                {state.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onSuggestionClick={handleSuggestionClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            ref={inputRef}
            className="px-4 py-3 border-t shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <ChatInput
              value={state.draft}
              onChange={(text) => dispatch({ type: 'SET_DRAFT', text })}
              onSubmit={handleSubmit}
              disabled={state.status === 'streaming'}
              placeholder="Pergunte algo sobre sua carreira..."
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Helper to open the sheet from anywhere
export function openChatSheet(detail?: ChatOpenDetail) {
  window.dispatchEvent(new CustomEvent('borogodo:chat-open', { detail: detail ?? {} }))
}
