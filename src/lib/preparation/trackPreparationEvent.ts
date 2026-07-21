import type { PrepMoment } from '@/lib/content/intentions'

export function trackPreparationEvent(
  eventName: 'moment_selected' | 'context_submitted' | 'evidence_opened' | 'preparation_saved' | 'conversation_shared' | 'response_feedback',
  moment?: PrepMoment,
  properties: Record<string, boolean | number> = {}
): void {
  void fetch('/api/preparation-events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, moment, properties }), keepalive: true,
  }).catch(() => undefined)
}
