'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { MacroCategory, SkillTier } from '@/types/mirror'
import { SkillTierItem } from './SkillTierItem'

interface MacroCategoryTabsProps {
  categories: MacroCategory[]
}

export function MacroCategoryTabs({ categories }: MacroCategoryTabsProps) {
  const t = useTranslations('espelho.categories')
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (categories.length === 0) return null

  const active = categories[activeIndex]

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    const last = categories.length - 1
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
              ref={(el) => { tabRefs.current[i] = el }}
              role="tab"
              aria-selected={i === activeIndex}
              aria-controls={`tabpanel-${i}`}
              id={`tab-${i}`}
              tabIndex={i === activeIndex ? 0 : -1}
              type="button"
              onClick={() => setActiveIndex(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="shrink-0 px-4 min-h-[44px] text-sm font-medium transition-colors"
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
