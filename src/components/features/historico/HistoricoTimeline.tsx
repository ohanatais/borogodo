import type { HistoricoData } from '@/lib/historico/getHistoricoData'
import { TimelineItem } from './TimelineItem'

interface HistoricoTimelineProps {
  data: HistoricoData
}

export function HistoricoTimeline({ data }: HistoricoTimelineProps) {
  const isEmpty = data.positions.length === 0

  return (
    <div className="max-w-[760px] mx-auto px-5 lg:px-0 pt-2 pb-8">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        O fio da{' '}
        <em className="italic font-normal">sua carreira</em>
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
        Cada passo, com a evidência que ficou.
      </p>

      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-base mb-2" style={{ color: 'var(--foreground)' }}>
            Nenhuma entrada com cargo e empresa ainda.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Conte histórias com seu cargo e empresa e elas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="relative">
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
            {data.positions.map((position, i) => (
              <TimelineItem
                key={`${position.role_title}|||${position.company}`}
                position={position}
                isLast={i === data.positions.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
