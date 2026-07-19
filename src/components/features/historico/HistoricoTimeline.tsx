import type { HistoricoData } from '@/lib/historico/getHistoricoData'
import { CompanyTimelineItem } from './CompanyTimelineItem'

interface HistoricoTimelineProps {
  data: HistoricoData
}

export function HistoricoTimeline({
  data,
}: HistoricoTimelineProps) {
  const isEmpty = data.companies.length === 0

  return (
    // Container (largura/padding) é do /espelho: a Trajetória é uma vista do segmented control,
    // não uma página. O toggle "Forças | Trajetória" já nomeia a vista — o título vira intro
    // leve (h2), sem competir como page-title duplicado logo abaixo do toggle (021).
    <div className="pb-8">
      <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        O fio da{' '}
        <em className="italic font-normal">sua carreira</em>
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Cada passo, com a evidência que ficou.
      </p>

      {isEmpty ? (
        <div className="flex flex-col items-center py-16 gap-5">
          {/* Visual: fio vazio com nó no topo */}
          <div className="flex flex-col items-center gap-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: 'var(--color-primary)' }}
            />
            <div
              className="w-px h-16"
              style={{ borderLeft: '2px dotted var(--border)' }}
            />
          </div>
          <div className="text-center max-w-xs">
            <p className="text-base font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Seu fio ainda está em branco.
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Conte uma história com seu cargo e empresa — ela aparece aqui como o primeiro nó da sua trajetória.
            </p>
            <button
              type="button"
              onClick={() => document.querySelector('textarea')?.focus()}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
            >
              Registrar agora
            </button>
          </div>
        </div>
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
