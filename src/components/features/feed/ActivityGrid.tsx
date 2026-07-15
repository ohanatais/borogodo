'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Flame } from 'lucide-react'
import type { ActivityCell } from '@/lib/feed/types'

interface ActivityGridProps {
  cells: ActivityCell[]
  onCellClick: (date: string) => void
}

// Mostra a grade assim que houver qualquer registro na janela.
export const GRID_MIN_DISTINCT_DAYS = 1
const WEEKS_DESKTOP = 24
const WEEKS_MOBILE = 14
const CELL_DESKTOP = 13
const CELL_MOBILE = 11
const GAP = 3

// Só seg/qua/sex rotulados (padrão de calendário de atividade) — os demais dias ficam em branco.
const DAY_LABELS = ['seg', '', 'qua', '', 'sex', '', '']

/** Nível 0-4 de intensidade a partir da contagem do dia — alimenta a cor do quadrado. */
function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/** Cor de cada nível — sempre o coral da marca (`--color-accent`), variando a mistura com
 * `--muted` em vez de introduzir uma escala de cor nova. */
function levelColor(level: number): string {
  if (level === 0) return 'var(--muted)'
  const mix = level === 1 ? 35 : level === 2 ? 55 : level === 3 ? 75 : 100
  return mix === 100 ? 'var(--color-accent)' : `color-mix(in oklch, var(--color-accent) ${mix}%, var(--muted))`
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

// Rótulo de mês só na semana que contém o dia 1 — evita duplicatas.
function getMonthLabel(week: GridWeek): string {
  const firstDay = week.days.find((d) => new Date(d.dateISO + 'T12:00:00').getDate() === 1)
  if (!firstDay) return ''
  return new Date(firstDay.dateISO + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })
}

function GridBody({
  cells,
  weeks,
  cellSize,
  onCellClick,
}: {
  cells: ActivityCell[]
  weeks: number
  cellSize: number
  onCellClick: (date: string) => void
}) {
  const grid = useMemo(() => buildGrid(cells, weeks), [cells, weeks])
  const rowHeight = cellSize + GAP

  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex flex-col justify-between shrink-0 py-0.5" style={{ height: 7 * rowHeight }}>
        {DAY_LABELS.map((label, i) => (
          <span key={i} className="text-[9px] leading-none select-none" style={{ height: cellSize, color: 'var(--muted-foreground)' }}>
            {label}
          </span>
        ))}
      </div>

      <div>
        <div className="flex" style={{ gap: GAP }}>
          {grid.map((week) => (
            <div key={week.mondayISO} className="flex flex-col" style={{ gap: GAP }}>
              {week.days.map((day) => (
                <button
                  key={day.dateISO}
                  type="button"
                  aria-label={`${day.dateISO}: ${day.count} registro${day.count !== 1 ? 's' : ''}`}
                  onClick={() => day.count > 0 && onCellClick(day.dateISO)}
                  disabled={day.count === 0}
                  className="transition-transform disabled:cursor-default hover:scale-125"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 3,
                    background: levelColor(getLevel(day.count)),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5" style={{ width: weeks * rowHeight }}>
          {grid.map((week) => (
            <span key={week.mondayISO} className="text-[9.5px] leading-none select-none" style={{ color: 'var(--muted-foreground)' }}>
              {getMonthLabel(week)}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 ml-auto shrink-0 self-end pb-4">
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>menos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} style={{ width: 10, height: 10, borderRadius: 2, background: levelColor(level) }} />
          ))}
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>mais</span>
        </div>
      </div>
    </div>
  )
}

/** Contagem real (não mockada) de registros/meses cobertos pela janela de células recebida —
 * alimenta o subtítulo "N registros em M meses" da grade-faísca. */
function useGridStats(cells: ActivityCell[]) {
  return useMemo(() => {
    const activeCells = cells.filter((c) => c.count > 0)
    const totalRegistros = activeCells.reduce((sum, c) => sum + c.count, 0)
    const monthKeys = new Set(activeCells.map((c) => c.date.slice(0, 7)))
    return { totalRegistros, monthCount: monthKeys.size }
  }, [cells])
}

export function ActivityGrid({ cells, onCellClick }: ActivityGridProps) {
  const t = useTranslations('feed')
  const { totalRegistros, monthCount } = useGridStats(cells)

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} role="img" aria-label="Grade de atividade">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Flame size={16} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
        <span className="font-display font-semibold text-[15px]" style={{ color: 'var(--foreground)' }}>
          {t('grid.title')}
        </span>
        {totalRegistros > 0 && (
          <span className="text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
            · {t('grid.subtitle', { count: totalRegistros, months: monthCount })}
          </span>
        )}
      </div>

      <div className="lg:hidden">
        <GridBody cells={cells} weeks={WEEKS_MOBILE} cellSize={CELL_MOBILE} onCellClick={onCellClick} />
      </div>
      <div className="hidden lg:block">
        <GridBody cells={cells} weeks={WEEKS_DESKTOP} cellSize={CELL_DESKTOP} onCellClick={onCellClick} />
      </div>
    </section>
  )
}
