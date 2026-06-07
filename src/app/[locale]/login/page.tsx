import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/features/auth/AuthCard'

type LoginPageProps = {
  searchParams: Promise<{ mode?: 'login' | 'signup' }>
}

export async function generateMetadata() {
  const t = await getTranslations('auth')
  return { title: t('tab.login') + ' — Borogodó' }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const initialMode = params.mode === 'signup' ? 'signup' : 'login'

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-creme)' }}>
      <AuthCard initialMode={initialMode} />
    </main>
  )
}
