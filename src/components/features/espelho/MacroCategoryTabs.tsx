'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { MacroCategory, SkillTier } from '@/types/mirror'
import { SkillTierItem } from './SkillTierItem'

interface MacroCategoryTabsProps {
  categories: MacroCategory[]
}

export function MacroCategoryTabs({ categories }: MacroCategoryTabsProps) {
  const t = useTranslations('espelho.categories')
  const [activeIndex, setActiveIndex] = useState(0)

  if (categories.length === 0) return null

  const active = categories[activeIndex]

  return (
    <div className="mt-8">
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {t('title')}
      </p>

      {/* Desktop: abas horizontais */}
      <div className="hidden md:block">
        <div
          role="tablist"
          className="flex gap-0 border-b mb-4 overflow-x-auto"
          style={{ borderColor: 'var(--border)' }}
        >
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              role="tab"
              aria-selected={i === activeIndex}
              aria-controls={`tabpanel-${i}`}
              id={`tab-${i}`}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="shrink-0 px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: i === activeIndex ? 'var(--color-primary)' : 'var(--muted-foreground)',
                borderBottom: i === activeIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'transparent',
              }}
            >
              {cat.name}
              {cat.skills.length > 0 && (
                <span
                  className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                  style={{
                    background: i === activeIndex ? 'var(--color-primary)' : 'var(--border)',
                    color: i === activeIndex ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
                  }}
                >
                  {cat.skills.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`tabpanel-${activeIndex}`}
          aria-labelledby={`tab-${activeIndex}`}
        >
          {active.skills.map((skill) => (
            <SkillTierItem
              key={skill.name}
              skill={skill}
              tierLabel={t(`tier.${skill.tier as SkillTier}`)}
            />
          ))}
        </div>
      </div>

      {/* Mobile: accordion nativo */}
      <div className="md:hidden space-y-2">
        {categories.map((cat) => (
          <details
            key={cat.name}
            className="rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          >
            <summary
              className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium select-none list-none"
              style={{ color: 'var(--foreground)' }}
            >
              <span>
                {cat.name}
                {cat.skills.length > 0 && (
                  <span
                    className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                    style={{ background: 'var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    {cat.skills.length}
                  </span>
                )}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                ›
              </span>
            </summary>
            <div className="px-4 pb-3">
              {cat.skills.map((skill) => (
                <SkillTierItem
                  key={skill.name}
                  skill={skill}
                  tierLabel={t(`tier.${skill.tier as SkillTier}`)}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
