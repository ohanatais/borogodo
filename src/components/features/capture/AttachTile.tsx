'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link2, X, RotateCw } from 'lucide-react'

export type AttachTileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface AttachTileProps {
  kind: 'image' | 'link'
  /** URL de preview (local via `URL.createObjectURL` antes de salvar, pública depois). */
  previewUrl: string
  label?: string
  status?: AttachTileStatus
  /** Ausente = tile somente-leitura (ex.: reaberto em `/registros`, sem opção de remover). */
  onRemove?: () => void
  onRetry?: () => void
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/**
 * Tile de anexo (US2) — miniatura real para imagem, domínio/título para link. Reusado tanto no
 * drawer (com `onRemove`/`onRetry`) quanto em contextos somente-leitura (feed) sem essas props.
 * Clicar na miniatura de imagem abre em tela cheia (revisão manual: antes não tinha como ampliar).
 */
export function AttachTile({ kind, previewUrl, label, status = 'done', onRemove, onRetry }: AttachTileProps) {
  const t = useTranslations('registro')
  const hasError = status === 'error'
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div
      className="relative flex items-center gap-2 shrink-0"
      style={{
        width: kind === 'image' ? '72px' : 'auto',
        height: kind === 'image' ? '72px' : '40px',
        opacity: status === 'uploading' ? 0.6 : 1,
      }}
    >
      {kind === 'image' ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t('attach.viewFullAriaLabel')}
          className="w-full h-full block rounded-xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) antes do upload, next/image não suporta */}
          <img
            src={previewUrl}
            alt={t('attach.imageAlt')}
            className="w-full h-full object-cover rounded-xl"
            style={{ border: `1px solid ${hasError ? 'var(--destructive)' : 'var(--border)'}` }}
          />
        </button>
      ) : (
        <span
          className="flex items-center gap-1.5 px-3 h-full rounded-xl text-xs truncate max-w-[180px]"
          style={{
            border: `1px solid ${hasError ? 'var(--destructive)' : 'var(--border)'}`,
            background: 'var(--muted)',
            color: 'var(--foreground)',
          }}
        >
          <Link2 size={12} aria-hidden="true" className="shrink-0" />
          {label ?? domainFromUrl(previewUrl)}
        </span>
      )}

      {hasError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label={t('attach.retryAriaLabel')}
          className="absolute inset-0 flex items-center justify-center gap-1 rounded-xl text-[10px] font-medium"
          style={{ background: 'var(--overlay-bg)', color: 'var(--color-primary-fg)' }}
        >
          <RotateCw size={11} aria-hidden="true" />
          {t('attach.uploadError')}
        </button>
      )}

      {onRemove && !hasError && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('attach.removeAriaLabel')}
          className="absolute -top-2 -right-2 w-12 h-12 flex items-center justify-center"
        >
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--overlay-bg)', color: 'var(--color-primary-fg)' }}
            aria-hidden="true"
          >
            <X size={10} />
          </span>
        </button>
      )}

      {kind === 'image' && lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('attach.imageAlt')}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- mesma preview local/remota do tile, só ampliada */}
          <img
            src={previewUrl}
            alt={t('attach.imageAlt')}
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label={t('attach.closeFullAriaLabel')}
            className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--overlay-bg)', color: 'var(--color-primary-fg)' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
