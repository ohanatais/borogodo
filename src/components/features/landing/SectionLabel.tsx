interface SectionLabelProps {
  children: React.ReactNode
  /** 'light' para seções de fundo claro (padrão), 'dark' para seções de fundo escuro. */
  tone?: 'light' | 'dark'
}

/**
 * Rótulo pequeno acima do título de cada seção da landing (feature 022). Cria o ritmo
 * "seccionado" — o olho sabe onde está. Server Component. A cor adapta ao fundo via `tone`.
 */
export function SectionLabel({ children, tone = 'light' }: SectionLabelProps) {
  return (
    <p
      className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
      style={{ color: tone === 'dark' ? 'var(--color-warm)' : 'var(--color-accent-text)' }}
    >
      <span
        className="inline-block h-px w-6"
        style={{ background: tone === 'dark' ? 'var(--color-warm)' : 'var(--color-accent-text)', opacity: 0.6 }}
        aria-hidden="true"
      />
      {children}
    </p>
  )
}
