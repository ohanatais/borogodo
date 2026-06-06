import { useTranslations } from 'next-intl'
import type { CareerMapFixture } from '@/types/landing'

const clusterColors = [
  { bg: 'oklch(92% 0.04 320)', dot: 'var(--color-primary)' },
  { bg: 'oklch(94% 0.05 28)',  dot: 'var(--color-accent)' },
  { bg: 'oklch(90% 0.05 190)', dot: 'oklch(45% 0.12 190)' },
]

const careerMap: CareerMapFixture = {
  profileLabel: 'Líder técnica com viés estratégico',
  clusters: [
    { label: 'Liderança', skills: ['gestão de crise', 'formação de times', 'feedback difícil'] },
    { label: 'Produto',   skills: ['roadmap', 'discovery', 'métricas'] },
    { label: 'Comunicação', skills: ['narrativa', 'apresentação executiva', 'escrita'] },
  ],
  timeline: [
    { year: '2019', label: 'Analista → Líder técnica' },
    { year: '2021', label: 'Gerente de produto' },
    { year: '2024', label: 'Head de produto' },
  ],
}

export function CareerMapMockup() {
  const t = useTranslations('careerMap')

  return (
    <section
      style={{ background: 'var(--color-teal)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-2xl md:text-3xl mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--foreground)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          <strong style={{ fontWeight: 700 }}>Mapa </strong>
          <em style={{ fontWeight: 400, fontStyle: 'italic' }}>da sua carreira</em>
        </h2>
        <p className="text-base mb-12" style={{ color: 'oklch(30% 0.08 190)' }}>
          {t('subtitle')}
        </p>

        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: 'var(--card)', boxShadow: '0 4px 40px oklch(55% 0.10 190 / 0.20)' }}
        >
          {/* Profile badge */}
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {careerMap.profileLabel}
          </span>

          {/* Competency clusters */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--muted-foreground)' }}>
            {t('clustersLabel')}
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            {careerMap.clusters.map((cluster, ci) => (
              <div
                key={cluster.label}
                className="rounded-xl px-4 py-3 min-w-[140px]"
                style={{ background: clusterColors[ci].bg }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: clusterColors[ci].dot }}
                  />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {cluster.label}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'oklch(100% 0 0 / 0.6)', color: 'var(--foreground)' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Horizontal timeline */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {t('timelineLabel')}
          </p>
          <div className="relative">
            {/* Connecting line — from center of first node to center of last */}
            <div
              className="absolute"
              style={{
                top: 9,
                left: 'calc(100% / 6)',
                right: 'calc(100% / 6)',
                height: 1,
                background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-primary) 100%)`,
              }}
            />
            <div className="flex justify-between relative">
              {careerMap.timeline.map((entry) => (
                <div key={entry.year} className="flex flex-col items-center gap-2" style={{ flex: '1 1 0', maxWidth: '33%' }}>
                  <div
                    className="w-[18px] h-[18px] rounded-full border-2 relative z-10"
                    style={{ background: 'var(--card)', borderColor: 'var(--color-accent)' }}
                  />
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {entry.year}
                  </span>
                  <span
                    className="text-xs text-center leading-snug"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {entry.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
