'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DraftListPage } from '@/types/content'
import type { PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
import { UsarLaunchpad } from './UsarLaunchpad'
import { PresencaHub } from './PresencaHub'

interface RepertorioContentProps {
  themes: string[]
  initialPage: DraftListPage
  hasAnyDrafts: boolean
  entries: PresencaSeedEntry[]
  suggestRecalibration: boolean
  recalibrateSignalKey: string | null
}

/**
 * Corpo cliente do Repertório: o launchpad e a lista "Meus rascunhos" coordenados. Quando a pessoa
 * entra na bifurcação de um momento (preparar), "Meus rascunhos" some — é outro fluxo, e a lista de
 * rascunhos ali embaixo só competiria com a decisão pronto/conversar. Volta ao sair da preparação.
 */
export function RepertorioContent({
  themes,
  initialPage,
  hasAnyDrafts,
  entries,
  suggestRecalibration,
  recalibrateSignalKey,
}: RepertorioContentProps) {
  const t = useTranslations('presenca.page')
  const [preparing, setPreparing] = useState(false)

  return (
    <>
      <UsarLaunchpad themes={themes} onPreparingChange={setPreparing} />

      {!preparing && (
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
