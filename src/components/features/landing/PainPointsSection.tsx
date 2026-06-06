'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const painPointKeys = [0, 1, 2, 3] as const

export function PainPointsSection() {
  const t = useTranslations('painPoints')

  return (
    <section
      style={{ background: 'var(--background)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-2xl md:text-3xl mb-16"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          <strong style={{ fontWeight: 700 }}>Você já sabe </strong>
          <em style={{ fontWeight: 400, fontStyle: 'italic' }}>que tem mais para mostrar.</em>
        </h2>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          {painPointKeys.map((i) => (
            <motion.article
              key={i}
              initial={{ y: 16 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.09,
              }}
            >
              <span
                className="block w-1.5 h-1.5 rounded-full mb-4"
                style={{ background: 'var(--color-accent)' }}
                aria-hidden="true"
              />
              <h3
                className="text-lg font-semibold mb-3"
                style={{
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.01em',
                }}
              >
                {t(`items.${i}.title`)}
              </h3>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {t(`items.${i}.description`)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
