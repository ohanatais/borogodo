'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/db/supabase/client'
import { LEGAL_ROUTES } from '@/lib/legal/policy'
import { Checkbox } from '@/components/ui/Checkbox'

type Mode = 'login' | 'signup'

type AuthFormProps = {
  initialMode: Mode
}

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateSignup(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'error.nameRequired'
  if (!EMAIL_REGEX.test(email)) errors.email = 'error.emailInvalid'
  if (password.length < 8) errors.password = 'error.passwordTooShort'
  if (password.length >= 8 && confirmPassword !== password) {
    errors.confirmPassword = 'error.passwordMismatch'
  }
  return errors
}

function validateLogin(email: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!EMAIL_REGEX.test(email)) errors.email = 'error.emailInvalid'
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

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  error,
  hint,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-current"
        style={{
          borderColor: error ? 'var(--color-accent)' : 'var(--border)',
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      />
      {error ? (
        <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AuthForm({ initialMode }: AuthFormProps) {
  const t = useTranslations('auth')
  const tLegal = useTranslations('legal')
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setErrors({})
    setConfirmPassword('')
    router.replace(`/login${next === 'signup' ? '?mode=signup' : ''}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (mode === 'signup') {
      const validationErrors = validateSignup(name, email, password, confirmPassword)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
      setLoading(true)
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, marketing_consent: marketingConsent } },
      })
      setLoading(false)
      if (error) {
        setErrors(classifySignupError(error.message))
        return
      }
      setConfirmed(true)
      return
    }

    const loginErrors = validateLogin(email)
    if (Object.keys(loginErrors).length > 0) {
      setErrors(loginErrors)
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
          <Field
            id="name"
            label={t('field.name')}
            autoComplete="name"
            value={name}
            onChange={setName}
            error={errors.name ? t(errors.name as Parameters<typeof t>[0]) : undefined}
          />
        )}

        <Field
          id="email"
          label={t('field.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email ? t(errors.email as Parameters<typeof t>[0]) : undefined}
        />

        <Field
          id="password"
          label={t('field.password')}
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={setPassword}
          error={errors.password ? t(errors.password as Parameters<typeof t>[0]) : undefined}
          hint={mode === 'signup' ? t('hint.password') : undefined}
        />

        {mode === 'signup' && (
          <Field
            id="confirmPassword"
            label={t('field.confirmPassword')}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={
              errors.confirmPassword
                ? t(errors.confirmPassword as Parameters<typeof t>[0])
                : undefined
            }
          />
        )}

        {mode === 'signup' && (
          <label
            className="flex items-start gap-3 min-h-12 py-2 px-2.5 -mx-2.5 rounded-lg cursor-pointer transition-colors hover:bg-black/[0.02]"
          >
            <span className="mt-0.5">
              <Checkbox
                checked={marketingConsent}
                onChange={setMarketingConsent}
                ariaLabel={tLegal('marketingOptIn.label')}
              />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                {tLegal('marketingOptIn.label')}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {tLegal('marketingOptIn.helper')}
              </span>
            </span>
          </label>
        )}

        {errors.general && (
          <p className="text-sm text-center" style={{ color: 'var(--color-accent)' }}>
            {t(errors.general as Parameters<typeof t>[0])}
            {errors.general === 'error.emailNotConfirmed' && (
              <button
                type="button"
                className="block mt-1 underline text-xs mx-auto"
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

        {mode === 'signup' && (
          <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
            {tLegal.rich('signInWrap', {
              terms: (chunks) => (
                <Link
                  href={LEGAL_ROUTES.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href={LEGAL_ROUTES.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
      </form>
    </div>
  )
}
