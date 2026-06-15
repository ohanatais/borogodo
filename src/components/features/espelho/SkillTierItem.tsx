'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SkillItem } from '@/types/mirror'
import { EvidenceText } from './EvidenceText'
import { TIER_STYLE } from './tierStyles'

interface SkillTierItemProps {
  skill: SkillItem
  tierLabel: string
}

export function SkillTierItem({ skill, tierLabel }: SkillTierItemProps) {
  const t = useTranslations('espelho.categories')
  const style = TIER_STYLE[skill.tier] ?? TIER_STYLE.Emergente

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {skill.name}
        </p>
        <span
          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: style.badgeBg, color: style.text }}
        >
          {skill.tier === 'Comprovada' && (
            <CheckCircle2 size={11} aria-hidden="true" />
          )}
          {tierLabel}
        </span>
      </div>
      {skill.evidence_text && (
        <EvidenceText evidence={{ text: skill.evidence_text, entry_ids: skill.entry_ids }} />
      )}
      {skill.tier === 'Emergente' && (
        <div
          className="mt-2 rounded-lg px-3 py-2.5"
          style={{ background: style.hintBg, borderLeft: `3px solid ${style.border}` }}
        >
          <p className="text-xs leading-snug" style={{ color: style.text }}>
            {t('skillProgress.Emergente')}
          </p>
          <Link
            href="/painel"
            className="text-xs font-semibold mt-1.5 block hover:opacity-80 transition-opacity"
            style={{ color: style.text, textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            {t('skillProgressCta')} →
          </Link>
        </div>
      )}
      {skill.tier === 'Consistente' && (
        <div
          className="mt-2 rounded-lg px-3 py-2.5"
          style={{ background: style.hintBg, borderLeft: `3px solid ${style.border}` }}
        >
          <p className="text-xs leading-snug" style={{ color: style.text }}>
            {t('skillProgress.Consistente')}
          </p>
          <Link
            href="/painel"
            className="text-xs font-semibold mt-1.5 block hover:opacity-80 transition-opacity"
            style={{ color: style.text, textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            {t('skillProgressCta')} →
          </Link>
        </div>
      )}
    </div>
  )
}
