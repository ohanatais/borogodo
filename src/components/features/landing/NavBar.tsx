'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

const anchors = [
  { href: '#como-funciona', key: 'anchorHow' },
  { href: '#provas', key: 'anchorProof' },
  { href: '#privacidade', key: 'anchorPrivacy' },
  { href: '#perguntas', key: 'anchorFaq' },
] as const

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
      <div className="max-w-5xl mx-auto h-16 flex items-center justify-between gap-4">
        <Logo variant={scrolled ? 'light' : 'dark'} size="sm" />

        <div className="hidden md:flex items-center gap-7">
          {anchors.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
              style={{ color: scrolled ? 'var(--foreground)' : 'var(--color-primary-fg)' }}
            >
              {t(a.key)}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          aria-label={t('signInAriaLabel')}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: scrolled ? 'var(--color-primary)' : 'var(--color-primary-fg)' }}
        >
          {t('signIn')}
        </Link>
      </div>
    </nav>
  )
}
