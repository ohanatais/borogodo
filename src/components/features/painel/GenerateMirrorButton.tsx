'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GenerateMirrorButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mirror/generate', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error ?? 'Algo deu errado. Tenta de novo?')
        return
      }
      router.refresh()
    } catch {
      setError('Não foi possível conectar. Tenta de novo?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="text-sm font-semibold px-4 py-2 rounded-full disabled:opacity-50"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        {loading ? 'Gerando...' : 'Gerar espelho agora'}
      </button>
      {error && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
