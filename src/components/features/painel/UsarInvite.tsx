import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FileText, Sparkles, ArrowRight } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'

/**
 * Convite do Painel ao Repertório (017). A descoberta da camada "Usar" não se apoia na palavra do
 * menu: aqui, na primeira visão, a pessoa vê os dois gatilhos em frase de ação + exemplos concretos
 * e cai direto na seção certa. Presentacional — a escolha do gatilho específico acontece no
 * launchpad. Renderizado só quando há histórico (o pai decide).
 */
export function UsarInvite() {
  const t = useTranslations('repertorio')

  const cards = [
    {
      href: '/presenca#mostrar',
      icon: <FileText size={18} aria-hidden="true" />,
      title: t('hubs.mostrar.title'),
      examples: t('hubs.mostrar.examples'),
    },
    {
      href: '/presenca#preparar',
      icon: <Sparkles size={18} aria-hidden="true" />,
      title: t('hubs.preparar.title'),
      examples: t('hubs.preparar.examples'),
    },
  ]

  return (
    <section aria-label={t('invite.title')}>
      <SectionLabel className="px-4">{t('invite.title')}</SectionLabel>
      <div className="grid gap-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex items-start gap-3 px-4 py-3 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-px"
            style={{ borderColor: 'var(--color-primary)', background: 'var(--color-lilas-nevoa)' }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }}>
              {card.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                {card.title}
              </span>
              <span className="block text-xs leading-snug" style={{ color: 'var(--color-lilas-nevoa-text)' }}>
                {card.examples}
              </span>
            </span>
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--color-primary)' }}
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
