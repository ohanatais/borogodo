'use client'

import type { ClipboardEvent } from 'react'
import { useTranslations } from 'next-intl'

// FR-017: acima de ~200 caracteres colados, mostra um sinal confirmando que a fonte completa foi
// preservada (mitigação do risco "cru preservado mas não usado" do decision record).
const SOURCE_PRESERVED_THRESHOLD = 200

interface DrawerTextareaProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  /** Colar imagem (US2) — quando presente, imagens coladas viram anexo em vez de poluir o texto. */
  onImagePaste?: (file: File) => void
}

export function DrawerTextarea({ value, onChange, disabled, autoFocus, onImagePaste }: DrawerTextareaProps) {
  const t = useTranslations('registro')
  const showSourcePreserved = value.length > SOURCE_PRESERVED_THRESHOLD

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (!onImagePaste) return
    const items = event.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          event.preventDefault()
          onImagePaste(file)
          return
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={t('drawer.textareaPlaceholder')}
        aria-label={t('drawer.textareaAriaLabel')}
        disabled={disabled}
        autoFocus={autoFocus}
        className="flex-1 w-full resize-none rounded-xl px-4 py-3 text-sm outline-none focus-visible:shadow-none min-h-[200px] leading-relaxed"
        style={{
          background: 'var(--muted)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        }}
      />
      {showSourcePreserved && (
        <p role="status" className="text-xs px-1" style={{ color: 'var(--muted-foreground)' }}>
          {t('drawer.sourcePreserved')}
        </p>
      )}
    </div>
  )
}
