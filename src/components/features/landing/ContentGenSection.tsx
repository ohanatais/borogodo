import { useTranslations } from 'next-intl'
import type { PostComparisonFixture } from '@/types/landing'

const postComparison: PostComparisonFixture = {
  real: 'Três anos atrás, assumi um projeto que ninguém queria. O prazo era impossível, a equipe era nova e o cliente desconfiava de tudo. Entregamos. Aprendi que liderança não é ter as respostas: é sustentar a incerteza enquanto o time encontra o caminho.',
  generic:
    'A liderança eficaz requer comunicação clara, visão estratégica e capacidade de motivar equipes para alcançar resultados excepcionais em ambientes desafiadores.',
}

export function ContentGenSection() {
  const t = useTranslations('contentGen')

  return (
    <section
      style={{ background: 'var(--color-warm)' }}
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
          <strong style={{ fontWeight: 700 }}>Conteúdo que soa </strong>
          <em style={{ fontWeight: 400, fontStyle: 'italic' }}>como você</em>
        </h2>
        <p className="text-base mb-12" style={{ color: 'oklch(35% 0.09 75)' }}>
          {t('subtitle')}
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div
            className="rounded-2xl p-7 md:p-8 flex flex-col"
            style={{
              background: 'var(--card)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
              outline: '2px solid var(--color-accent)',
              outlineOffset: '-2px',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-accent)' }}>
              {t('realLabel')}
            </p>
            <p className="text-base leading-relaxed flex-1" style={{ color: 'var(--foreground)' }}>
              {postComparison.real}
            </p>
          </div>

          <div
            className="rounded-2xl p-7 md:p-8 flex flex-col"
            style={{
              background: 'oklch(68% 0.09 75 / 0.3)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'oklch(35% 0.08 75)' }}>
              {t('genericLabel')}
            </p>
            <p className="text-base leading-relaxed flex-1" style={{ color: 'oklch(38% 0.06 75)' }}>
              {postComparison.generic}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
