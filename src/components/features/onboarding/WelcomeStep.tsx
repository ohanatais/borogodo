'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

interface WelcomeStepProps {
  userName: string
  onNext: () => void
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  const t = useTranslations('bemvindo.step1')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center gap-8"
      style={{ background: 'var(--color-primary)' }}
    >
      <Logo variant="dark" size="sm" />
      <div className="flex flex-col gap-4 max-w-md">
        <h1
          className="text-4xl sm:text-5xl leading-tight"
          style={{ fontFamily: 'Fraunces, serif', color: 'oklch(97% 0.02 90)' }}
        >
          {t('headline', { nome: userName || 'olá' })}
        </h1>
        <p
          className="text-lg font-medium"
          style={{ color: 'oklch(90% 0.04 90)' }}
        >
          {t('sub')}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'oklch(80% 0.03 90)' }}
        >
          {t('promise')}
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="px-8 py-3.5 rounded-full text-base font-semibold transition-opacity hover:opacity-90 active:opacity-75 min-w-[48px] min-h-[48px]"
        style={{ background: 'oklch(97% 0.02 90)', color: 'var(--color-primary)' }}
      >
        {t('cta')}
      </button>
    </motion.div>
  )
}
