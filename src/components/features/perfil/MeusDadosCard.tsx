'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { AvatarUpload } from './AvatarUpload'
import { updateProfileAction } from '@/lib/actions/profile'
import type { Profile } from '@/types/profile'

interface MeusDadosCardProps {
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

/**
 * Card único de "Meus dados" (feature 024, otimização pós-implementação): identidade + links
 * profissionais num único formulário, um único botão Salvar — evita duplicar a ação de salvar
 * quando os dois grupos de campo sempre foram, na prática, o mesmo perfil.
 */
export function MeusDadosCard({ profile }: MeusDadosCardProps) {
  const t = useTranslations('configuracoes.identity')
  const tLinks = useTranslations('configuracoes.links')
  const tSave = useTranslations('configuracoes.meusDados')
  const router = useRouter()

  const [name, setName] = useState(profile?.name ?? '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url ?? '')
  const [github, setGithub] = useState(profile?.github_url ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return

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
      name: name.trim(),
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
      className="rounded-xl p-8 flex flex-col sm:flex-row gap-8"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex sm:flex-col items-center gap-3 shrink-0">
        <AvatarUpload
          currentUrl={profile?.avatar_url ?? null}
          userName={profile?.name ?? ''}
          onUpload={() => router.refresh()}
        />
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
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
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--foreground)' }}
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
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {t('emailHint')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-linkedin" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              <ExternalLink size={14} />
              {tLinks('linkedin')}
            </label>
            <input
              id="profile-linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder={tLinks('linkedinPlaceholder')}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-github" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              <ExternalLink size={14} />
              {tLinks('github')}
            </label>
            <input
              id="profile-github"
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder={tLinks('githubPlaceholder')}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2"
              style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saveState === 'saved' && (
            <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
              {tSave('saved')}
            </span>
          )}
          {(saveState === 'error' || errorMsg) && (
            <span className="text-sm" style={{ color: 'var(--destructive)' }}>
              {errorMsg ?? tSave('error')}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === 'saving' || !name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
          >
            {saveState === 'saving' ? '...' : tSave('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
