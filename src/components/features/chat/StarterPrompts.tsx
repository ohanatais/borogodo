'use client'

import { useEffect, useState } from 'react'

const DEFAULT_STARTERS = [
  'Quais foram meus maiores projetos?',
  'Em que eu sou mais forte na minha área?',
  'Quais conquistas posso destacar na próxima conversa de performance?',
]

interface StarterPromptsProps {
  onSelect: (prompt: string) => void
}

export function StarterPrompts({ onSelect }: StarterPromptsProps) {
  const [starters, setStarters] = useState<string[] | null>(null)

  useEffect(() => {
    fetch('/api/chat/starters')
      .then((r) => r.json())
      .then((data: { starters?: string[] }) => {
        if (Array.isArray(data.starters) && data.starters.length > 0) {
          setStarters(data.starters)
        } else {
          setStarters(DEFAULT_STARTERS)
        }
      })
      .catch(() => setStarters(DEFAULT_STARTERS))
  }, [])

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
