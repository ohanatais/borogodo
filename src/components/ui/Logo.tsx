import { LogoMark } from './LogoMark'

type LogoVariant = 'dark' | 'light'
type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  /** dark = white wordmark on roxo-jambo; light = roxo-jambo wordmark on creme */
  variant?: LogoVariant
  size?: LogoSize
  showWordmark?: boolean
  className?: string
}

const sizeMap: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  sm: { mark: 20, text: 'text-base',  gap: 'gap-1.5' },
  md: { mark: 28, text: 'text-xl',    gap: 'gap-2'   },
  lg: { mark: 40, text: 'text-3xl',   gap: 'gap-3'   },
}

const wordmarkColor: Record<LogoVariant, string> = {
  dark:  'text-[oklch(98%_0.01_320)]',
  light: 'text-[oklch(30%_0.20_320)]',
}

export function Logo({
  variant = 'light',
  size = 'md',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const { mark, text, gap } = sizeMap[size]

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <LogoMark size={mark} />
      {showWordmark && (
        <span
          className={`font-display font-semibold leading-none tracking-tight ${text} ${wordmarkColor[variant]}`}
        >
          borogodó
        </span>
      )}
    </div>
  )
}
