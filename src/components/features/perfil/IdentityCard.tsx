'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AvatarUpload } from './AvatarUpload'
import { updateProfileAction } from '@/lib/actions/profile'
import type { Profile } from '@/types/profile'

interface IdentityCardProps {
  profile: Profile | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function IdentityCard({ profile }: IdentityCardProps) {
  const t = useTranslations('configuracoes.identity')
  const router = useRouter()
  const [name, setName] = useState(profile?.name ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaveState('saving')
    setErrorMsg(null)

    const result = await updateProfileAction({ name: name.trim() })

    if (result.error) {
      setErrorMsg(result.error)
      setSaveState('error')
      return
    }

    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2500)
  }

  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
        {t('title')}
      </h2>

      <AvatarUpload
        currentUrl={profile?.avatar_url ?? null}
        userName={profile?.name ?? ''}
        onUpload={() => router.refresh()}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-name" className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('name')}
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {t('email')}
        </label>
        <input
          type="email"
          value={profile?.email ?? ''}
          readOnly
          className="w-full rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
          style={{
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            color: 'var(--muted-foreground)',
          }}
        />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {t('emailHint')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving' || !name.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {saveState === 'saving' ? '...' : t('save')}
        </button>

        {saveState === 'saved' && (
          <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
            {t('saved')}
          </span>
        )}
        {(saveState === 'error' || errorMsg) && (
          <span className="text-sm" style={{ color: 'var(--destructive)' }}>
            {errorMsg ?? t('error')}
          </span>
        )}
      </div>
    </div>
  )
}
