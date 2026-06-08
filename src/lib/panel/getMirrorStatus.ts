export type MirrorStatus = 'building' | 'emerging' | 'active'

const EMERGING_THRESHOLD = 4
const ACTIVE_THRESHOLD = 10

export function getMirrorStatus(entryCount: number): MirrorStatus {
  if (entryCount < EMERGING_THRESHOLD) return 'building'
  if (entryCount < ACTIVE_THRESHOLD) return 'emerging'
  return 'active'
}

export const STATUS_CONFIG: Record<MirrorStatus, { dot: string; label: string }> = {
  building: { dot: 'bg-orange-500', label: 'Em construção' },
  emerging: { dot: 'bg-amber-500', label: 'Tomando forma' },
  active: { dot: 'bg-green-500', label: 'Ativo' },
}
