'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, MessagesSquare, Target, TrendingUp, ArrowRight } from 'lucide-react'
import type { DraftFormat } from '@/types/content'
import { PREP_MOMENT_ORDER, type PrepMoment } from '@/lib/content/intentions'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { openChatSheet } from '@/components/features/chat/ChatSheet'
import { trackPreparationEvent } from '@/lib/preparation/trackPreparationEvent'
import { SectionLabel } from '@/components/ui/SectionLabel'

/** Hub ativo. `undefined` = ambos (acesso direto a /presenca); o splash /usar escopa via `?hub=`. */
export type LaunchpadHub = 'mostrar' | 'preparar'

interface UsarLaunchpadProps {
  /** Temas de força do Espelho — seed das gerações rápidas e âncora dos momentos. */
  themes: string[]
  /**
   * Avisa o pai quando entra/sai do fluxo de preparação de um momento (bifurcação). O pai usa isso
   * pra esconder "Meus rascunhos" — preparar um momento é outro fluxo, a lista de rascunhos só ruído.
   */
  onPreparingChange?: (preparing: boolean) => void
  /**
   * Escopa a vista a um único hub. Vem do splash de intenção (`/presenca?hub=`): quem escolheu
   * "Conteúdo" vê só MOSTRAR; quem escolheu "Preparo" vê só PREPARAR — não os dois (021).
   */
  hub?: LaunchpadHub
  /** Esconde o SectionLabel de cada hub — usado quando o header do pai já nomeia a vista (escopada). */
  hideLabel?: boolean
}

/** Ícone distinto por momento — âncora visual pra escanear, não um Sparkles genérico repetido. */
const MOMENT_ICON: Record<PrepMoment, ReactNode> = {
  entrevista: <MessagesSquare size={18} aria-hidden="true" />,
  review: <Target size={18} aria-hidden="true" />,
  salario: <TrendingUp size={18} aria-hidden="true" />,
}

/**
 * Launchpad do Repertório (017): organiza a camada "Usar" por intenção, não por formato. Dois hubs
 * — MOSTRAR (público: Post) e PREPARAR (privado: entrevista, review, salário) — agora numa
 * linguagem de card única: a mesma "zona de ação" tintada do convite no Painel. Os cards de MOSTRAR
 * disparam a geração com o tema de força principal; os de PREPARAR abrem a bifurcação pronto/conversar.
 * Reusa o motor existente via `openPresenca`/chat — nada de motor novo.
 */
export function UsarLaunchpad({ themes, onPreparingChange, hub, hideLabel = false }: UsarLaunchpadProps) {
  const t = useTranslations('repertorio')
  const primaryTheme = themes[0] ?? null

  void onPreparingChange

  function show(format: DraftFormat) {
    if (!primaryTheme) return
    openPresenca({
      seedType: 'theme',
      seedRef: primaryTheme,
      seedSummary: primaryTheme,
      formats: [format],
    })
  }

  const showMostrar = hub !== 'preparar'
  const showPreparar = hub !== 'mostrar'

  return (
    <div className="flex flex-col gap-6">
      {/* Hub MOSTRAR */}
      {showMostrar && (
      <section id="mostrar" aria-label={t('hubs.mostrar.title')}>
        {!hideLabel && <SectionLabel>{t('hubs.mostrar.title')}</SectionLabel>}
        {!primaryTheme && <NoThemeHint text={t('prepare.noTheme')} />}
        <div className="grid grid-cols-1 gap-3 sm:max-w-sm">
          <ActionCard
            icon={<FileText size={18} aria-hidden="true" />}
            label={t('cards.post')}
            disabled={!primaryTheme}
            onClick={() => show('post')}
          />
        </div>
      </section>
      )}

      {/* Hub PREPARAR */}
      {showPreparar && (
      <section id="preparar" aria-label={t('hubs.preparar.title')}>
        {!hideLabel && <SectionLabel>{t('hubs.preparar.title')}</SectionLabel>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PREP_MOMENT_ORDER.map((moment) => (
            <ActionCard
              key={moment}
              icon={MOMENT_ICON[moment]}
              label={t(`moments.${moment}`)}
              description={t(`momentDescriptions.${moment}`)}
              onClick={() => {
                trackPreparationEvent('moment_selected', moment)
                openChatSheet({ context: { type: 'preparacao', moment } })
              }}
            />
          ))}
        </div>
      </section>
      )}
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
  description?: string
  disabled?: boolean
  onClick: () => void
  /** Permite ao pai capturar o nó do botão (ex.: devolver foco ao voltar da preparação). */
  buttonRef?: (el: HTMLButtonElement | null) => void
}

/** Card de ação único — tintado (lilás-névoa), borda e título em primary, com micro-interação no
 *  hover (sobe 1px, seta desliza). Mesma linguagem dos dois hubs e do convite no Painel. */
function ActionCard({ icon, label, description, disabled = false, onClick, buttonRef }: ActionCardProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-3 rounded-xl border px-4 py-4 min-h-[72px] text-left transition-all hover:shadow-sm hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <span className="shrink-0" style={{ color: 'var(--color-primary)' }}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{description}</span>}
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
