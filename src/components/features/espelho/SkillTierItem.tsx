'use client'

import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SkillItem, SkillTier } from '@/types/mirror'
import { EvidenceText } from './EvidenceText'

const TIER_STYLES: Record<SkillTier, { bg: string; text: string }> = {
  Emergente: { bg: 'var(--color-lilas-nevoa)', text: 'var(--color-lilas-nevoa-text)' },
  Consistente: { bg: 'var(--color-warm)', text: 'var(--color-warm-text)' },
  Comprovada: { bg: 'var(--color-primary)', text: 'var(--color-primary-fg)' },
}

interface SkillTierItemProps {
  skill: SkillItem
  tierLabel: string
}

export function SkillTierItem({ skill, tierLabel }: SkillTierItemProps) {
  const t = useTranslations('espelho.categories')
  const tierStyle = TIER_STYLES[skill.tier] ?? TIER_STYLES.Emergente

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {skill.name}
        </p>
        <span
          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: tierStyle.bg, color: tierStyle.text }}
        >
          {skill.tier === 'Comprovada' && (
            <CheckCircle2 size={10} aria-hidden="true" className="mr-0.5" />
          )}
          {tierLabel}
        </span>
      </div>
      {skill.evidence_text && (
        <EvidenceText
          evidence={{ text: skill.evidence_text, entry_ids: skill.entry_ids }}
        />
      )}
      {skill.tier !== 'Comprovada' && (
        <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {t(`skillProgress.${skill.tier}`)}
        </p>
      )}
    </div>
  )
}
