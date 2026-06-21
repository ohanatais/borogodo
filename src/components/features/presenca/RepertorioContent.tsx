'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DraftListPage } from '@/types/content'
import { PresencaCreate, type PresencaSeedEntry } from '@/components/features/content/PresencaCreate'
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
}: RepertorioContentProps) {
  const t = useTranslations('presenca.page')
  const [preparing, setPreparing] = useState(false)

  return (
    <>
      {!preparing && (
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {t('title')}
            </h1>
            <p className="text-base mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {t('subtitle')}
            </p>
          </div>
          <div className="shrink-0">
            <PresencaCreate themes={themes} entries={entries} />
          </div>
        </header>
      )}

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
