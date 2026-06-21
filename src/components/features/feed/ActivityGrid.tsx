'use client'

import { useMemo } from 'react'
import type { ActivityCell } from '@/lib/feed/types'

interface ActivityGridProps {
  cells: ActivityCell[]
  onCellClick: (date: string) => void
}

// Mostra a grade assim que houver qualquer registro na janela — o título e os
// rótulos de mês dão o contexto que antes faltava (parecia ruído sem eles).
export const GRID_MIN_DISTINCT_DAYS = 1
const WEEKS_DESKTOP = 26
const WEEKS_MOBILE = 13
const SPARK = '✦'

// Seg Ter Qua Qui Sex Sáb Dom → S T Q Q S S D
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

interface CellIntensity {
  size: number
  color: string
  opacity: number
}

function getIntensity(count: number): CellIntensity {
  if (count === 0) return { size: 9,  color: 'var(--muted-foreground)', opacity: 0.18 }
  if (count === 1) return { size: 9,  color: 'var(--color-primary)',    opacity: 0.45 }
  if (count <= 3)  return { size: 11, color: 'var(--color-primary)',    opacity: 0.75 }
  return              { size: 13, color: 'var(--color-primary)',    opacity: 1.0  }
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

interface GridWeek {
  mondayISO: string
  days: { dateISO: string; count: number }[]
}

function buildGrid(cells: ActivityCell[], weeks: number): GridWeek[] {
  const countMap = new Map(cells.map((c) => [c.date, c.count]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monday = startOfWeek(today)

  const grid: GridWeek[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(monday, -w * 7)
    const days: { dateISO: string; count: number }[] = []
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d)
      if (day > today) break
      const dateISO = toYMD(day)
      days.push({ dateISO, count: countMap.get(dateISO) ?? 0 })
    }
    grid.push({ mondayISO: toYMD(weekStart), days })
  }
  return grid
}

// Só mostra label quando a semana contém o dia 1 do mês — evita duplicatas.
function getMonthLabel(week: GridWeek): string {
  const firstDay = week.days.find((d) => new Date(d.dateISO + 'T12:00:00').getDate() === 1)
  if (!firstDay) return ''
  return new Date(firstDay.dateISO + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })
}

function CellButton({
  dateISO,
  count,
  onClick,
}: {
  dateISO: string
  count: number
  onClick: (date: string) => void
}) {
  const { size, color, opacity } = getIntensity(count)

  return (
    <button
      type="button"
      aria-label={`${dateISO}: ${count} registro${count !== 1 ? 's' : ''}`}
      onClick={() => count > 0 && onClick(dateISO)}
      disabled={count === 0}
      className="flex items-center justify-center transition-transform disabled:cursor-default"
      style={{ width: 16, height: 16, fontSize: size, opacity, color, lineHeight: 1 }}
      onMouseEnter={(e) => { if (count > 0) (e.currentTarget as HTMLElement).style.transform = 'scale(1.4)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
    >
      {SPARK}
    </button>
  )
}

export function ActivityGrid({ cells, onCellClick }: ActivityGridProps) {
  const desktopGrid = useMemo(() => buildGrid(cells, WEEKS_DESKTOP).toReversed(), [cells])
  const mobileGrid  = useMemo(() => buildGrid(cells, WEEKS_MOBILE), [cells])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Atividade
        </h2>
        <div
          className="flex items-center gap-1 text-[10px] select-none"
          style={{ color: 'var(--muted-foreground)' }}
          aria-hidden="true"
        >
          <span>menos</span>
          <span style={{ fontSize: 9, opacity: 0.18 }}>{SPARK}</span>
          <span style={{ fontSize: 9, color: 'var(--color-primary)', opacity: 0.45 }}>{SPARK}</span>
          <span style={{ fontSize: 11, color: 'var(--color-primary)', opacity: 0.75 }}>{SPARK}</span>
          <span style={{ fontSize: 13, color: 'var(--color-primary)', opacity: 1 }}>{SPARK}</span>
          <span>mais</span>
        </div>
      </div>

      {/* Desktop: coluna lateral vertical, mais recente no topo, ~6 meses */}
      <div className="hidden lg:flex flex-col gap-0.5" role="img" aria-label="Grade de atividade">
        {/* Cabeçalho: label de mês (vazio) + dias da semana */}
        <div className="flex items-center gap-1 mb-1">
          <span className="w-7 shrink-0" aria-hidden="true" />
          <div className="flex gap-0.5">
            {DAY_LABELS.map((label, i) => (
              <span
                key={i}
                className="flex items-center justify-center text-[9px] select-none"
                style={{ width: 16, color: 'var(--muted-foreground)', opacity: 0.5 }}
                aria-hidden="true"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {desktopGrid.map((week) => {
          const monthLabel = getMonthLabel(week)
          return (
            <div key={week.mondayISO} className="flex items-center gap-1">
              <span
                className="w-7 text-right text-[9px] shrink-0 select-none leading-none"
                style={{ color: 'var(--muted-foreground)', opacity: monthLabel ? 0.7 : 0 }}
                aria-hidden="true"
              >
                {monthLabel}
              </span>
              <div className="flex gap-0.5">
                {week.days.map((day) => (
                  <CellButton
                    key={day.dateISO}
                    dateISO={day.dateISO}
                    count={day.count}
                    onClick={onCellClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: faixa horizontal, 13 semanas, scroll sem scrollbar */}
      <div
        className="lg:hidden flex flex-col gap-1 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-0.5" role="img" aria-label="Grade de atividade">
          {mobileGrid.map((week) => (
            <div key={week.mondayISO} className="flex flex-col gap-0.5 shrink-0">
              {week.days.map((day) => (
                <CellButton
                  key={day.dateISO}
                  dateISO={day.dateISO}
                  count={day.count}
                  onClick={onCellClick}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Rótulos de mês alinhados às colunas de semana */}
        <div className="flex gap-0.5" aria-hidden="true">
          {mobileGrid.map((week) => (
            <span
              key={week.mondayISO}
              className="shrink-0 text-[9px] leading-none select-none"
              style={{ width: 16, color: 'var(--muted-foreground)', opacity: getMonthLabel(week) ? 0.7 : 0 }}
            >
              {getMonthLabel(week)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
