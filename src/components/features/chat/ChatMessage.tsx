'use client'

import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { CitationChip } from './CitationChip'
import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'

export interface MessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  suggestions?: string[]
  isStreaming?: boolean
  isError?: boolean
  helpful?: boolean | null
}

interface ChatMessageProps {
  message: MessageData
  onSuggestionClick: (suggestion: string) => void
  onHelpful?: (helpful: boolean) => void
}

export function ChatMessage({ message, onSuggestionClick, onHelpful }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isError = !isUser && !!message.isError
  const showFeedback = !isUser && !message.isStreaming && !isError && message.content.length > 0

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
        style={
          isUser
            ? {
                background: 'var(--color-primary)',
                color: 'var(--color-primary-fg)',
                borderBottomRightRadius: '4px',
              }
            : isError
            ? {
                background: 'oklch(98% 0.01 25)',
                color: 'var(--destructive)',
                border: '1px solid oklch(88% 0.06 25)',
                borderBottomLeftRadius: '4px',
              }
            : {
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderBottomLeftRadius: '4px',
              }
        }
      >
        {message.content || (message.isStreaming && <span className="opacity-50">...</span>)}
        {message.isStreaming && message.content && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 rounded-sm motion-safe:animate-pulse align-text-bottom"
            style={{ background: 'var(--color-primary)' }}
          />
        )}
      </div>

      {!isUser && message.citations && message.citations.length > 0 && !message.isStreaming && (
        <div className="flex flex-wrap gap-1 pl-1 max-w-[85%]">
          {message.citations.map((c, i) => (
            <CitationChip key={c.entryId} citation={c} index={i} />
          ))}
        </div>
      )}

      {!isUser && message.suggestions && message.suggestions.length > 0 && !message.isStreaming && (
        <div className="flex flex-col gap-1 pl-1 mt-1 max-w-[90%]">
          {message.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="text-left text-xs px-3 py-2.5 min-h-[44px] rounded-xl transition-colors hover:opacity-80"
              style={{
                background: 'var(--color-lilas-nevoa)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {showFeedback && onHelpful && (
        <div className="flex items-center gap-0.5 pl-1">
          <button
            type="button"
            onClick={() => onHelpful(true)}
            aria-label="Útil"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-opacity hover:opacity-70"
            style={{
              color: message.helpful === true ? 'var(--color-primary)' : 'var(--muted-foreground)',
            }}
          >
            <ThumbsUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onHelpful(false)}
            aria-label="Não útil"
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-opacity hover:opacity-70"
            style={{
              color: message.helpful === false ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <ThumbsDown size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
