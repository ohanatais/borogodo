'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/db/supabase/client'

type Mode = 'login' | 'signup'

type AuthFormProps = {
  initialMode: Mode
}

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  general?: string
}

function validateSignup(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'error.nameRequired'
  if (!email.trim()) errors.email = 'error.nameRequired'
  if (password.length < 8) errors.password = 'error.passwordTooShort'
  return errors
}

function classifySignupError(message: string): FieldErrors {
  const lower = message.toLowerCase()
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return { general: 'error.emailTaken' }
  }
  return { general: 'error.network' }
}

function classifyLoginError(message: string): FieldErrors {
  if (message.toLowerCase().includes('not confirmed')) {
    return { general: 'error.emailNotConfirmed' }
  }
  return { general: 'error.wrongPassword' }
}

export function AuthForm({ initialMode }: AuthFormProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    router.replace(`/login${next === 'signup' ? '?mode=signup' : ''}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (mode === 'signup') {
      const validationErrors = validateSignup(name, email, password)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
      setLoading(true)
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      setLoading(false)
      if (error) {
        setErrors(classifySignupError(error.message))
        return
      }
      setConfirmed(true)
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setErrors(classifyLoginError(error.message))
      return
    }
    router.push('/painel')
  }

  if (confirmed) {
    return (
      <div className="text-center py-4">
        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
          {t('confirm.title')}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {t('confirm.body')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => switchMode('login')}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            background: mode === 'login' ? 'var(--color-primary)' : 'transparent',
            color: mode === 'login' ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
          }}
        >
          {t('tab.login')}
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            background: mode === 'signup' ? 'var(--color-primary)' : 'transparent',
            color: mode === 'signup' ? 'var(--color-primary-fg)' : 'var(--muted-foreground)',
          }}
        >
          {t('tab.signup')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {mode === 'signup' && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="name"
              className="text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              {t('field.name')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-current"
              style={{
                borderColor: errors.name ? 'var(--color-accent)' : 'var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                {t(errors.name as Parameters<typeof t>[0])}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            {t('field.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-current"
            style={{
              borderColor: errors.email ? 'var(--color-accent)' : 'var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
              {t(errors.email as Parameters<typeof t>[0])}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            {t('field.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-current"
            style={{
              borderColor: errors.password ? 'var(--color-accent)' : 'var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          {errors.password && (
            <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
              {t(errors.password as Parameters<typeof t>[0])}
            </p>
          )}
        </div>

        {errors.general && (
          <p className="text-sm text-center" style={{ color: 'var(--color-accent)' }}>
            {t(errors.general as Parameters<typeof t>[0])}
            {errors.general === 'auth.error.emailNotConfirmed' && (
              <button
                type="button"
                className="block mt-1 underline text-xs"
                style={{ color: 'var(--color-accent)' }}
              >
                {t('resend')}
              </button>
            )}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
          }}
        >
          {loading ? (
            <span
              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            t(mode === 'signup' ? 'submit.signup' : 'submit.login')
          )}
        </button>
      </form>
    </div>
  )
}
