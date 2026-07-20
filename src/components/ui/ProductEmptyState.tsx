import type { ReactNode } from 'react'

interface ProductEmptyStateProps {
  visual?: ReactNode
  title: string
  description: string
  action: ReactNode
}

/** Estado vazio padrão das superfícies internas do produto. */
export function ProductEmptyState({ visual, title, description, action }: ProductEmptyStateProps) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[420px]">
      {visual && <div className="mb-5" aria-hidden="true">{visual}</div>}
      <h2
        className="text-xl font-semibold leading-tight sm:text-2xl"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      <div className="mt-6">{action}</div>
    </div>
  )
}
