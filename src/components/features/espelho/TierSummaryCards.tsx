'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SkillTier } from '@/types/mirror'
import { TIER_STYLE } from './tierStyles'

interface TierSummaryCardsProps {
  comprovadas: number
  consistentes: number
  emergentes: number
}

const TIERS: SkillTier[] = ['Comprovada', 'Consistente', 'Emergente']

export function TierSummaryCards({ comprovadas, consistentes, emergentes }: TierSummaryCardsProps) {
  const t = useTranslations('espelho.categories')
  const [openTier, setOpenTier] = useState<SkillTier | null>(null)

  const counts: Record<SkillTier, number> = {
    Comprovada: comprovadas,
    Consistente: consistentes,
    Emergente: emergentes,
  }

  const descriptions: Record<SkillTier, string> = {
    Comprovada: t('legend.comprovada'),
    Consistente: t('legend.consistente'),
    Emergente: t('legend.emergente'),
  }

  const ctaLabels: Record<SkillTier, string> = {
    Comprovada: t('criteriaButton.Comprovada'),
    Consistente: t('criteriaButton.Consistente'),
    Emergente: t('criteriaButton.Emergente'),
  }

  const criteria: Record<SkillTier, string> = {
    Comprovada: t('tierCriteria.Comprovada'),
    Consistente: t('tierCriteria.Consistente'),
    Emergente: t('tierCriteria.Emergente'),
  }

  return (
    <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
      {TIERS.map((tier) => {
        const style = TIER_STYLE[tier]
        const count = counts[tier]
        const isOpen = openTier === tier

        return (
          <div
            key={tier}
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: style.border, background: style.cardBg }}
          >
            <div className="px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-start justify-between gap-1 mb-2">
                <p
                  className="text-3xl sm:text-4xl font-bold leading-none"
                  style={{ color: style.text }}
                >
                  {count}
                </p>
                {tier === 'Comprovada' && (
                  <CheckCircle2 size={18} aria-hidden="true" style={{ color: style.text, marginTop: 4 }} />
                )}
              </div>
              <p className="text-xs font-semibold leading-tight" style={{ color: style.text }}>
                {t(`tier.${tier}`)}
              </p>
              <p className="text-[11px] mt-0.5 leading-tight" style={{ color: style.text, opacity: 0.75 }}>
                {descriptions[tier]}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenTier(isOpen ? null : tier)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-xs font-medium border-t transition-opacity hover:opacity-80"
              style={{
                borderColor: style.border,
                color: style.text,
                background: style.badgeBg,
              }}
              aria-expanded={isOpen}
            >
              <span>{ctaLabels[tier]}</span>
              {isOpen
                ? <ChevronUp size={13} aria-hidden="true" />
                : <ChevronDown size={13} aria-hidden="true" />}
            </button>

            {isOpen && (
              <div
                className="px-3 sm:px-4 py-3 text-xs leading-relaxed border-t"
                style={{ borderColor: style.border, color: style.text }}
              >
                {criteria[tier]}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
