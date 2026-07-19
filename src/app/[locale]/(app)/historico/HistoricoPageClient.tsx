'use client'

import type { HistoricoData } from '@/lib/historico/getHistoricoData'
import { HistoricoTimeline } from '@/components/features/historico/HistoricoTimeline'

interface HistoricoPageClientProps {
  data: HistoricoData
}

export function HistoricoPageClient({ data }: HistoricoPageClientProps) {
  return (
    <HistoricoTimeline
      data={data}
    />
  )
}
