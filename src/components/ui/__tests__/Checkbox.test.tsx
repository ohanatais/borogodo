import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Checkbox } from '../Checkbox'

describe('Checkbox', () => {
  it('renders unchecked by default', () => {
    render(<Checkbox checked={false} onChange={() => {}} ariaLabel="opt-in" />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('renders checked when checked is true', () => {
    render(<Checkbox checked onChange={() => {}} ariaLabel="opt-in" />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onChange with the new value when toggled', () => {
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} ariaLabel="opt-in" />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('exposes the accessible name via ariaLabel', () => {
    render(<Checkbox checked={false} onChange={() => {}} ariaLabel="opt-in" />)
    expect(screen.getByRole('checkbox', { name: 'opt-in' })).toBeInTheDocument()
  })
})
