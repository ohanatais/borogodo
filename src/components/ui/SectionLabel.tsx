interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p
      className={`flex items-center gap-2 text-sm font-semibold mb-3 ${className}`}
      style={{ color: 'var(--color-primary)' }}
    >
      <span
        className="w-3 h-px inline-block shrink-0"
        style={{ background: 'var(--color-primary)' }}
      />
      {children}
    </p>
  )
}
