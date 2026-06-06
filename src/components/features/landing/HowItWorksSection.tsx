'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const stepKeys = [0, 1, 2] as const

export function HowItWorksSection() {
  const t = useTranslations('howItWorks')

  return (
    <section
      style={{ background: 'var(--color-warm)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-2xl md:text-3xl mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          <strong style={{ fontWeight: 700 }}>Como </strong>
          <em style={{ fontWeight: 400, fontStyle: 'italic' }}>funciona</em>
        </h2>
        <p className="text-base mb-16" style={{ color: 'oklch(35% 0.09 75)' }}>
          {t('subtitle')}
        </p>

        <div className="flex flex-col md:flex-row gap-10">
          {stepKeys.map((i) => (
            <motion.article
              key={i}
              className="flex-1"
              initial={{ y: 18 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.14,
              }}
            >
              <span
                className="block text-5xl font-bold mb-4 leading-none"
                style={{ color: 'var(--foreground)', opacity: 0.22 }}
              >
                {t(`steps.${i}.number`)}
              </span>
              <h3
                className="text-lg font-semibold mb-2"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.01em',
                }}
              >
                {t(`steps.${i}.title`)}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: 'oklch(35% 0.09 75)' }}>
                {t(`steps.${i}.description`)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
