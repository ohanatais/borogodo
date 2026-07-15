import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
  id?: string
}

/**
 * Checkbox estilizado (o navegador não estiliza `<input type="checkbox">` de forma consistente
 * com o resto do sistema). Mantém o `<input>` real por baixo — semântica e teclado nativos — só
 * a caixa visual é customizada. Toque ≥ 40px, foco herda o `:focus-visible` global.
 */
export function Checkbox({ checked, onChange, ariaLabel, id }: CheckboxProps) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
        className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border transition-colors"
        style={{
          borderColor: checked ? 'var(--color-primary)' : 'var(--border)',
          background: checked ? 'var(--color-primary)' : 'var(--background)',
        }}
      >
        {checked && <Check size={13} strokeWidth={3} color="var(--color-primary-fg)" />}
      </span>
    </span>
  )
}
