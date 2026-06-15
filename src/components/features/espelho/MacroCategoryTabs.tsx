'use client'

import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { MacroCategory, SkillTier } from '@/types/mirror'
import { SkillTierItem } from './SkillTierItem'
import { TierLegend } from './TierLegend'
import { SectionLabel } from '@/components/ui/SectionLabel'

const RECRUITER_CONTEXT: Partial<Record<string, string>> = {
  'Execução': 'delivery · ship product',
  'Insight e Diagnóstico': 'product sense · analytical',
  'Estratégia e Visão': 'strategy · business impact',
  'Influência e Liderança': 'leadership · stakeholders',
  'Domínio': 'market fit · especialização',
}

interface MacroCategoryTabsProps {
  categories: MacroCategory[]
}

export function MacroCategoryTabs({ categories }: MacroCategoryTabsProps) {
  const t = useTranslations('espelho.categories')
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const visibleCategories = categories.filter((cat) => cat.skills.length > 0)

  if (visibleCategories.length === 0) {
    return (
      <div>
        <SectionLabel>{t('title')}</SectionLabel>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {t('emptyState')}
        </p>
      </div>
    )
  }

  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), visibleCategories.length - 1)
  const active = visibleCategories[safeActiveIndex]

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    const last = visibleCategories.length - 1
    let next: number | null = null
    if (e.key === 'ArrowRight') next = i < last ? i + 1 : 0
    else if (e.key === 'ArrowLeft') next = i > 0 ? i - 1 : last
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next !== null) {
      e.preventDefault()
      setActiveIndex(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <div>
      <SectionLabel>{t('title')}</SectionLabel>
      <TierLegend />

      {/* Desktop lg+: horizontal tabs */}
      <div className="hidden lg:block">
        <div
          role="tablist"
          className="flex gap-0 border-b mb-4 overflow-x-auto"
          style={{ borderColor: 'var(--border)' }}
        >
          {visibleCategories.map((cat, i) => (
            <button
              key={cat.name}
              ref={(el) => { tabRefs.current[i] = el }}
              role="tab"
              aria-selected={i === safeActiveIndex}
              aria-controls={`tabpanel-${i}`}
              id={`tab-${i}`}
              tabIndex={i === safeActiveIndex ? 0 : -1}
              type="button"
              onClick={() => setActiveIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="shrink-0 px-3.5 py-2.5 min-h-[44px] text-sm font-medium transition-colors duration-200"
              style={{
                color: i === safeActiveIndex ? 'var(--color-primary)' : 'var(--muted-foreground)',
                borderBottom: i === safeActiveIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'transparent',
              }}
            >
              {cat.name}
              {cat.skills.length > 0 && (
                <span
                  className="ml-1.5 text-xs"
                  style={{ color: i === safeActiveIndex ? 'var(--color-primary)' : 'var(--muted-foreground)' }}
                >
                  · {cat.skills.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${safeActiveIndex}`}
          aria-labelledby={`tab-${safeActiveIndex}`}
        >
          {RECRUITER_CONTEXT[active.name] && (
            <p className="text-xs mb-3 opacity-60" style={{ color: 'var(--muted-foreground)' }}>
              {RECRUITER_CONTEXT[active.name]}
            </p>
          )}
          {active.skills.map((skill) => (
            <SkillTierItem
              key={skill.name}
              skill={skill}
              tierLabel={t(`tier.${skill.tier as SkillTier}`)}
            />
          ))}
        </div>
      </div>

      {/* Mobile: accordion */}
      <div className="lg:hidden space-y-2">
        {visibleCategories.map((cat, i) => {
          const isOpen = activeIndex === i
          return (
            <div
              key={cat.name}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`accordion-${i}`}
                id={`accordion-header-${i}`}
                onClick={() => setActiveIndex(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                style={{ background: 'transparent' }}
              >
                <span className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>
                  {cat.name}
                  {cat.skills.length > 0 && (
                    <span className="ml-1.5 font-normal text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      · {cat.skills.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  style={{
                    color: 'var(--muted-foreground)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease-out',
                    flexShrink: 0,
                  }}
                />
              </button>
              {isOpen && (
                <div
                  id={`accordion-${i}`}
                  role="region"
                  aria-labelledby={`accordion-header-${i}`}
                  className="px-4 pb-2"
                >
                  {RECRUITER_CONTEXT[cat.name] && (
                    <p className="text-xs pt-1 pb-2 opacity-60" style={{ color: 'var(--muted-foreground)' }}>
                      {RECRUITER_CONTEXT[cat.name]}
                    </p>
                  )}
                  {cat.skills.map((skill) => (
                    <SkillTierItem
                      key={skill.name}
                      skill={skill}
                      tierLabel={t(`tier.${skill.tier as SkillTier}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
