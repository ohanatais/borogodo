import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PanelMirror } from '@/lib/panel/getPanelData'
import type { SkillTier } from '@/types/mirror'

interface SuasForcasProps {
  mirror: PanelMirror | null
}

/**
 * Resumo das competências por estágio. Os nomes e detalhes vivem no Espelho, evitando duplicar
 * toda a leitura no Painel.
 */
export function SuasForcas({ mirror }: SuasForcasProps) {
  const t = useTranslations('painel.suasForcas')
  const skills = mirror?.skills ?? []

  if (!mirror) return null

  const tierColor: Record<SkillTier, string> = {
    Comprovada: 'oklch(62% 0.16 145)',
    Consistente: 'oklch(72% 0.16 80)',
    Emergente: 'oklch(68% 0.14 250)',
  }
  const tiers: SkillTier[] = ['Comprovada', 'Consistente', 'Emergente']
  const grouped = tiers.map((tier) => ({ tier, skills: skills.filter((skill) => skill.tier === tier) }))
  const total = skills.length
  const provenCount = grouped.find(({ tier }) => tier === 'Comprovada')?.skills.length ?? 0

  return (
    <section aria-label={t('title')}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
        >
          {t('title')}
        </h2>
        <Link
          href="/espelho"
          className="group inline-flex items-center gap-1 text-sm font-medium shrink-0 transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('viewMirror')}
          <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div
        aria-label={t('statusLabel')}
        className="rounded-xl border px-5 py-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
          <p className="mb-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {provenCount > 0
              ? t('proofSummary', { proven: provenCount, total })
              : t('formingSummary')}
          </p>
          <div
            className="flex h-2 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--muted)' }}
            role="img"
            aria-label={grouped.map(({ tier, skills: tierSkills }) => t('tierCount', { tier: t(`tiers.${tier}`), count: tierSkills.length })).join(', ')}
          >
            {grouped.map(({ tier, skills: tierSkills }) => tierSkills.length > 0 && (
              <span
                key={tier}
                style={{ width: `${(tierSkills.length / total) * 100}%`, background: tierColor[tier] }}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            {grouped.map(({ tier, skills: tierSkills }) => (
              <div key={tier} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tierColor[tier] }} aria-hidden="true" />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{t(`tiers.${tier}`)}</span>
                  <span style={{ color: 'var(--muted-foreground)' }}>{tierSkills.length}</span>
              </div>
            ))}
          </div>
      </div>
    </section>
  )
}
