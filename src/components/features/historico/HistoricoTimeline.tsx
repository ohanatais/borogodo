'use client'

import type { HistoricoData } from '@/lib/historico/getHistoricoData'
import { CompanyTimelineItem } from './CompanyTimelineItem'
import { ProductEmptyState } from '@/components/ui/ProductEmptyState'
import { Button } from '@/components/ui/button'
import { dispatchOpenDrawer } from '@/components/features/painel/registroTriggerEvents'

interface HistoricoTimelineProps {
  data: HistoricoData
}

export function HistoricoTimeline({
  data,
}: HistoricoTimelineProps) {
  const isEmpty = data.companies.length === 0

  return (
    // Container (largura/padding) é do /espelho: Trajetória é uma das superfícies do Espelho,
    // não uma página independente.
    // leve (h2), sem competir como page-title duplicado logo abaixo do toggle (021).
    <div className="pb-8">
      {isEmpty ? (
        <ProductEmptyState
          visual={(
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full" style={{ background: 'var(--color-primary)' }} />
              <div className="h-12 border-l-2 border-dotted" style={{ borderColor: 'var(--border)' }} />
            </div>
          )}
          title="Seu fio ainda está em branco"
          description="Conte uma história com seu cargo e empresa. Ela aparece aqui como o primeiro nó da sua trajetória."
          action={<Button
              type="button"
              onClick={() => dispatchOpenDrawer()}
              size="lg"
            >
              Registrar agora
            </Button>}
        />
      ) : (
        <div className="flex gap-6 items-start">
          {/* Timeline column */}
          <div className="relative flex-1 min-w-0">
            {/* Vertical dotted connector */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: '43px',
                borderLeft: '2px dotted var(--border)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <div>
              {data.companies.map((company, i) => (
                <CompanyTimelineItem
                  key={company.company}
                  company={company}
                  isLast={i === data.companies.length - 1}
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
