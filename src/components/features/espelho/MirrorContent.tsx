'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import type { MirrorSnapshot } from '@/types/mirror'
import { MirrorFeedback } from './MirrorFeedback'

interface MirrorContentProps {
  snapshot: MirrorSnapshot
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

interface SectionProps {
  label: string
  headline: string
  evidence: string
}

function MirrorSection({ label, headline, evidence }: SectionProps) {
  return (
    <motion.div variants={item} className="py-6 border-b" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        {headline}
      </p>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {evidence}
      </p>
    </motion.div>
  )
}

export function MirrorContent({ snapshot }: MirrorContentProps) {
  const t = useTranslations('espelho')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const { mirror } = snapshot

  const handleRegenerate = async () => {
    setLoading(true)
    setRegenerateError(null)
    try {
      const res = await fetch('/api/mirror/generate', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setRegenerateError(body.error ?? t('regenerateError'))
        return
      }
      router.refresh()
    } catch {
      setRegenerateError(t('regenerateError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        href="/painel"
        className="inline-block text-sm mb-8"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('back')}
      </Link>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-0">
        <motion.p
          variants={item}
          className="text-2xl font-medium mb-8 leading-relaxed"
          style={{ color: 'var(--foreground)' }}
        >
          {mirror.intro}
        </motion.p>

        <MirrorSection
          label={t('sections.primaryStrength')}
          headline={mirror.primary_strength.headline}
          evidence={mirror.primary_strength.evidence}
        />

        <MirrorSection
          label={t('sections.invisibleSkill')}
          headline={mirror.invisible_skill.headline}
          evidence={mirror.invisible_skill.evidence}
        />

        <MirrorSection
          label={t('sections.contextPattern')}
          headline={mirror.context_pattern.headline}
          evidence={mirror.context_pattern.evidence}
        />

        <motion.p
          variants={item}
          className="py-8 text-lg italic text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          {mirror.closing}
        </motion.p>

        {mirror.strength_themes.length > 0 && (
          <motion.div variants={item} className="pb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {t('themes')}
            </p>
            <div className="flex flex-wrap gap-2">
              {mirror.strength_themes.map((theme) => (
                <span
                  key={theme}
                  className="px-3 py-1 rounded-full text-sm font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={item} className="pt-6 space-y-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <MirrorFeedback snapshotId={snapshot.id} initialResonated={snapshot.resonated} />

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loading}
              className="text-sm underline disabled:opacity-50"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {loading ? t('regenerating') : t('regenerate')}
            </button>
            {regenerateError && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {regenerateError}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
