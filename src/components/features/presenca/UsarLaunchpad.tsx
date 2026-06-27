'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FileText, UserSquare, MessagesSquare, Target, TrendingUp, FileSignature, ArrowRight } from 'lucide-react'
import type { DraftFormat } from '@/types/content'
import { PREP_MOMENT_ORDER, type PrepMoment } from '@/lib/content/intentions'
import { openPresenca } from '@/components/features/content/presencaEvents'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { PrepararMomento } from './PrepararMomento'

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
 * — MOSTRAR (público: Post, Bio) e PREPARAR (privado: entrevista, review, salário) — agora numa
 * linguagem de card única: a mesma "zona de ação" tintada do convite no Painel. Os cards de MOSTRAR
 * disparam a geração com o tema de força principal; os de PREPARAR abrem a bifurcação pronto/conversar.
 * Reusa o motor existente via `openPresenca`/chat — nada de motor novo.
 */
export function UsarLaunchpad({ themes, onPreparingChange, hub, hideLabel = false }: UsarLaunchpadProps) {
  const t = useTranslations('repertorio')
  const [selectedMoment, setSelectedMoment] = useState<PrepMoment | null>(null)
  const [bioFocusOpen, setBioFocusOpen] = useState(false)
  const [restoreFocusMoment, setRestoreFocusMoment] = useState<PrepMoment | null>(null)
  const momentCardRefs = useRef<Partial<Record<PrepMoment, HTMLButtonElement | null>>>({})
  const primaryTheme = themes[0] ?? null

  // Mantém o pai em sincronia: preparando um momento = esconder "Meus rascunhos" (outro fluxo).
  useEffect(() => {
    onPreparingChange?.(selectedMoment !== null)
  }, [selectedMoment, onPreparingChange])

  // Ao sair da preparação, o card que abriu a tela já desmontou e remonta aqui — devolve o foco a ele
  // pra não jogar o teclado/leitor de tela de volta ao topo do documento.
  useEffect(() => {
    if (selectedMoment === null && restoreFocusMoment) {
      momentCardRefs.current[restoreFocusMoment]?.focus()
      // Reset one-shot do flag após restaurar o foco: é exatamente sincronizar foco (sistema externo)
      // e limpar o gatilho, não um loop de render. Por isso o disable pontual da regra.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRestoreFocusMoment(null)
    }
  }, [selectedMoment, restoreFocusMoment])

  if (selectedMoment) {
    return (
      <PrepararMomento
        moment={selectedMoment}
        themeRef={primaryTheme}
        onBack={() => {
          setRestoreFocusMoment(selectedMoment)
          setSelectedMoment(null)
        }}
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

  // Bio: a pessoa escolhe o foco antes de gerar (a evidência já é ampla — o foco é o enquadramento,
  // não um recorte). "Geral" não fixa tema; um tema dá o ângulo. Sempre mini-bio (formato LinkedIn).
  function generateBio(seedRef: string, seedSummary: string, angle: string) {
    openPresenca({ seedType: 'theme', seedRef, seedSummary, formats: ['mini_bio'], angle })
    setBioFocusOpen(false)
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
            onClick={() => setBioFocusOpen((o) => !o)}
          />
        </div>

        {/* Seletor de foco da bio (021): aparece ao clicar em Bio. "Geral" = trajetória inteira;
            cada tema dá um ângulo. A bio é sempre formato LinkedIn (o prompt já mira o "Sobre"). */}
        {bioFocusOpen && primaryTheme && (
          <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
              {t('bioFocus.title')}
            </p>
            <div className="flex flex-wrap gap-2">
              <BioFocusChip
                label={t('bioFocus.geral')}
                onClick={() => generateBio(primaryTheme, t('bioFocus.geral'), 'visão geral da trajetória profissional, sem fixar num único tema')}
              />
              {themes.map((theme) => (
                <BioFocusChip key={theme} label={theme} onClick={() => generateBio(theme, theme, theme)} />
              ))}
            </div>
          </div>
        )}
      </section>
      )}

      {/* Hub PREPARAR */}
      {showPreparar && (
      <section id="preparar" aria-label={t('hubs.preparar.title')}>
        {!hideLabel && <SectionLabel>{t('hubs.preparar.title')}</SectionLabel>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PREP_MOMENT_ORDER.map((moment) => (
            <ActionCard
              key={moment}
              buttonRef={(el) => {
                momentCardRefs.current[moment] = el
              }}
              icon={MOMENT_ICON[moment]}
              label={t(`moments.${moment}`)}
              onClick={() => setSelectedMoment(moment)}
            />
          ))}
          {/* Autoavaliação: superfície de escrita própria (página inteira), não um momento com
              bifurcação pronto/conversar. Vive aqui pra continuar acessível depois que "Usar" passou
              a rotear o Preparo pra este hub (021) — senão ficaria órfã. */}
          <LinkCard
            href="/autoavaliacao"
            icon={<FileSignature size={18} aria-hidden="true" />}
            label={t('moments.autoavaliacao')}
          />
        </div>
      </section>
      )}
    </div>
  )
}

/** Chip de foco da bio: "Geral" + cada tema de força. Mesma família visual dos filtros do hub. */
function BioFocusChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center text-sm font-medium px-3 min-h-9 rounded-full border transition-colors hover:opacity-80"
      style={{ background: 'var(--color-lilas-nevoa)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
    >
      {label}
    </button>
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
  /** Permite ao pai capturar o nó do botão (ex.: devolver foco ao voltar da preparação). */
  buttonRef?: (el: HTMLButtonElement | null) => void
}

/** Card de ação único — tintado (lilás-névoa), borda e título em primary, com micro-interação no
 *  hover (sobe 1px, seta desliza). Mesma linguagem dos dois hubs e do convite no Painel. */
function ActionCard({ icon, label, disabled = false, onClick, buttonRef }: ActionCardProps) {
  return (
    <button
      ref={buttonRef}
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

interface LinkCardProps {
  href: string
  icon: ReactNode
  label: string
}

/** Mesma linguagem visual do ActionCard, mas navega (é uma página própria, não uma ação local). */
function LinkCard({ href, icon, label }: LinkCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-xl border px-4 py-3 min-h-[56px] text-left transition-all hover:shadow-sm hover:-translate-y-px"
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
    </Link>
  )
}
