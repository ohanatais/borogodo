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
  const [starters, setStarters] = useState<string[]>(DEFAULT_STARTERS)

  useEffect(() => {
    fetch('/api/chat/starters')
      .then((r) => r.json())
      .then((data: { starters?: string[] }) => {
        if (Array.isArray(data.starters) && data.starters.length > 0) {
          setStarters(data.starters)
        }
      })
      .catch(() => { /* keep defaults */ })
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 py-8 px-4">
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Sobre o que você quer saber?
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Pergunte sobre sua trajetória, pontos fortes ou experiências.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        {starters.map((s) => (
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
