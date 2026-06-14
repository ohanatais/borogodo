'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { updateProfileAction } from '@/lib/actions/profile'
import type { Profile } from '@/types/profile'

interface LinksCardProps {
  profile: Profile | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function isValidUrl(value: string): boolean {
  if (!value) return true
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`)
    return true
  } catch {
    return false
  }
}

function normalizeUrl(value: string): string {
  if (!value) return ''
  if (value.startsWith('http')) return value
  return `https://${value}`
}

export function LinksCard({ profile }: LinksCardProps) {
  const t = useTranslations('configuracoes.links')
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url ?? '')
  const [github, setGithub] = useState(profile?.github_url ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    const linkedinNorm = linkedin ? normalizeUrl(linkedin) : ''
    const githubNorm = github ? normalizeUrl(github) : ''

    if ((linkedinNorm && !isValidUrl(linkedinNorm)) || (githubNorm && !isValidUrl(githubNorm))) {
      setErrorMsg('URL inválida.')
      setSaveState('error')
      return
    }

    setSaveState('saving')
    setErrorMsg(null)

    const result = await updateProfileAction({
      linkedin_url: linkedinNorm || undefined,
      github_url: githubNorm || undefined,
    })

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-linkedin" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          <ExternalLink size={14} />
          {t('linkedin')}
        </label>
        <input
          id="profile-linkedin"
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder={t('linkedinPlaceholder')}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
          style={{
            background: 'var(--input)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-github" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          <ExternalLink size={14} />
          {t('github')}
        </label>
        <input
          id="profile-github"
          type="url"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder={t('githubPlaceholder')}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
          style={{
            background: 'var(--input)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === 'saving'}
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
