import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'
import { GoogleButton } from './GoogleButton'
import { AuthDivider } from './AuthDivider'
import { AuthForm } from './AuthForm'

type AuthCardProps = {
  initialMode: 'login' | 'signup'
}

export function AuthCard({ initialMode }: AuthCardProps) {
  const t = useTranslations('auth')

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6"
      style={{ background: 'var(--background)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      <div className="flex justify-center">
        <Logo variant="light" size="sm" />
      </div>

      <div className="text-center">
        <h1
          className="font-display font-semibold text-2xl leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          {initialMode === 'signup' ? t('headline.signup') : t('headline.login')}
        </h1>
        {initialMode === 'signup' && (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {t('subheadline.signup')}
          </p>
        )}
      </div>

      <GoogleButton />
      <AuthDivider />
      <AuthForm initialMode={initialMode} />
    </div>
  )
}
