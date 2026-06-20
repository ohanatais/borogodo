'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, FileText, UserSquare, ArrowRight } from 'lucide-react'
import type { DraftFormat } from '@/types/content'
import { PREP_MOMENT_ORDER, type PrepMoment } from '@/lib/content/intentions'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { PrepararMomento } from './PrepararMomento'

interface UsarLaunchpadProps {
  /** Temas de força do Espelho — seed das gerações rápidas e âncora dos momentos. */
  themes: string[]
}

/**
 * Launchpad do Repertório (017): organiza a camada "Usar" por intenção, não por formato. Dois hubs
 * — MOSTRAR (público: Post, Bio) e PREPARAR (privado: entrevista, review, salário). Os cards de
 * MOSTRAR disparam a geração com o tema de força principal; os de PREPARAR abrem a bifurcação
 * pronto/conversar. Reusa o motor existente via `openPresenca`/chat — nada de motor novo.
 */
export function UsarLaunchpad({ themes }: UsarLaunchpadProps) {
  const t = useTranslations('repertorio')
  const [selectedMoment, setSelectedMoment] = useState<PrepMoment | null>(null)
  const primaryTheme = themes[0] ?? null

  if (selectedMoment) {
    return (
      <PrepararMomento
        moment={selectedMoment}
        themeRef={primaryTheme}
        onBack={() => setSelectedMoment(null)}
      />
    )
  }

  function show(format: DraftFormat) {
    if (!primaryTheme) return
    openPresenca({
      seedType: 'theme',
      seedRef: primaryTheme,
      seedSummary: primaryTheme,
      formats: [format],
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Hub MOSTRAR */}
      <section id="mostrar" className="flex flex-col gap-3" aria-label={t('hubs.mostrar.title')}>
        <HubHeading title={t('hubs.mostrar.title')} examples={t('hubs.mostrar.examples')} />
        {!primaryTheme && <NoThemeHint text={t('prepare.noTheme')} />}
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            icon={<FileText size={18} aria-hidden="true" />}
            label={t('cards.post')}
            disabled={!primaryTheme}
            onClick={() => show('post')}
          />
          <ActionCard
            icon={<UserSquare size={18} aria-hidden="true" />}
            label={t('cards.bio')}
            disabled={!primaryTheme}
            onClick={() => show('mini_bio')}
          />
        </div>
      </section>

      {/* Hub PREPARAR */}
      <section id="preparar" className="flex flex-col gap-3" aria-label={t('hubs.preparar.title')}>
        <HubHeading title={t('hubs.preparar.title')} examples={t('hubs.preparar.examples')} />
        <div className="flex flex-col gap-2">
          {PREP_MOMENT_ORDER.map((moment) => (
            <button
              key={moment}
              type="button"
              onClick={() => setSelectedMoment(moment)}
              className="flex items-center gap-3 text-left rounded-xl px-4 py-3 min-h-[48px] border transition-opacity hover:opacity-80"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Sparkles size={16} aria-hidden="true" style={{ color: 'var(--color-primary)' }} className="shrink-0" />
              <span className="flex-1 text-sm font-medium">{t(`moments.${moment}`)}</span>
              <ArrowRight size={16} aria-hidden="true" style={{ color: 'var(--color-primary)' }} className="shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function HubHeading({ title, examples }: { title: string; examples: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        {title}
      </h2>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {examples}
      </p>
    </div>
  )
}

function NoThemeHint({ text }: { text: string }) {
  return (
    <p className="text-sm rounded-lg p-3" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
      {text}
    </p>
  )
}

interface ActionCardProps {
  icon: React.ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}

function ActionCard({ icon, label, disabled = false, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-2 rounded-xl p-4 min-h-[48px] border transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
    >
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
