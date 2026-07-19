import { logger } from '@/lib/log'
import { maybeRegenerateMirror as regenerateMirror } from '@/lib/ai/mirror/maybeRegenerate'
import { triggerProactiveInsight as generateProactiveInsight } from '@/lib/ai/insights/triggerProactiveInsight'
import { getSupabaseAdmin } from '@/lib/db/supabaseAdmin'
import { getEnrichmentNudge } from '@/lib/panel/getEnrichmentNudge'
import { organizeEntry } from '@/lib/entries/organizeEntry'
import { tryAcquireOrganizingLock } from '@/lib/entries/organizingLock'
import { generateEmbedding } from '@/lib/ai/embeddings'

/**
 * Costura da feature 005-panel: delega para o corpo real (geração via Haiku, persistência
 * em `proactive_insights`). A assinatura não muda — `/api/capture` (003) continua chamando
 * como antes (fire-and-forget, sem bloquear a resposta da captura).
 */
export async function triggerProactiveInsight(userId: string): Promise<void> {
  await generateProactiveInsight(userId)
}

/**
 * Costura da feature 004-mirror: delega para o corpo real (regeneração por limiar, Sonnet).
 * A assinatura não muda — `/api/capture` (003) continua chamando como antes.
 */
export async function maybeRegenerateMirror(userId: string): Promise<void> {
  await regenerateMirror(userId)
}

/**
 * Detecta entradas magras e cria UMA pergunta cirúrgica assíncrona por ciclo.
 * Chama getEnrichmentNudge buscando entradas sem metric/impact e insights existentes.
 */
export async function triggerEnrichmentNudge(userId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  const [entriesRes, insightsRes] = await Promise.all([
    admin
      .from('entries')
      .select('id, what_i_did, metric, impact')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('proactive_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'enrichment_nudge'),
  ])

  const entries = (entriesRes.data ?? []) as { id: string; what_i_did: string; metric: string | null; impact: string | null }[]
  const existing = (insightsRes.data ?? []) as import('@/types/insight').ProactiveInsight[]

  await getEnrichmentNudge(userId, entries, existing)
}

/**
 * Dispara a organização assíncrona (US3, feature 026) quando o registro é salvo sem clicar em
 * "Organizar" (FR-009) — reusa `organizeEntry` (US1) e o mesmo lock atômico de
 * `organizing_started_at` (`tryAcquireOrganizingLock`, FR-031) do clique manual, para nunca
 * disparar duas chamadas de IA simultâneas para a mesma fonte — inclusive quando este job e um
 * clique manual em "Organizar" competem pela mesma fonte nos primeiros instantes após salvar.
 * Usa o client `service_role` (como os demais jobs deste arquivo) porque roda fora do ciclo de
 * request com cookie de sessão. Nunca lança — falha de IA já é tratada dentro de `organizeEntry`
 * (FR-030), e qualquer outro erro aqui é só logado, coerente com `fireAndForget`.
 */
export async function triggerOrganizeEntry(userId: string, entryId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const lock = await tryAcquireOrganizingLock(admin as never, entryId, userId)
    if (lock !== 'acquired') return

    const result = await organizeEntry(admin as never, userId, entryId)

    // Indexa somente depois da organização, que também atualiza a fonte. Assim o vetor nunca
    // perde para a escrita de organização no mesmo registro.
    if (result.status !== 'not_found') {
      await refreshEntryEmbedding(userId, entryId)
    }

    // A captura v2 salva primeiro e organiza depois. Só consideramos a fonte para uma possível
    // atualização do Espelho após os destaques estarem persistidos, evitando gerar um retrato
    // que ainda enxergaria somente o texto cru da nova fonte.
    if (result.status === 'organized') {
      await maybeRegenerateMirror(userId)
    }
  } catch (jobError: unknown) {
    logger.error('async job failed', {
      job: 'triggerOrganizeEntry',
      message: jobError instanceof Error ? jobError.message : 'unknown error',
    })
  }
}

/**
 * Indexa o texto canônico da fonte fora do caminho crítico de salvar/editar. Assim, o depósito
 * continua imediato, mas o chat semântico passa a encontrar o registro assim que a indexação
 * termina. Falhas permanecem recuperáveis: o registro continua salvo e visível no feed.
 */
export async function refreshEntryEmbedding(userId: string, entryId: string): Promise<void> {
  const admin = getSupabaseAdmin()

  try {
    const { data, error } = await admin
      .from('entries')
      .select('raw_content, what_i_did, updated_at')
      .eq('id', entryId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return

    const sourceText = (data.raw_content as string | null) ?? (data.what_i_did as string)
    const sourceUpdatedAt = data.updated_at as string
    const embedding = await generateEmbedding(sourceText)
    const { error: updateError } = await admin
      .from('entries')
      .update({ embedding })
      .eq('id', entryId)
      .eq('user_id', userId)
      // Não deixa uma indexação iniciada antes de uma edição substituir o vetor do texto novo.
      .eq('updated_at', sourceUpdatedAt)

    if (updateError) throw updateError
  } catch (jobError: unknown) {
    logger.error('entry embedding refresh failed', {
      entryId,
      message: jobError instanceof Error ? jobError.message : 'unknown error',
    })
  }
}

/**
 * Dispara um job assíncrono sem bloquear a resposta da rota.
 * Constituição proíbe catch vazio — todo erro é logado (sem dados de usuário).
 */
export function fireAndForget(jobName: string, job: Promise<void>): void {
  job.catch((error: unknown) => {
    logger.error('async job failed', {
      job: jobName,
      message: error instanceof Error ? error.message : 'unknown error',
    })
  })
}
