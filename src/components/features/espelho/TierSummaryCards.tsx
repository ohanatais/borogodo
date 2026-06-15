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

  const toggle = (tier: SkillTier) => setOpenTier((prev) => (prev === tier ? null : tier))

  return (
    <div
      className="rounded-xl border overflow-hidden mb-6"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Three tier sections side by side, no gap */}
      <div className="grid grid-cols-3">
        {TIERS.map((tier, idx) => {
          const style = TIER_STYLE[tier]
          const isOpen = openTier === tier

          return (
            <div
              key={tier}
              className={`flex flex-col${idx > 0 ? ' border-l' : ''}`}
              style={{ borderColor: 'var(--border)', background: style.cardBg }}
            >
              <div className="px-2.5 py-3 sm:px-3 flex-1">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <p
                    className="text-2xl sm:text-3xl font-bold leading-none"
                    style={{ color: style.text }}
                  >
                    {counts[tier]}
                  </p>
                  {tier === 'Comprovada' && (
                    <CheckCircle2
                      size={15}
                      aria-hidden="true"
                      style={{ color: style.text, marginTop: 3, flexShrink: 0 }}
                    />
                  )}
                </div>
                <p className="text-xs font-semibold leading-tight" style={{ color: style.text }}>
                  {t(`tier.${tier}`)}
                </p>
                <p
                  className="text-[11px] mt-0.5 leading-tight"
                  style={{ color: style.text, opacity: 0.7 }}
                >
                  {descriptions[tier]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggle(tier)}
                className="w-full flex items-center justify-between px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium border-t transition-opacity hover:opacity-80"
                style={{
                  borderColor: 'var(--border)',
                  color: style.text,
                  background: style.badgeBg,
                }}
                aria-expanded={isOpen}
              >
                <span className="leading-tight text-left">{ctaLabels[tier]}</span>
                {isOpen
                  ? <ChevronUp size={12} aria-hidden="true" className="shrink-0 ml-1" />
                  : <ChevronDown size={12} aria-hidden="true" className="shrink-0 ml-1" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Criteria panel — inside the same container, full-width */}
      {openTier && (
        <div
          className="border-t px-4 py-3"
          style={{
            background: TIER_STYLE[openTier].hintBg,
            borderColor: 'var(--border)',
          }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: TIER_STYLE[openTier].text }}
          >
            {t(`tier.${openTier}`)}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: TIER_STYLE[openTier].text, opacity: 0.9 }}
          >
            {criteria[openTier]}
          </p>
        </div>
      )}
    </div>
  )
}
