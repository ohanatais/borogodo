import { useTranslations } from 'next-intl'
import type { MirrorInsightFixture } from '@/types/landing'

const mirrorInsight: MirrorInsightFixture = {
  pattern: 'Você lidera melhor em contextos de incerteza',
  evidence: [
    '3 projetos de crise entregues no prazo',
    '2 reestruturações de equipe bem-sucedidas',
    'Menção a "calma sob pressão" em 4 feedbacks',
  ],
  insight:
    'Seu diferencial não é a execução perfeita: é a capacidade de manter o time coeso quando tudo parece incerto.',
}

export function MirrorMockup() {
  const t = useTranslations('mirror')

  return (
    <section
      style={{ background: 'var(--color-lilas-nevoa)' }}
      className="px-6 py-20 md:py-28"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[44%_56%] gap-16 items-center">

          {/* Left: heading + subtitle */}
          <div>
            <h2
              className="text-2xl md:text-3xl mb-4"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--foreground)',
                lineHeight: 1.2,
                letterSpacing: '-0.015em',
              }}
            >
              <strong style={{ fontWeight: 700 }}>Seu espelho </strong>
              <em style={{ fontWeight: 400, fontStyle: 'italic' }}>profissional</em>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              {t('subtitle')}
            </p>
          </div>

          {/* Right: sample insight card */}
          <div
            className="rounded-2xl p-8 md:p-10"
            style={{ background: 'var(--card)', boxShadow: '0 8px 40px oklch(70% 0.06 320 / 0.18)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {t('patternLabel')}
            </p>
            <p className="text-xl font-semibold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {mirrorInsight.pattern}
            </p>

            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {t('evidenceLabel')}
            </p>
            <ul className="space-y-2 mb-6">
              {mirrorInsight.evidence.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span style={{ color: 'var(--color-accent)' }}>·</span>
                  {item}
                </li>
              ))}
            </ul>

            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--secondary)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {t('insightLabel')}
              </p>
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--foreground)' }}>
                {mirrorInsight.insight}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
