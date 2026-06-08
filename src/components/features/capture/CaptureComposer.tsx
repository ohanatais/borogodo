'use client'

import { useState } from 'react'
import { Paperclip, ImageIcon, ArrowUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CaptureInput } from '@/types/capture'
import { AudioButton } from './AudioButton'
import { FileButton } from './FileButton'
import { CaptureConversation } from './CaptureConversation'

interface CaptureComposerProps {
  placeholder: string
}

export function CaptureComposer({ placeholder }: CaptureComposerProps) {
  const t = useTranslations('capture')
  const [text, setText] = useState('')
  const [activeCapture, setActiveCapture] = useState<CaptureInput | null>(null)

  const handleSubmit = () => {
    if (!text.trim()) return
    setActiveCapture({ kind: 'text', content: text.trim() })
    setText('')
  }

  const handleFile = (file: File) => {
    setActiveCapture({ kind: 'file', file })
  }

  return (
    <>
      <div
        className="sticky bottom-0 backdrop-blur border-t px-4 py-3"
        style={{ background: 'color-mix(in oklch, var(--background) 95%, transparent)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
            style={{ background: 'var(--muted)' }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm"
              style={{ color: 'var(--foreground)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </div>
          <AudioButton />
          <FileButton
            accept=".pdf"
            icon={Paperclip}
            ariaLabel={t('composer.fileAriaLabel')}
            onFile={handleFile}
          />
          <button
            type="button"
            disabled
            aria-label={t('composer.imageAriaLabel')}
            title={t('composer.imageComingSoon')}
            className="p-2 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ImageIcon size={20} />
          </button>
          <button
            type="button"
            aria-label={t('composer.submitAriaLabel')}
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="p-2 rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {activeCapture && (
        <CaptureConversation input={activeCapture} onResolved={() => setActiveCapture(null)} />
      )}
    </>
  )
}
