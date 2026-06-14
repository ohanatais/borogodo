'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import type { MirrorSnapshot, Mirror, SkillTier, EvidenceItem } from '@/types/mirror'
import { MirrorFeedback } from './MirrorFeedback'
import { EvidenceText } from './EvidenceText'
import { MacroCategoryTabs } from './MacroCategoryTabs'

interface MirrorContentProps {
  snapshot: MirrorSnapshot
  userName?: string
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

/* ── Espelho header: avatar + h1 + specialty chips + proven skill pills ── */
function EspelhoHeader({ name, fullName, mirror }: { name: string; fullName: string; mirror: Mirror }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'

  const provenSkills = (mirror.categories ?? [])
    .flatMap((cat) => cat.skills)
    .filter((sk) => sk.tier === ('Comprovada' as SkillTier))
    .slice(0, 3)
    .map((sk) => sk.name)

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h1
            className="font-display text-2xl lg:text-3xl font-semibold tracking-tight leading-tight"
            style={{ color: 'var(--foreground)' }}
          >
            O espelho de <em className="font-normal italic">{name}</em>
          </h1>
          {fullName && fullName !== name && (
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {fullName}
            </p>
          )}
        </div>
      </div>

      {/* Specialty chips */}
      {mirror.strength_themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mirror.strength_themes.slice(0, 5).map((theme) => (
            <span
              key={theme}
              className="px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap"
              style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Proven skill pills — outline */}
      {provenSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {provenSkills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full text-sm font-medium border whitespace-nowrap"
              style={{ borderColor: 'oklch(30% 0.20 320 / 0.25)', color: 'var(--foreground)' }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── RevealBlock — border-t separator, no rounding ── */
interface BlockProps {
  label: string
  headline: string
  evidence: EvidenceItem | string
}

function RevealBlock({ label, headline, evidence }: BlockProps) {
  return (
    <motion.div
      variants={item}
      className="py-6 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      <p
        className="font-display text-xl lg:text-2xl font-semibold leading-snug mb-2 max-w-[26ch]"
        style={{ color: 'var(--foreground)' }}
      >
        {headline}
      </p>
      <EvidenceText evidence={evidence} />
    </motion.div>
  )
}

/* ── BorogodoBlock — warm mel card, full background ── */
function BorogodoBlock({ label, headline, evidence }: BlockProps) {
  return (
    <motion.div
      variants={item}
      className="rounded-xl p-6 lg:p-8 my-2"
      style={{ background: 'var(--color-warm)' }}
    >
      <p className="text-sm font-semibold mb-3" style={{ color: 'oklch(35% 0.09 75)' }}>
        {label}
      </p>
      <p
        className="font-display text-2xl lg:text-[1.85rem] font-semibold leading-snug max-w-[22ch] mb-2"
        style={{ color: 'var(--foreground)' }}
      >
        {headline}
      </p>
      <EvidenceText evidence={evidence} />
    </motion.div>
  )
}

export function MirrorContent({ snapshot, userName = '' }: MirrorContentProps) {
  const t = useTranslations('espelho')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const { mirror } = snapshot

  const personName = userName || mirror.intro.match(/^([A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+)/)?.[1] || ''

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
    <div className="max-w-[820px] mx-auto px-5 lg:px-9 py-8">
      <Link
        href="/painel"
        className="inline-block text-sm mb-8"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('back')}
      </Link>

      {personName && (
        <EspelhoHeader name={personName} fullName={userName} mirror={mirror} />
      )}

      <motion.div variants={container} initial="hidden" animate="show">
        {/* Intro */}
        <motion.p
          variants={item}
          className="text-2xl font-medium mb-6 leading-relaxed"
          style={{ color: 'var(--foreground)' }}
        >
          {mirror.intro}
        </motion.p>

        {/* Three reveals */}
        <RevealBlock
          label={t('sections.primaryStrength')}
          headline={mirror.primary_strength.headline}
          evidence={mirror.primary_strength.evidence}
        />

        <BorogodoBlock
          label={t('sections.invisibleSkill')}
          headline={mirror.invisible_skill.headline}
          evidence={mirror.invisible_skill.evidence}
        />

        <RevealBlock
          label={t('sections.contextPattern')}
          headline={mirror.context_pattern.headline}
          evidence={mirror.context_pattern.evidence}
        />

        {/* Skills by category */}
        {mirror.categories && mirror.categories.length > 0 && (
          <motion.div variants={item} className="mt-8">
            <MacroCategoryTabs categories={mirror.categories} />
          </motion.div>
        )}

        {/* Closing — after categories, display font, left-aligned */}
        <motion.p
          variants={item}
          className="font-display text-lg lg:text-xl leading-snug mt-10 max-w-[40ch]"
          style={{ color: 'var(--foreground)' }}
        >
          {mirror.closing}
        </motion.p>

        {/* Feedback + regenerate */}
        <motion.div
          variants={item}
          className="pt-6 mt-6 space-y-6 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
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
