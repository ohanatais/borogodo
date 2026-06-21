'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, UserSquare, MessagesSquare, Target, TrendingUp, ArrowRight } from 'lucide-react'
import type { DraftFormat } from '@/types/content'
import { PREP_MOMENT_ORDER, type PrepMoment } from '@/lib/content/intentions'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { PrepararMomento } from './PrepararMomento'

interface UsarLaunchpadProps {
  /** Temas de força do Espelho — seed das gerações rápidas e âncora dos momentos. */
  themes: string[]
  /**
   * Avisa o pai quando entra/sai do fluxo de preparação de um momento (bifurcação). O pai usa isso
   * pra esconder "Meus rascunhos" — preparar um momento é outro fluxo, a lista de rascunhos só ruído.
   */
  onPreparingChange?: (preparing: boolean) => void
}

/** Ícone distinto por momento — âncora visual pra escanear, não um Sparkles genérico repetido. */
const MOMENT_ICON: Record<PrepMoment, ReactNode> = {
  entrevista: <MessagesSquare size={18} aria-hidden="true" />,
  review: <Target size={18} aria-hidden="true" />,
  salario: <TrendingUp size={18} aria-hidden="true" />,
}

/**
 * Launchpad do Repertório (017): organiza a camada "Usar" por intenção, não por formato. Dois hubs
 * — MOSTRAR (público: Post, Bio) e PREPARAR (privado: entrevista, review, salário) — agora numa
 * linguagem de card única: a mesma "zona de ação" tintada do convite no Painel. Os cards de MOSTRAR
 * disparam a geração com o tema de força principal; os de PREPARAR abrem a bifurcação pronto/conversar.
 * Reusa o motor existente via `openPresenca`/chat — nada de motor novo.
 */
export function UsarLaunchpad({ themes, onPreparingChange }: UsarLaunchpadProps) {
  const t = useTranslations('repertorio')
  const [selectedMoment, setSelectedMoment] = useState<PrepMoment | null>(null)
  const primaryTheme = themes[0] ?? null

  // Mantém o pai em sincronia: preparando um momento = esconder "Meus rascunhos" (outro fluxo).
  useEffect(() => {
    onPreparingChange?.(selectedMoment !== null)
  }, [selectedMoment, onPreparingChange])

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
    <div className="flex flex-col gap-6">
      {/* Hub MOSTRAR */}
      <section id="mostrar" aria-label={t('hubs.mostrar.title')}>
        <SectionLabel>{t('hubs.mostrar.title')}</SectionLabel>
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
      <section id="preparar" aria-label={t('hubs.preparar.title')}>
        <SectionLabel>{t('hubs.preparar.title')}</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PREP_MOMENT_ORDER.map((moment) => (
            <ActionCard
              key={moment}
              icon={MOMENT_ICON[moment]}
              label={t(`moments.${moment}`)}
              onClick={() => setSelectedMoment(moment)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function NoThemeHint({ text }: { text: string }) {
  return (
    <p className="text-sm rounded-lg p-3 mb-3" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
      {text}
    </p>
  )
}

interface ActionCardProps {
  icon: ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}

/** Card de ação único — tintado (lilás-névoa), borda e título em primary, com micro-interação no
 *  hover (sobe 1px, seta desliza). Mesma linguagem dos dois hubs e do convite no Painel. */
function ActionCard({ icon, label, disabled = false, onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-2.5 rounded-xl border px-4 py-3 min-h-[56px] text-left transition-all hover:shadow-sm hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      style={{ background: 'var(--color-lilas-nevoa)', borderColor: 'var(--color-primary)' }}
    >
      <span className="shrink-0" style={{ color: 'var(--color-primary)' }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
        {label}
      </span>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-0.5"
        style={{ color: 'var(--color-primary)' }}
      />
    </button>
  )
}
