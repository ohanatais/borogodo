'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { MediaSlot } from './MediaSlot'

/**
 * Demo do hero (feature 022). Ilha client: animação de entrada + respeito a movimento
 * reduzido. O conteúdo vive dentro de um `MediaSlot` (placeholder), pronto pra receber o
 * vídeo real do onboarding depois sem mexer no layout. Mostra a força COM a evidência citada
 * (FR-012), que é o que prova que não é IA genérica. Visível no mobile (FR-011).
 */
export function HeroDemo() {
  const t = useTranslations('hero.demo')
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="w-full"
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
    >
      <MediaSlot aspect="4/3" kind="placeholder" label={t('forceLabel')} note={t('placeholderNote')}>
        <div className="flex h-full flex-col p-5">
          {/* status */}
          <div className="mb-4 flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full"
              style={{ background: 'oklch(62% 0.22 28)' }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium tracking-wide" style={{ color: 'oklch(68% 0.06 320)' }}>
              {t('statusLabel')}
            </span>
          </div>

          {/* entrada bruta */}
          <div
            className="rounded-xl px-4 py-4"
            style={{ background: 'oklch(98% 0.008 90)', boxShadow: '0 6px 24px oklch(18% 0.22 320 / 0.3)' }}
          >
            <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: 'oklch(48% 0.04 90)' }}>
              {t('inputLabel')}
            </p>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: 'oklch(22% 0.04 90)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{t('inputText')}&rdquo;
            </p>
          </div>

          {/* força + prova */}
          <div className="mt-auto pt-5">
            <p className="mb-2 text-xs font-medium" style={{ color: 'oklch(55% 0.06 320)' }}>
              {t('outputLabel')}
            </p>
            <span
              className="inline-block rounded-full px-3.5 py-1.5 text-xs font-semibold"
              style={{ background: 'oklch(62% 0.22 28)', color: 'oklch(98% 0.01 28)' }}
            >
              {t('forceLabel')}
            </span>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'oklch(72% 0.05 320)' }}>
              {t('proofPrefix')}{' '}
              <span style={{ fontStyle: 'italic', color: 'oklch(85% 0.04 320)' }}>
                &ldquo;{t('proofText')}&rdquo;
              </span>
            </p>
          </div>
        </div>
      </MediaSlot>
    </motion.div>
  )
}
