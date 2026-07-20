'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus } from 'lucide-react'
import { ChatMessage, type MessageData } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { StarterPrompts } from './StarterPrompts'
import { PreparationIntake } from './PreparationIntake'
import { ShareConversationButton } from './ShareConversationButton'
import { CorrectionConfirmCard } from './CorrectionConfirmCard'
import { parseAiLimit } from '@/lib/ai/cost/clientLimit'
import type { Citation, CorrectionAction } from '@/lib/ai/chat/answerCareerQuestion'
import type { PrepMoment } from '@/lib/content/intentions'
import { trackPreparationEvent } from '@/lib/preparation/trackPreparationEvent'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatOpenDetail {
  context?: {
    type: 'espelho' | 'historico' | 'empresa' | 'entry' | 'preparacao'
    entityId?: string
    /** Momento de preparação (017) quando type === 'preparacao'. */
    moment?: PrepMoment
  }
  prefillMessage?: string
}

type State = {
  open: boolean
  messages: MessageData[]
  draft: string
  status: 'idle' | 'streaming' | 'error'
  context: ChatOpenDetail['context'] | null
  pendingCorrection: CorrectionAction | null
  pendingAutoSend: string | null
}

type Action =
  | { type: 'OPEN'; payload: ChatOpenDetail }
  | { type: 'CLOSE' }
  | { type: 'NEW_CONVERSATION' }
  | { type: 'CLEAR_AUTO_SEND' }
  | { type: 'SET_DRAFT'; text: string }
  | { type: 'USER_SENT'; id: string; content: string }
  | { type: 'ASSISTANT_STARTED'; id: string }
  | { type: 'ASSISTANT_DELTA'; id: string; text: string }
  | { type: 'ASSISTANT_DONE'; id: string; citations: Citation[]; suggestions: string[]; correction?: CorrectionAction }
  | { type: 'ASSISTANT_ERROR'; id: string; message: string }
  | { type: 'ASSISTANT_LIMITED'; id: string; message: string }
  | { type: 'CARD_DISMISSED' }
  | { type: 'SET_HELPFUL'; id: string; helpful: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN': {
      const newContext = action.payload.context ?? state.context
      const contextChanged =
        newContext?.type !== state.context?.type ||
        newContext?.entityId !== state.context?.entityId ||
        newContext?.moment !== state.context?.moment
      const prefill = action.payload.prefillMessage ?? ''
      const hasPrefill = !!prefill
      const shouldReset = contextChanged || hasPrefill
      return {
        ...state,
        open: true,
        context: newContext,
        draft: '',
        messages: shouldReset ? [] : state.messages,
        pendingCorrection: shouldReset ? null : state.pendingCorrection,
        pendingAutoSend: hasPrefill ? prefill : null,
      }
    }
    case 'CLEAR_AUTO_SEND':
      return { ...state, pendingAutoSend: null }
    case 'CLOSE':
      return state.context?.type === 'preparacao' ? initialState : { ...state, open: false }
    case 'NEW_CONVERSATION':
      return {
        ...state,
        messages: [],
        draft: '',
        status: 'idle',
        pendingCorrection: null,
        context: null,
      }
    case 'SET_DRAFT':
      return { ...state, draft: action.text }
    case 'USER_SENT':
      return {
        ...state,
        draft: '',
        status: 'streaming',
        pendingCorrection: null,
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
        pendingCorrection: action.correction ?? null,
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
            ? { ...m, isStreaming: false, content: action.message, isError: true }
            : m
        ),
      }
    case 'ASSISTANT_LIMITED':
      // Pausa honesta do freio de custo (023): bolha de assistente calma, NÃO um erro.
      return {
        ...state,
        status: 'idle',
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, isStreaming: false, content: action.message }
            : m
        ),
      }
    case 'CARD_DISMISSED':
      return { ...state, pendingCorrection: null }
    case 'SET_HELPFUL':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, helpful: action.helpful } : m
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
  pendingCorrection: null,
  pendingAutoSend: null,
}

// Keep the response visibly progressive without adding several seconds of artificial delay.
const STREAM_REVEAL_CHUNK = 24

