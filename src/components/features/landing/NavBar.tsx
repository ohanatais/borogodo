'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const t = useTranslations('nav')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 transition-colors duration-300"
      style={{
        background: scrolled ? 'var(--background)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
      }}
    >
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">
        <Logo variant={scrolled ? 'light' : 'dark'} size="sm" />

        <Link
          href="/sign-up"
          aria-label={t('ctaAriaLabel')}
          className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300"
          style={{
            background: scrolled ? 'var(--color-primary)' : 'var(--background)',
            color: scrolled ? 'var(--color-primary-fg)' : 'var(--color-primary)',
          }}
        >
          {t('cta')}
        </Link>
      </div>
    </nav>
  )
}
