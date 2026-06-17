import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { PeriodPicker } from '@/components/features/autoavaliacao/PeriodPicker'

export const metadata: Metadata = {
  title: 'Autoavaliação | Borogodó',
}

/**
 * Página dedicada da autoavaliação (019, US1). A "sala" onde a pessoa colhe o ano: escolhe um período
 * e gera duas autoavaliações estruturadas por seções, ancoradas na evidência real do intervalo. RSC:
 * só renderiza a moldura e a headline; a interação (seletor de período + disparo da geração) vive no
 * `PeriodPicker` client. O resultado reusa o `GenerateSheet` montado no AppShell (mesmo mecanismo da
 * Presença), via evento `openPresenca` com `seedType: 'period'`.
 */
export default async function AutoavaliacaoPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('autoavaliacao')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, color: 'var(--foreground)' }}>
          {t('title')}
        </h1>
        <p className="text-base mt-2" style={{ color: 'var(--muted-foreground)' }}>
          {t('subtitle')}
        </p>
      </header>

      <PeriodPicker />
    </div>
  )
}
