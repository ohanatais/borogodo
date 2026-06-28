import { Resend } from 'resend'
import { OPS_ALERT_EMAIL, getLimits } from '@/lib/ai/cost/limits'
import { dailyOpsSnapshot, type OpsSnapshot } from '@/lib/db/aiUsage'
import { logger } from '@/lib/log'

export type AlertType = 'preventive' | 'cap_reached'

const ALERT_FROM = process.env.OPS_ALERT_FROM ?? 'Borogodó <alertas@borogodo.ai>'

function money(usd: number): string {
  return `US$ ${usd.toFixed(2)}`
}

function buildSubject(type: AlertType, totalUsd: number, capUsd: number): string {
  if (type === 'cap_reached') {
    return '[Borogodó] TETO DIÁRIO DE IA ATINGIDO'
  }
  const pct = capUsd > 0 ? Math.round((totalUsd / capUsd) * 100) : 0
  return `[Borogodó] Gasto de IA em ${pct}% do teto`
}

export interface AlertEmail {
  subject: string
  text: string
}

/** Compõe assunto + corpo do alerta (pura — sem I/O, testável direto). */
export function composeAlertEmail(type: AlertType, snapshot: OpsSnapshot, capUsd: number): AlertEmail {
  return { subject: buildSubject(type, snapshot.totalUsd, capUsd), text: buildBody(type, snapshot, capUsd) }
}

function buildBody(type: AlertType, snapshot: OpsSnapshot, capUsd: number): string {
  const pct = capUsd > 0 ? Math.round((snapshot.totalUsd / capUsd) * 100) : 0
  const ranking = snapshot.ranking.length
    ? snapshot.ranking
        .map((c, i) => `  ${i + 1}. ${c.email ?? c.userId} — ${money(c.costUsd)} (${c.actions} ações)`)
        .join('\n')
    : '  (ninguém ainda)'
  const blocked = snapshot.blocked.length
    ? snapshot.blocked.map((b) => `  - ${b.email ?? b.userId}`).join('\n')
    : '  (nenhum)'
  const tail =
    type === 'cap_reached'
      ? '\nNovas gerações estão sendo seguradas até virar o dia. Captura segue liberada.'
      : ''

  return [
    `Gasto de IA hoje: ${money(snapshot.totalUsd)} de ${money(capUsd)} (${pct}%)`,
    `Usuários ativos hoje: ${snapshot.activeUsers}`,
    '',
    'Quem mais consumiu hoje:',
    ranking,
    '',
    'Usuários travados agora (limite/hora):',
    blocked,
    tail,
  ].join('\n')
}

/**
 * Envia o e-mail de alerta operacional (preventivo ou de teto) para a operação. Best-effort: se a
 * env de envio faltar ou o Resend falhar, loga (sem dado de usuário) e segue — nunca propaga.
 */
export async function sendOpsAlert(type: AlertType): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    logger.warn('ops_alert_skipped_no_resend_key', { type })
    return
  }

  try {
    const { dailyCapUsd, ratePerHour } = getLimits()
    const snapshot = await dailyOpsSnapshot(ratePerHour)
    const email = composeAlertEmail(type, snapshot, dailyCapUsd)
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: ALERT_FROM,
      to: OPS_ALERT_EMAIL,
      subject: email.subject,
      text: email.text,
    })
    if (error) {
      logger.error('ops_alert_send_failed', { type, reason: error.message })
    }
  } catch (error) {
    logger.error('ops_alert_send_threw', { type, reason: error instanceof Error ? error.message : 'unknown' })
  }
}
