'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const skillLabels = ['Gestão de Crise', 'Alinhamento de Stakeholders', 'Liderança Técnica'] as const

function HeroVisual() {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
    >
      <div
        className="rounded-2xl overflow-hidden w-full"
        style={{
          background: 'oklch(21% 0.24 325)',
          boxShadow: '0 28px 72px oklch(18% 0.22 320 / 0.6)',
        }}
      >
        {/* Status bar */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-4">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'oklch(62% 0.22 28)' }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium tracking-wide" style={{ color: 'oklch(68% 0.06 320)' }}>
            analisando experiência
          </span>
        </div>

        {/* Input zone: raw work log */}
        <div className="mx-5 mb-7">
          <div
            className="rounded-xl px-5 py-5"
            style={{
              background: 'oklch(98% 0.008 90)',
              transform: 'rotate(-1deg)',
              boxShadow: '0 6px 24px oklch(18% 0.22 320 / 0.38)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <rect x="0"  y="4"   width="2" height="2" rx="1" fill="oklch(62% 0.22 28)" />
                <rect x="3"  y="2.5" width="2" height="5" rx="1" fill="oklch(62% 0.22 28)" />
                <rect x="6"  y="1"   width="2" height="8" rx="1" fill="oklch(62% 0.22 28)" />
                <rect x="9"  y="2"   width="2" height="6" rx="1" fill="oklch(62% 0.22 28)" />
                <rect x="12" y="3"   width="2" height="4" rx="1" fill="oklch(62% 0.22 28)" />
              </svg>
              <span style={{ fontSize: 10, color: 'oklch(48% 0.04 90)', letterSpacing: '0.06em' }}>
                entrada bruta
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: 'oklch(22% 0.04 90)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;Organizei a força-tarefa na crise do servidor e alinhei os times em tempo real...&rdquo;
            </p>
          </div>
        </div>

        {/* Output zone: revealed skills */}
        <div className="px-6 pb-7">
          <p
            className="text-xs font-medium mb-3.5"
            style={{ color: 'oklch(55% 0.06 320)', letterSpacing: '0.04em' }}
          >
            seu borogodó
          </p>
          <div className="flex flex-wrap gap-2">
            {skillLabels.map((label) => (
              <span
                key={label}
                className="rounded-full font-semibold"
                style={{
                  fontSize: 12,
                  padding: '5px 14px',
                  background: 'oklch(62% 0.22 28)',
                  color: 'oklch(98% 0.01 28)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function HeroSection() {
  const t = useTranslations('hero')
  const reduceMotion = useReducedMotion()

  return (
    <section
      className="relative px-6 pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, oklch(26% 0.23 325) 0%, oklch(32% 0.18 300) 100%)',
      }}
    >
      {/* Ambient depth orbs — stationary when reduced motion is on */}
      <motion.div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(42% 0.16 295 / 0.18) 0%, transparent 68%)',
          top: -180,
          right: -120,
        }}
        animate={reduceMotion ? {} : { x: [0, 40, -25, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
      />
      <motion.div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, oklch(55% 0.20 28 / 0.07) 0%, transparent 65%)',
          bottom: -80,
          left: '20%',
        }}
        animate={reduceMotion ? {} : { x: [0, -20, 30, 0], y: [0, 15, -10, 0] }}
        transition={{ duration: 14, ease: 'linear', repeat: Infinity, delay: 4 }}
      />

      <div className="max-w-5xl mx-auto relative">
        <div className="grid md:grid-cols-[58%_42%] gap-12 md:gap-16 items-center">

          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-base mb-8 leading-relaxed"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--color-primary-fg)',
                opacity: 0.6,
              }}
            >
              {t('tagline')}
            </p>

            <h1
              className="mb-7"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary-fg)',
                fontSize: 'clamp(2rem, 3.2vw, 3.25rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textWrap: 'balance',
              } as React.CSSProperties}
            >
              <strong style={{ fontWeight: 700, display: 'block' }}>
                {t('headline')}
              </strong>
              <em
                style={{
                  fontWeight: 400,
                  fontStyle: 'italic',
                  display: 'block',
                  opacity: 0.82,
                }}
              >
                {t('headlineEmphasis')}
              </em>
            </h1>

            <p
              className="text-lg max-w-md mb-10 leading-relaxed"
              style={{ color: 'var(--color-primary-fg)', opacity: 0.78 }}
            >
              {t('subheadline')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login?mode=signup"
                aria-label={t('cta.primaryAriaLabel')}
                className="inline-flex items-center justify-center min-h-[52px] px-8 py-3 rounded-full font-semibold transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-fg)',
                }}
              >
                {t('cta.primary')}
              </Link>

              <Link
                href="/login"
                aria-label={t('cta.secondaryAriaLabel')}
                className="inline-flex items-center justify-center min-h-[52px] px-8 py-3 rounded-full font-medium transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: 'var(--color-primary-fg)',
                  border: '1px solid rgba(255,255,255,0.28)',
                }}
              >
                {t('cta.secondary')}
              </Link>
            </div>
          </motion.div>

          {/* Right: product demo visual */}
          <div className="hidden md:flex justify-center">
            <HeroVisual />
          </div>

        </div>
      </div>
    </section>
  )
}
