import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { listDrafts } from '@/lib/db/drafts'
import { loadPeriodRecap } from '@/lib/autoavaliacao/periodRecap'
import { buildSentenceStems } from '@/lib/autoavaliacao/sentenceStems'
import { parsePeriodSeedRef, serializePeriodSeedRef } from '@/lib/content/period'
import { PeriodPicker } from '@/components/features/autoavaliacao/PeriodPicker'
import { YearInFactsRecap } from '@/components/features/autoavaliacao/YearInFactsRecap'
import { AssessmentEditor } from '@/components/features/autoavaliacao/AssessmentEditor'
import { SelfAssessmentHistory } from '@/components/features/autoavaliacao/SelfAssessmentHistory'

export const metadata: Metadata = {
  title: 'Autoavaliação | Borogodó',
}

interface AutoavaliacaoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

/**
 * Cabine da autoavaliação (019, US1, modelo cockpit). RSC: sem período (`?from=&to=`), mostra o seletor
 * + o histórico; com período válido, carrega o recap DETERMINÍSTICO ("o seu ano, em fatos") e abre a
 * cabine de escrita. A pessoa ESCREVE; a IA só ancora. O recap colhe de `entries` (capturas reais),
 * isolado do espelho.
 */
export default async function AutoavaliacaoPage({ searchParams }: AutoavaliacaoPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('autoavaliacao')
  const { from, to } = await searchParams
  const period = from && to ? parsePeriodSeedRef(serializePeriodSeedRef(from, to)) : null

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

      {period ? (
        <CockpitForPeriod userId={user.id} from={period.from} to={period.to} />
      ) : (
        <>
          <PeriodPicker />
          {/* Histórico em `drafts` (self_assessment), isolado de `entries`/espelho. */}
          <div className="mt-10">
            <SelfAssessmentHistory items={(await listDrafts(supabase, user.id, { format: 'self_assessment' })).items} />
          </div>
        </>
      )}
    </div>
  )
}

/** Carrega o recap do intervalo e monta a cabine. Separado para manter a página legível. */
async function CockpitForPeriod({ userId, from, to }: { userId: string; from: string; to: string }) {
  const supabase = await createServerClient()
  const recap = await loadPeriodRecap(supabase, userId, from, to)
  const stems = buildSentenceStems(recap.items)
  const seedRef = serializePeriodSeedRef(from, to)

  return (
    <div className="flex flex-col gap-8">
      <YearInFactsRecap items={recap.items} isLimited={recap.isLimited} />
      <AssessmentEditor recap={recap.items} stems={stems} seedRef={seedRef} />
    </div>
  )
}
