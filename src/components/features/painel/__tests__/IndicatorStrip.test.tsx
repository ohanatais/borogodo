import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { IndicatorStrip } from '../IndicatorStrip'

describe('IndicatorStrip', () => {
  it('renders entry count, months span, strength count and time-since label', () => {
    render(
      <IndicatorStrip entryCount={12} monthsSpan={3} strengthCount={4} daysSince={2} />
    )

    expect(screen.getByText('12 indicators.entries')).toBeInTheDocument()
    expect(screen.getByText('3 indicators.months')).toBeInTheDocument()
    expect(screen.getByText('4 indicators.strengths')).toBeInTheDocument()
    expect(screen.getByText('indicators.timeSince.days')).toBeInTheDocument()
  })

  it('shows "captured today" when daysSince is 0', () => {
    render(<IndicatorStrip entryCount={1} monthsSpan={null} strengthCount={0} daysSince={0} />)
    expect(screen.getByText('indicators.timeSince.today')).toBeInTheDocument()
  })

  it('shows the 1-day label for daysSince 1', () => {
    render(<IndicatorStrip entryCount={1} monthsSpan={null} strengthCount={0} daysSince={1} />)
    expect(screen.getByText('indicators.timeSince.oneDay')).toBeInTheDocument()
  })

  it('shows the week label without an exact number for 7+ days', () => {
    render(<IndicatorStrip entryCount={1} monthsSpan={null} strengthCount={0} daysSince={9} />)
    expect(screen.getByText('indicators.timeSince.week')).toBeInTheDocument()
  })

  it('omits the months indicator when there are not enough dated entries', () => {
    render(<IndicatorStrip entryCount={1} monthsSpan={null} strengthCount={0} daysSince={0} />)
    expect(screen.queryByText(/indicators.months/)).not.toBeInTheDocument()
  })
})
