'use client'

import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
    <div>
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--muted-foreground)' }}>
        {t('title')}
      </p>

      {/* Desktop lg+: horizontal tabs */}
      <div className="hidden lg:block">
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
              className="shrink-0 px-3.5 py-2.5 min-h-[44px] text-sm font-medium transition-colors duration-200"
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
                  className="ml-1.5 text-xs"
                  style={{ color: i === activeIndex ? 'var(--color-primary)' : 'var(--muted-foreground)', opacity: 0.7 }}
                >
                  · {cat.skills.length}
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

      {/* Mobile: accordion */}
      <div className="lg:hidden space-y-2">
        {categories.map((cat, i) => {
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
