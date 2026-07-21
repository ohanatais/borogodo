'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DraftListPage } from '@/types/content'
import { PresencaCreate, type PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
import { UsarLaunchpad, type LaunchpadHub } from './UsarLaunchpad'
import { PresencaHub } from './PresencaHub'
import { PageHeader } from '@/components/layout/PageHeader'
import { SavedPreparations } from './SavedPreparations'
import type { Preparation } from '@/types/preparation'

interface RepertorioContentProps {
  themes: string[]
  initialPage: DraftListPage
  hasAnyDrafts: boolean
  entries: PresencaSeedEntry[]
  suggestRecalibration: boolean
  recalibrateSignalKey: string | null
  /** Escopo vindo do splash de intenção (`?hub=`): mostra só um hub. Ver UsarLaunchpad. */
  hub?: LaunchpadHub
  initialPreparations?: Preparation[]
}

/**
 * Corpo cliente do Repertório: o cabeçalho da seção, o launchpad e a lista "Meus rascunhos"
 * coordenados. Quando a pessoa entra na bifurcação de um momento (preparar), o cabeçalho primário
 * (título + apoio + "Gerar conteúdo") e "Meus rascunhos" somem — é outro fluxo, com seu próprio
 * título e foco, e o conteúdo da tela primária ali só competiria com a decisão pronto/conversar.
 * Tudo volta ao sair da preparação.
 */
export function RepertorioContent({
  themes,
  initialPage,
  hasAnyDrafts,
  entries,
  suggestRecalibration,
  recalibrateSignalKey,
  hub,
  initialPreparations = [],
}: RepertorioContentProps) {
  const t = useTranslations('presenca.page')
  const tr = useTranslations('repertorio')
  const [preparing, setPreparing] = useState(false)

  // "Meus rascunhos" e "Gerar conteúdo" são saída do hub MOSTRAR (posts/bios). No hub PREPARAR
  // (escolha do splash), eles só competiriam com a decisão do momento — somem (021).
  const showDrafts = hub !== 'preparar'

  // Escopado pelo splash: o título passa a ser o do hub escolhido (não o genérico "Repertório",
  // que cita os dois caminhos). O SectionLabel do launchpad some — o header já nomeia a vista.
  const title = hub ? tr(`hubs.${hub}.title`) : t('title')
  const subtitle = hub ? tr(`hubs.${hub}.examples`) : t('subtitle')

  return (
    <>
      {!preparing && hub && (
        <Link
          href="/usar"
          className="hidden items-center gap-1.5 text-sm mb-4 transition-opacity hover:opacity-70 lg:inline-flex"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t('backToUsar')}
        </Link>
      )}

      {!preparing && (
        <PageHeader
          title={title}
          description={subtitle}
          className="mb-6"
          actions={showDrafts ? <PresencaCreate themes={themes} entries={entries} /> : undefined}
        />
      )}

      <UsarLaunchpad themes={themes} onPreparingChange={setPreparing} hub={hub} hideLabel={!!hub} />

      {!preparing && hub === 'preparar' && <SavedPreparations initialPreparations={initialPreparations} />}

      {!preparing && showDrafts && (
        <section className="mt-10">
          <h2
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {t('myDrafts')}
          </h2>
          <PresencaHub
            initialPage={initialPage}
            hasAnyDrafts={hasAnyDrafts}
            themes={themes}
            entries={entries}
            suggestRecalibration={suggestRecalibration}
            recalibrateSignalKey={recalibrateSignalKey}
          />
        </section>
      )}
    </>
  )
}
