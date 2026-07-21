'use client'

import { useState } from 'react'
import { Check, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { CitationChip } from './CitationChip'
import { ChatEvidenceList } from './ChatEvidenceList'
import { SavePreparationButton } from './SavePreparationButton'
import type { Citation } from '@/lib/ai/chat/answerCareerQuestion'
import type { PrepMoment } from '@/lib/content/intentions'
import { FormattedAiText } from '@/components/ui/FormattedAiText'

function UserMessageText({ content }: { content: string }) {
  if (content.length <= 700) return content
  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        <span>{content.slice(0, 520).trimEnd()}…</span>
        <span className="mt-2 block text-xs font-semibold underline underline-offset-4 group-open:hidden">Ver descrição completa</span>
      </summary>
      <span className="mt-3 block">{content.slice(520)}</span>
    </details>
  )
}

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
  onHelpful?: (helpful: boolean, reason?: string) => void
  showSuggestions?: boolean
  prepMoment?: PrepMoment
}

export function ChatMessage({ message, onSuggestionClick, onHelpful, showSuggestions = true, prepMoment }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [negativeFeedbackOpen, setNegativeFeedbackOpen] = useState(false)
  const [negativeFeedback, setNegativeFeedback] = useState('')
  const [negativeFeedbackSent, setNegativeFeedbackSent] = useState(false)
  const isUser = message.role === 'user'
  const isError = !isUser && !!message.isError
  const showFeedback = !isUser && !message.isStreaming && !isError && message.content.length > 0

  // Collapse citations from the same company: show one chip per company with entry count
  const collapsedCitations = (() => {
    if (!message.citations) return []
    const byCompany = new Map<string, { count: number; date: string | null; label: string; entryId: string; firstIndex: number }>()
    message.citations.forEach((c, i) => {
      const key = c.company ?? `entry-${i}`
      const existing = byCompany.get(key)
      if (existing) {
        existing.count++
      } else {
        byCompany.set(key, { count: 1, date: c.date ?? null, label: c.label, entryId: c.entryId, firstIndex: i })
      }
    })
    return Array.from(byCompany.entries()).map(([company, meta]) => ({
      entryId: meta.entryId,
      company: company.startsWith('entry-') ? null : company,
      date: meta.date,
      label: meta.label,
      count: meta.count,
      firstIndex: meta.firstIndex,
    }))
  })()

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] break-words px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? 'whitespace-pre-wrap' : ''}`}
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
        {isUser
          ? <UserMessageText content={message.content} />
          : message.content
            ? <FormattedAiText content={message.content} />
            : message.isStreaming
              ? <span className="opacity-50">...</span>
              : null}
        {!isUser && message.isStreaming && message.content && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 rounded-sm motion-safe:animate-pulse align-text-bottom"
            style={{ background: 'var(--color-primary)' }}
          />
        )}
      </div>

      {!isUser && prepMoment && message.citations && !message.isStreaming && (
        <div className="w-full max-w-[92%]"><ChatEvidenceList citations={message.citations} moment={prepMoment} /></div>
      )}

      {!isUser && !prepMoment && collapsedCitations.length > 0 && !message.isStreaming && (
        <div className="flex flex-col gap-1 pl-1 max-w-[85%]">
          <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Fontes
          </span>
          <div className="flex flex-wrap gap-1">
            {collapsedCitations.map((c, i) => (
              <CitationChip
                key={c.entryId}
                citation={{ ...c, metric: null, impact: null, proofs: [] }}
                index={i}
                count={c.count}
              />
            ))}
          </div>
        </div>
      )}

      {!isUser && prepMoment && !message.isStreaming && !isError && message.content &&
        (message.content.length >= 280 || (message.citations?.length ?? 0) > 0) && (
        <SavePreparationButton moment={prepMoment} body={message.content} evidenceEntryIds={(message.citations ?? []).map((item) => item.entryId)} />
      )}

      {!isUser && showSuggestions && message.suggestions && message.suggestions.length > 0 && !message.isStreaming && (
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
        <div className="flex flex-wrap items-center gap-0.5 pl-1" aria-label="Avaliar resposta">
          <span className="mr-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>Essa resposta foi útil?</span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(message.content).then(() => {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1600)
              }).catch(() => undefined)
            }}
            aria-label={copied ? 'Resposta copiada' : 'Copiar resposta'}
            title={copied ? 'Copiado' : 'Copiar'}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: copied ? 'var(--color-primary)' : 'var(--muted-foreground)' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setNegativeFeedbackOpen(false)
              setNegativeFeedbackSent(false)
              onHelpful(true)
            }}
            aria-label="Útil"
            title="Útil"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{
              color: message.helpful === true ? 'var(--color-primary)' : 'var(--muted-foreground)',
            }}
          >
            <ThumbsUp size={15} fill={message.helpful === true ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => {
              setNegativeFeedbackOpen(true)
              setNegativeFeedbackSent(false)
              onHelpful(false)
            }}
            aria-label="Não útil"
            title="Não foi útil"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            style={{
              color: message.helpful === false ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <ThumbsDown size={15} fill={message.helpful === false ? 'currentColor' : 'none'} />
          </button>
          {(message.helpful === true || negativeFeedbackSent) && (
            <span className="ml-1 text-xs" role="status" style={{ color: 'var(--muted-foreground)' }}>
              Feedback enviado
            </span>
          )}
        </div>
      )}

      {showFeedback && onHelpful && negativeFeedbackOpen && (
        <form
          className="mt-1 w-full max-w-[92%] pl-1"
          onSubmit={(event) => {
            event.preventDefault()
            const reason = negativeFeedback.trim()
            if (!reason) return
            onHelpful(false, reason)
            setNegativeFeedbackOpen(false)
            setNegativeFeedbackSent(true)
          }}
        >
          <label htmlFor={`negative-feedback-${message.id}`} className="text-xs font-semibold">
            O que faltou nesta resposta?
          </label>
          <textarea
            id={`negative-feedback-${message.id}`}
            autoFocus
            value={negativeFeedback}
            onChange={(event) => setNegativeFeedback(event.target.value)}
            maxLength={800}
            rows={3}
            placeholder="Conte o que estava errado, genérico ou pouco útil."
            className="mt-2 w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-offset-1"
            style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNegativeFeedbackOpen(false)
                setNegativeFeedback('')
              }}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold hover:bg-black/[0.03]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!negativeFeedback.trim()}
              className="min-h-10 rounded-lg px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              style={{ background: 'var(--color-primary)' }}
            >
              Enviar feedback
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