async function revealStreamText(text: string, onChunk: (chunk: string) => void): Promise<void> {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    onChunk(text)
    return
  }

  for (let index = 0; index < text.length; index += STREAM_REVEAL_CHUNK) {
    onChunk(text.slice(index, index + STREAM_REVEAL_CHUNK))
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChatSheet() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const tLimit = useTranslations('aiLimit')
  const t = useTranslations('preparation.chat')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const followOutputRef = useRef(true)

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed || state.status === 'streaming') return

      const userMsgId = crypto.randomUUID()
      const assistantMsgId = crypto.randomUUID()

      dispatch({ type: 'USER_SENT', id: userMsgId, content: trimmed })
      dispatch({ type: 'ASSISTANT_STARTED', id: assistantMsgId })
      followOutputRef.current = true

      const history = state.messages.map((m) => ({ role: m.role, content: m.content }))

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

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
          // Freio de custo (023): o pre-check devolve 429 JSON (não um stream). Surge como pausa
          // honesta numa bolha calma, nunca como falha genérica.
          const limit = await parseAiLimit(res)
          if (limit) {
            const message =
              limit.kind === 'rateLimited'
                ? tLimit('rateLimited', { minutes: limit.minutes })
                : tLimit('overloaded')
            dispatch({ type: 'ASSISTANT_LIMITED', id: assistantMsgId, message })
            return
          }
          dispatch({
            type: 'ASSISTANT_ERROR',
            id: assistantMsgId,
            message: 'Não consegui responder agora. Tenta de novo?',
          })
          return
        }

        reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const parts = buffer.split('\n\n')
            buffer = parts.pop() ?? ''

            for (const part of parts) {
              if (!part.startsWith('data: ')) continue
              const json = JSON.parse(part.slice(6)) as {
                type: string
                text?: string
                citations?: Citation[]
                suggestions?: string[]
                correction?: CorrectionAction
                message?: string
              }

              if (json.type === 'delta' && json.text) {
                await revealStreamText(json.text, (chunk) => {
                  dispatch({ type: 'ASSISTANT_DELTA', id: assistantMsgId, text: chunk })
                })
              } else if (json.type === 'done') {
                const suggestions = (json.suggestions ?? []).filter(
                  (suggestion) => !/^(quero|vamos)\s+(treinar|praticar)\b/i.test(suggestion.trim())
                )
                dispatch({
                  type: 'ASSISTANT_DONE',
                  id: assistantMsgId,
                  citations: json.citations ?? [],
                  suggestions,
                  correction: json.correction,
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
        } finally {
          reader.releaseLock()
        }
      } catch {
        dispatch({
          type: 'ASSISTANT_ERROR',
          id: assistantMsgId,
          message: 'Erro de conexão. Tenta de novo?',
        })
      }
    },
    [state.messages, state.status, state.context, tLimit]
  )

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<ChatOpenDetail>).detail
      dispatch({ type: 'OPEN', payload: detail ?? {} })
    }
    function closeHandler() {
      dispatch({ type: 'CLOSE' })
    }
    window.addEventListener('borogodo:chat-open', handler)
    window.addEventListener('borogodo:chat-close', closeHandler)
    return () => {
      window.removeEventListener('borogodo:chat-open', handler)
      window.removeEventListener('borogodo:chat-close', closeHandler)
    }
  }, [])

  // Auto-send prefill message when sheet opens with a pre-set context action
  useEffect(() => {
    if (state.open && state.pendingAutoSend) {
      dispatch({ type: 'CLEAR_AUTO_SEND' })
      void sendMessage(state.pendingAutoSend)
    }
  }, [state.open, state.pendingAutoSend, sendMessage])

  // Focus textarea when sheet opens (only when no auto-send pending)
  useEffect(() => {
    if (state.open && !state.pendingAutoSend) {
      requestAnimationFrame(() => {
        const textarea = inputAreaRef.current?.querySelector('textarea')
        textarea?.focus()
      })
    }
  }, [state.open, state.pendingAutoSend])

  useEffect(() => {
    if (!followOutputRef.current) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })
  }, [state.messages, state.pendingCorrection])

  function handleSubmit() {
    if (isPreparacaoMode && isEmpty && state.context?.moment && state.draft.trim()) {
      trackPreparationEvent('context_submitted', state.context.moment, { hasContext: true })
    }
    void sendMessage(state.draft)
  }

  function handleSuggestionClick(suggestion: string) {
    void sendMessage(suggestion)
  }

  function handleStarterClick(starter: string) {
    void sendMessage(starter)
  }

  const isEmpty = state.messages.length === 0
  const isPreparacaoMode = state.context?.type === 'preparacao'
  // Suggestions don't make sense in correction/espelho context: the user needs to
  // type their own free-form correction, not pick a pre-canned response.
  const suggestionsEnabled = state.context?.type !== 'entry' && state.context?.type !== 'espelho'

  return (
    <Dialog.Root open={state.open} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE' })}>
      <Dialog.Portal>
        {/* Mobile overlay full-screen; desktop overlay transparent (panel is floating, non-blocking) */}
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'oklch(18% 0.02 260 / 0.12)', backdropFilter: 'blur(1px)' }}
        />

        {/* Mobile: bottom sheet (60dvh fixed). Desktop: right-side drawer fixed height */}
        <Dialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className={`fixed z-50 flex flex-col focus:outline-none overflow-hidden bottom-0 left-0 right-0
            ${isPreparacaoMode ? 'inset-0 h-[100dvh] rounded-none lg:left-auto lg:bottom-4 lg:right-6 lg:top-4 lg:h-auto lg:w-[min(760px,calc(100vw-48px))] lg:max-h-[calc(100dvh-32px)] lg:rounded-2xl' : 'rounded-t-[20px] h-[72dvh] lg:bottom-4 lg:right-6 lg:left-auto lg:top-4 lg:w-[480px] lg:h-auto lg:max-h-[calc(100dvh-32px)] lg:rounded-2xl'}`}
          style={{
            background: 'var(--color-creme)',
            boxShadow: '0 8px 40px oklch(18% 0.02 260 / 0.25), 0 2px 8px oklch(18% 0.02 260 / 0.1)',
          }}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 lg:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--muted-foreground)', opacity: 0.3 }} />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Dialog.Title className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {isPreparacaoMode ? t('title') : 'Perguntar sobre minha carreira'}
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-1">
              {state.messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'NEW_CONVERSATION' })}
                  aria-label="Nova conversa"
                  title="Nova conversa"
                  className="relative w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 after:absolute after:inset-[-10px] after:content-['']"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Plus size={16} />
                </button>
              )}
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Fechar chat"
                  className="relative w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70 after:absolute after:inset-[-10px] after:content-['']"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ minHeight: '200px' }}
            onScroll={(event) => {
              const target = event.currentTarget
              followOutputRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 96
            }}
          >
            {isEmpty ? (
              isPreparacaoMode && state.context?.moment ? (
                <PreparationIntake moment={state.context.moment} />
              ) : (
                <StarterPrompts onSelect={handleStarterClick} />
              )
            ) : (
              <div className="flex flex-col gap-4">
                {(() => {
                  const lastAssistantIdx = state.messages.reduce(
                    (acc, m, i) => (m.role === 'assistant' ? i : acc),
                    -1
                  )
                  return state.messages.map((msg, i) => (
                    <ChatMessage
                      key={msg.id}
                      message={msg}
                      onSuggestionClick={handleSuggestionClick}
                      onHelpful={(helpful, reason) => {
                        dispatch({ type: 'SET_HELPFUL', id: msg.id, helpful })
                        trackPreparationEvent(
                          'response_feedback',
                          isPreparacaoMode ? state.context?.moment : undefined,
                          {
                            helpful,
                            hasEvidence: (msg.citations?.length ?? 0) > 0,
                            ...(reason ? { reasonProvided: true, reasonLength: reason.length } : {}),
                          }
                        )
                      }}
                      showSuggestions={suggestionsEnabled && i === lastAssistantIdx}
                      prepMoment={isPreparacaoMode ? state.context?.moment : undefined}
                    />
                  ))
                })()}

                {isPreparacaoMode && state.messages.length > 0 && (
                  <ShareConversationButton messages={state.messages} moment={state.context?.moment} />
                )}

                {state.pendingCorrection && (
                  <CorrectionConfirmCard
                    correction={state.pendingCorrection}
                    onDismiss={() => dispatch({ type: 'CARD_DISMISSED' })}
                  />
                )}


              </div>
            )}
          </div>

          {/* Input area */}
          <div
            ref={inputAreaRef}
            className="px-4 py-3 border-t shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <ChatInput
              value={state.draft}
              onChange={(text) => dispatch({ type: 'SET_DRAFT', text })}
              onSubmit={handleSubmit}
              disabled={state.status === 'streaming'}
              placeholder={isPreparacaoMode && isEmpty && state.context?.moment ? t(`intakePlaceholder.${state.context.moment}`) : isPreparacaoMode ? t('placeholder') : 'Pergunte algo sobre sua carreira...'}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function openChatSheet(detail?: ChatOpenDetail) {
  window.dispatchEvent(new CustomEvent('borogodo:chat-open', { detail: detail ?? {} }))
}

export function closeChatSheet() {
  window.dispatchEvent(new CustomEvent('borogodo:chat-close'))
}
