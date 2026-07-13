'use client'

import { UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RegistroTrigger } from './RegistroTrigger'

interface NewAccountPromptProps {
  /** Sempre 0 na prática (gate do modo "novo" em `page.tsx`) — prop explícita por testabilidade. */
  entryCount: number
  /**
   * `FIRST_MIRROR_MIN_ENTRIES` (FR-022) — passado como prop pelo Server Component (`page.tsx`),
   * NUNCA importado direto de `@/lib/ai/mirror/maybeRegenerate` aqui: esse módulo puxa o SDK da
   * Anthropic (código server-only, usa `node:fs/promises`) pro bundle do cliente e quebra a
   * compilação inteira do Painel (audit 025, bug real encontrado em dev).
   */
  firstMirrorMinEntries: number
}

/**
 * Modo "novo" do Painel (US5, FR-021/FR-022) — conta sem nenhum registro ainda. Substitui
 * `PanelEmptyState`: gatilho de Registro em destaque, botão "Importar currículo ou LinkedIn"
 * visível mas **sem ação** (vitrine da feature 027, FR-021), e um cartão de progresso rumo ao
 * primeiro espelho usando o limiar já existente (`FIRST_MIRROR_MIN_ENTRIES`, FR-022) — sem
 * inventar número novo.
 */
export function NewAccountPrompt({ entryCount, firstMirrorMinEntries }: NewAccountPromptProps) {
  const t = useTranslations('painel')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">{t('newAccount.heading')}</h1>
      <RegistroTrigger />

      {/* Vitrine não-funcional (FR-021): sem href, sem onClick — clicar não faz nada, de propósito. */}
      <button
        type="button"
        className="self-start inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full"
        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <UserPlus size={16} aria-hidden="true" />
        {t('newAccount.importButton')}
      </button>

      <div
        className="rounded-2xl px-5 py-4"
        style={{ background: 'var(--color-lilas-nevoa)' }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
          {t('newAccount.progressCard')}
        </p>
        <div
          className="h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: 'var(--background)' }}
          role="progressbar"
          aria-valuenow={entryCount}
          aria-valuemin={0}
          aria-valuemax={firstMirrorMinEntries}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (entryCount / firstMirrorMinEntries) * 100)}%`,
              background: 'var(--color-primary)',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }} data-testid="mirror-progress-count">
          {t('newAccount.progressLabel', { count: entryCount, total: firstMirrorMinEntries })}
        </p>
      </div>
    </div>
  )
}
