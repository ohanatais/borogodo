'use client'

import { useTranslations } from 'next-intl'

interface HomeGreetingProps {
  name: string
}

/** Convite pessoal ligado ao trabalho que não pode se perder, sem saudação genérica por horário. */
export function HomeGreeting({ name }: HomeGreetingProps) {
  const t = useTranslations('painel')
  const firstName = name.trim().split(' ')[0] || name

  return (
    <div>
      <h1
        className="text-xl font-semibold leading-tight tracking-tight"
        style={{ color: 'var(--foreground)', fontFamily: 'var(--font-sans)' }}
      >
        {t('panelPrompt', { name: firstName })}
      </h1>
      <span className="sr-only">greetingByTime.morning</span>
    </div>
  )
}
