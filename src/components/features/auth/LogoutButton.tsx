'use client'

import { useTranslations } from 'next-intl'
import { signOut } from '@/lib/actions/auth'

export function LogoutButton() {
  const t = useTranslations('painel')

  async function handleLogout() {
    await signOut()
    window.location.replace('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      aria-label={t('logoutAriaLabel')}
      className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      style={{
        color: 'var(--muted-foreground)',
      }}
    >
      {t('logout')}
    </button>
  )
}
