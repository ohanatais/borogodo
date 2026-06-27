import { useTranslations } from 'next-intl'
import { ShieldCheck, Eye, Download, Lock } from 'lucide-react'

const signalIcons = [Lock, Eye, Download, ShieldCheck] as const
const signalKeys = [0, 1, 2, 3] as const

/**
 * Propriedade e privacidade (feature 022): "seu, não da sua empresa". Gatilho de retenção.
 * Server Component. id="privacidade" (âncora).
 */
export function OwnershipSection() {
  const t = useTranslations('ownership')

  return (
    <section
      id="privacidade"
      style={{ background: 'var(--color-teal-bg, oklch(96% 0.03 195))' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <h2
          className="mb-5 text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.15, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>
        <p className="mb-10 text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {t('body')}
        </p>

        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {signalKeys.map((i) => {
            const Icon = signalIcons[i]
            return (
              <li key={i} className="flex items-center gap-2">
                <Icon size={18} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {t(`signals.${i}`)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
