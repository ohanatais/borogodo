'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DraftFormat } from '@/types/content'
import { openPresenca, type PresencaOpenDetail } from './presencaEvents'

export interface PresencaSeedEntry {
  id: string
  whatIDid: string
}

interface PresencaCreateProps {
  themes: string[]
  entries: PresencaSeedEntry[]
  /** Variante visual do gatilho: botão sólido (cabeçalho) ou link discreto (empty state). */
  variant?: 'solid' | 'subtle'
}

const THEME_FORMATS: DraftFormat[] = ['post']
const ENTRY_FORMATS: DraftFormat[] = ['post', 'impact_summary']

/**
 * Ponto de geração dentro da Presença: deixa a pessoa começar um rascunho a partir de uma evidência
 * sua (um tema do espelho ou uma entrada) sem sair do hub. Não é uma página em branco — reusa o
 * mesmo motor da 013 disparando `openPresenca`, que o GenerateSheet (montado no AppShell) escuta.
 */
export function PresencaCreate({ themes, entries, variant = 'solid' }: PresencaCreateProps) {
  const t = useTranslations('presenca')
  const [open, setOpen] = useState(false)
  const hasSeeds = themes.length > 0 || entries.length > 0

  function choose(detail: PresencaOpenDetail) {
    setOpen(false)
    openPresenca(detail)
  }

  const trigger =
    variant === 'solid' ? (
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
      >
        <Sparkles size={16} aria-hidden="true" />
        {t('create.open')}
      </button>
    ) : (
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-opacity hover:opacity-80"
        style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
      >
        <Sparkles size={16} aria-hidden="true" />
        {t('create.open')}
      </button>
    )

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: 'oklch(18% 0.02 260 / 0.4)', backdropFilter: 'blur(2px)' }}
        />
        <Dialog.Content
          className="fixed z-50 flex flex-col focus:outline-none overflow-hidden
            bottom-0 left-0 right-0 rounded-t-[20px] max-h-[85dvh]
            lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:right-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[480px] lg:rounded-2xl lg:max-h-[80vh]"
          style={{ background: 'var(--color-creme)', boxShadow: '0 8px 40px oklch(18% 0.02 260 / 0.25)' }}
        >
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {t('create.title')}
              </Dialog.Title>
              <Dialog.Description className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {t('create.hint')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('close')}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 min-h-0">
            {!hasSeeds && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {t('create.empty')}
                </p>
                <Link
                  href="/painel"
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-primary)' }}
                >
                  {t('create.goRegister')}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}

            {themes.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  {t('create.themesLabel')}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <li key={theme}>
                      <button
                        type="button"
                        onClick={() => choose({ seedType: 'theme', seedRef: theme, seedSummary: theme, formats: THEME_FORMATS })}
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-opacity hover:opacity-80"
                        style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        <Sparkles size={13} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                        {theme}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {entries.length > 0 && (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                  {t('create.entriesLabel')}
                </h3>
                <ul className="flex flex-col gap-2">
                  {entries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() =>
                          choose({ seedType: 'entry', seedRef: entry.id, seedSummary: entry.whatIDid, formats: ENTRY_FORMATS })
                        }
                        className="flex w-full items-center gap-3 text-left rounded-xl px-3 py-3 border transition-opacity hover:opacity-80"
                        style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      >
                        <span className="flex-1 text-sm line-clamp-2">{entry.whatIDid}</span>
                        <ArrowRight size={16} aria-hidden="true" style={{ color: 'var(--color-primary)' }} className="shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
