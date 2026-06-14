'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { uploadAvatarAction } from '@/lib/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  userName: string
  onUpload: (url: string) => void
}

type UploadState = 'idle' | 'uploading' | 'error'

export function AvatarUpload({ currentUrl, userName, onUpload }: AvatarUploadProps) {
  const t = useTranslations('configuracoes.identity')
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t('photoError.size'))
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg(t('photoError.type'))
      return
    }

    setErrorMsg(null)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadState('uploading')

    const formData = new FormData()
    formData.append('avatar', file)
    const result = await uploadAvatarAction(formData)

    if (result.error) {
      setErrorMsg(result.error)
      setUploadState('error')
      return
    }

    if (result.url) {
      onUpload(result.url)
    }
    setUploadState('idle')
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={t('photoChange')}
        className="relative w-20 h-20 rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 cursor-pointer"
        style={{
          border: previewUrl ? '2px solid var(--border)' : '2px dashed var(--border)',
          background: 'var(--color-creme)',
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('photoLabel')}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className="w-full h-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {userName.charAt(0).toUpperCase() || '?'}
          </span>
        )}
        {uploadState === 'uploading' && (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: 'oklch(0% 0 0 / 0.4)' }}
          >
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs underline underline-offset-2"
        style={{ color: 'var(--color-primary)' }}
      >
        {t('photoChange')}
      </button>

      {errorMsg && (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          {errorMsg}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
