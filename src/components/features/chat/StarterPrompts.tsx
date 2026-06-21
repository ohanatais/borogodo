'use client'

import { useEffect, useState } from 'react'
import { PREP_MOMENTS, type PrepMoment } from '@/lib/content/intentions'

const DEFAULT_STARTERS = [
  'Quais foram meus maiores projetos?',
  'Em que eu sou mais forte na minha área?',
  'Quais conquistas posso destacar na próxima conversa de performance?',
]

interface StarterPromptsProps {
  onSelect: (prompt: string) => void
  /** Quando o chat abre num momento de preparação (017), usa starters próprios do momento. */
  moment?: PrepMoment
}

export function StarterPrompts({ onSelect, moment }: StarterPromptsProps) {
  // No modo preparação os starters são constantes do momento → derivados da prop (sem estado nem
  // servidor). O estado guarda só os starters buscados no servidor (modo chat livre).
  const [fetchedStarters, setFetchedStarters] = useState<string[] | null>(null)
  const starters = moment ? PREP_MOMENTS[moment].starters : fetchedStarters

  useEffect(() => {
    // Só busca no servidor fora do modo preparação.
    if (moment) return
    let active = true
    fetch('/api/chat/starters')
      .then((r) => r.json())
      .then((data: { starters?: string[] }) => {
        if (!active) return
        if (Array.isArray(data.starters) && data.starters.length > 0) {
          setFetchedStarters(data.starters)
        } else {
          setFetchedStarters(DEFAULT_STARTERS)
        }
      })
      .catch(() => active && setFetchedStarters(DEFAULT_STARTERS))
    return () => {
      active = false
    }
  }, [moment])

  return (
    <div className="flex flex-col items-center gap-5 py-8 px-4">
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Aqui você conversa com seu histórico.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        {starters === null
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[52px] rounded-xl animate-pulse"
                style={{ background: 'var(--muted)' }}
              />
            ))
          : starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSelect(s)}
                className="text-left text-sm px-4 py-3 rounded-xl transition-colors hover:opacity-80"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                {s}
              </button>
            ))}
      </div>
    </div>
  )
}
