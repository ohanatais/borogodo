'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Copy, ExternalLink, Trash2 } from 'lucide-react'
import type { Preparation } from '@/types/preparation'
import { FormattedAiText, plainAiText, splitAiTextTitle } from '@/components/ui/FormattedAiText'

const MOMENTS = { entrevista: 'Entrevista', review: 'Conversa de avaliação', salario: 'Pedir aumento' } as const

export function SavedPreparations({ initialPreparations }: { initialPreparations: Preparation[] }) {
  const [items, setItems] = useState(initialPreparations)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function refresh() {
      const response = await fetch('/api/preparations')
      if (response.ok) setItems(((await response.json()) as { preparations: Preparation[] }).preparations)
    }
    window.addEventListener('borogodo:preparation-saved', refresh)
    return () => window.removeEventListener('borogodo:preparation-saved', refresh)
  }, [])

  if (items.length === 0) return null
  async function remove(id: string) {
    if (!(await fetch(`/api/preparations/${id}`, { method: 'DELETE' })).ok) return
    setItems((current) => current.filter((item) => item.id !== id))
  }

  async function copy(item: Preparation) {
    try {
      await navigator.clipboard.writeText(item.body)
      setCopiedId(item.id)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      setCopiedId(null)
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Preparações salvas</h2>
      <p className="mt-2 text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>Respostas que você guardou para consultar antes da conversa.</p>
      <div className="mt-4 divide-y border-y" style={{ borderColor: 'var(--border)' }}>
        {items.map((item) => {
          const { title, body } = splitAiTextTitle(item.body)
          const cleanBody = plainAiText(body)
          const preview = cleanBody.split(/\n\s*\n/)[0] || cleanBody

          return <details key={item.id} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
                <span style={{ color: 'var(--color-primary)' }}>{MOMENTS[item.moment]}</span>
                <span aria-hidden="true" style={{ color: 'var(--muted-foreground)' }}>·</span>
                <time dateTime={item.createdAt} style={{ color: 'var(--muted-foreground)' }}>{formatDate(item.createdAt)}</time>
              </span>
              {title && <span className="mt-2 block text-base font-semibold leading-snug">{title}</span>}
              <span className="mt-1 block text-sm leading-relaxed group-open:hidden">
                <span className="line-clamp-2">{preview}</span>
              </span>
              {item.evidenceEntryIds.length > 0 && (
                <span className="mt-2 block text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {item.evidenceEntryIds.length} {item.evidenceEntryIds.length === 1 ? 'evidência usada' : 'evidências usadas'}
                </span>
              )}
            </span>
            <ChevronDown size={18} aria-hidden="true" className="mt-1 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--muted-foreground)' }} />
          </summary>

          <div className="mt-5 max-w-none">
            <FormattedAiText content={body} className="text-sm leading-relaxed" />

            {item.evidenceEntryIds.length > 0 && (
              <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold">Evidências desta resposta</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.evidenceEntryIds.map((entryId, index) => (
                    <Link key={entryId} href={`/registros?entry=${entryId}#registro-${entryId}`} target="_blank" rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold hover:bg-black/[0.03]"
                      style={{ borderColor: 'var(--border)', color: 'var(--color-primary)' }}>
                      Evidência {index + 1}<ExternalLink size={13} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void copy(item)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold hover:bg-black/[0.03]"
                style={{ color: 'var(--color-primary)' }}>
                {copiedId === item.id ? <Check size={15} /> : <Copy size={15} />}
                {copiedId === item.id ? 'Resposta copiada' : 'Copiar resposta'}
              </button>
              <button type="button" onClick={() => void remove(item.id)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold hover:bg-black/[0.03]"
                style={{ color: 'var(--destructive)' }}>
                <Trash2 size={15} /> Excluir preparação
              </button>
            </div>
          </div>
        </details>
        })}
      </div>
    </section>
  )
}
