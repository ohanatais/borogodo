'use client'

import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { SectionLabel } from './SectionLabel'

const rowKeys = [0, 1, 2, 3, 4] as const

/**
 * Comparação honesta Borogodó × ChatGPT (feature 022). Tabela simples de 3 colunas
 * (aspecto · ChatGPT · Borogodó), com a coluna do Borogodó destacada. Client Component:
 * cada linha entra com um stagger sutil ao aparecer. Cada célula sai da voz já estabelecida
 * (Provas + FAQ), sem afirmação injusta.
 */
export function ComparisonSection() {
  const t = useTranslations('comparison')
  const reduceMotion = useReducedMotion()

  return (
    <section style={{ background: 'var(--color-warm-bg, oklch(95.5% 0.035 80))' }} className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className="mb-10 max-w-2xl text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '-0.015em' }}
        >
          {t('title')}
        </h2>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="w-1/4 px-4 py-3 md:px-6" aria-hidden="true" />
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider md:px-6"
                  style={{ color: 'var(--muted-foreground)' }}
                  scope="col"
                >
                  {t('chatgptName')}
                </th>
                <th
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider md:px-6"
                  style={{ color: 'var(--color-primary)', background: 'var(--color-lilas-nevoa)' }}
                  scope="col"
                >
                  {t('borogodoName')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rowKeys.map((i) => (
                <motion.tr
                  key={i}
                  style={i < rowKeys.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                >
                  <th
                    scope="row"
                    className="px-4 py-4 align-top text-sm font-semibold md:px-6"
                    style={{ color: 'var(--foreground)', fontFamily: 'var(--font-display)' }}
                  >
                    {t(`rows.${i}.aspect`)}
                  </th>
                  <td className="px-4 py-4 align-top md:px-6">
                    <span className="flex items-start gap-2">
                      <X size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                        {t(`rows.${i}.chatgpt`)}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top md:px-6" style={{ background: 'var(--color-lilas-nevoa)' }}>
                    <span className="flex items-start gap-2">
                      <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent-text)' }} />
                      <span className="text-sm font-medium leading-relaxed" style={{ color: 'var(--foreground)' }}>
                        {t(`rows.${i}.borogodo`)}
                      </span>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
