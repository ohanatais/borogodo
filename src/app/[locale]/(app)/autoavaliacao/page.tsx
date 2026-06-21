import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/db/supabase/server'
import { getSelfAssessment, getLatestCommitment, listDrafts } from '@/lib/db/drafts'
import { loadPeriodRecap } from '@/lib/autoavaliacao/periodRecap'
import { buildSentenceStems } from '@/lib/autoavaliacao/sentenceStems'
import { getReviewCheckIn } from '@/lib/autoavaliacao/reviewCheckIn'
import { getNextReviewDate } from '@/lib/panel/getReviewCycleSignal'
import { parsePeriodSeedRef, serializePeriodSeedRef } from '@/lib/content/period'
import { parseSelfAssessmentSections } from '@/components/features/content/selfAssessmentSections'
import type { ForwardStep } from '@/types/content'
import { PeriodPicker } from '@/components/features/autoavaliacao/PeriodPicker'
import { ReviewCheckIn } from '@/components/features/autoavaliacao/ReviewCheckIn'
import { YearInFactsRecap } from '@/components/features/autoavaliacao/YearInFactsRecap'
import { AssessmentEditor } from '@/components/features/autoavaliacao/AssessmentEditor'
import { SelfAssessmentHistory } from '@/components/features/autoavaliacao/SelfAssessmentHistory'

export const metadata: Metadata = {
  title: 'Autoavaliação | Borogodó',
}

type EditorSections = { entregas: string; impacto: string; evolucao: string; pontosADesenvolver: string }

interface AutoavaliacaoPageProps {
  searchParams: Promise<{ from?: string; to?: string; draft?: string }>
}

/** Reconstrói as 4 seções do editor a partir do `body` salvo (cabeçalhos "Entregas:" etc). */
function sectionsFromBody(body: string): EditorSections {
  const out: EditorSections = { entregas: '', impacto: '', evolucao: '', pontosADesenvolver: '' }
  for (const section of parseSelfAssessmentSections(body)) {
    if (section.key) out[section.key] = section.body
  }
  return out
}

/**
 * Cabine da autoavaliação (019, modelo cockpit). RSC: sem período, mostra o seletor + o histórico; com
 * período válido, carrega o recap determinístico e abre a cabine de escrita; com `?draft=<id>`, REABRE
 * a autoavaliação salva para edição (US3), na própria cabine (nunca no fluxo de post). A pessoa ESCREVE;
 * a IA só ancora. O recap colhe de `entries`, isolado do espelho.
 */
export default async function AutoavaliacaoPage({ searchParams }: AutoavaliacaoPageProps) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const t = await getTranslations('autoavaliacao')
  const { from, to, draft } = await searchParams

  // Reabertura (US3): carrega o draft e resolve o período a partir do seedRef salvo.
  const reopened = draft ? await getSelfAssessment(supabase, user.id, draft) : null
  const reopenedPeriod = reopened?.seedRef ? parsePeriodSeedRef(reopened.seedRef) : null
  const period = reopenedPeriod ?? (from && to ? parsePeriodSeedRef(serializePeriodSeedRef(from, to)) : null)

  // Tela inicial (sem período): revisões passadas (drafts) + a recorrência para a próxima agendada.
  const historyItems = period ? [] : (await listDrafts(supabase, user.id, { format: 'self_assessment' })).items
  const profile = period
    ? null
    : ((
        await supabase.from('profiles').select('review_cycle_months, review_cycle_anchor').eq('id', user.id).maybeSingle()
      ).data as { review_cycle_months?: number | null; review_cycle_anchor?: string | null } | null)

  // Check-in de revisão (US2 follow-up): se a data marcada já chegou e há um compromisso anterior,
  // recebe a pessoa com ele + "como foi?" (a resposta vira registro). Só na tela inicial e só quando há
  // ciclo configurado — evita a query de compromisso para quem nunca marcou revisão (a maioria).
  const hasCycle = !period && profile?.review_cycle_months != null && !!profile?.review_cycle_anchor
  const latestCommitment = hasCycle ? await getLatestCommitment(supabase, user.id) : null
  const checkIn = latestCommitment
    ? getReviewCheckIn({
        reviewCycleMonths: profile?.review_cycle_months ?? null,
        reviewCycleAnchor: profile?.review_cycle_anchor ?? null,
        now: new Date(),
        latestCommitment: latestCommitment.commitment,
        latestDraftId: latestCommitment.draftId,
      })
    : { show: false as const }

  return (
    <div className="max-w-[980px] mx-auto px-6 py-8 pb-28 lg:pb-8">
      <header className="mb-10">
        <h1
          className="text-3xl sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}
        >
          {t('title')}
        </h1>
        <p className="text-base mt-2 max-w-prose" style={{ color: 'var(--muted-foreground)' }}>
          {t('subtitle')}
        </p>
      </header>

      {period ? (
        <CockpitForPeriod
          userId={user.id}
          from={period.from}
          to={period.to}
          initialDraftId={reopened ? draft : undefined}
          initialSections={reopened ? sectionsFromBody(reopened.body) : undefined}
          initialForwardStep={reopened?.forwardStep ?? undefined}
        />
      ) : (
        <>
          {/* Loop da revisão: chegou a data + há compromisso → fecha o ciclo antes de abrir um novo. */}
          {checkIn.show && (
            <div className="mb-10">
              <ReviewCheckIn commitment={checkIn.commitment} />
            </div>
          )}
          <PeriodPicker />
          {/* Histórico em `drafts` (self_assessment) = revisões passadas; topo = próxima agendada. */}
          <div className="mt-10">
            <SelfAssessmentHistory
              items={historyItems}
              nextReviewDate={getNextReviewDate(
                profile?.review_cycle_months ?? null,
                profile?.review_cycle_anchor ?? null,
                new Date()
              )}
            />
          </div>
        </>
      )}
    </div>
  )
}

interface CockpitForPeriodProps {
  userId: string
  from: string
  to: string
  initialDraftId?: string
  initialSections?: EditorSections
  initialForwardStep?: ForwardStep
}

/** Carrega o recap do intervalo e monta a cabine (escrita nova ou reabertura para edição). */
async function CockpitForPeriod({ userId, from, to, initialDraftId, initialSections, initialForwardStep }: CockpitForPeriodProps) {
  const supabase = await createServerClient()
  const recap = await loadPeriodRecap(supabase, userId, from, to)
  const stems = buildSentenceStems(recap.items)
  const seedRef = serializePeriodSeedRef(from, to)

  return (
    <div className="flex flex-col gap-8">
      <YearInFactsRecap items={recap.items} isLimited={recap.isLimited} from={from} to={to} />
      <AssessmentEditor
        stems={stems}
        seedRef={seedRef}
        initialDraftId={initialDraftId}
        initialSections={initialSections}
        initialForwardStep={initialForwardStep}
      />
    </div>
  )
}
