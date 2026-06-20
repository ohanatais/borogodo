import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AngleSelector } from '../AngleSelector'

describe('AngleSelector', () => {
  it('renderiza os chips Relato e Estudo', () => {
    render(<AngleSelector selected={null} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: /angles\.relato/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /angles\.study/i })).toBeInTheDocument()
  })

  it('chip selecionado tem aria-pressed true', () => {
    render(<AngleSelector selected="study" onSelect={vi.fn()} />)
    const studyBtn = screen.getByRole('button', { name: /angles\.study/i })
    expect(studyBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('chip não selecionado tem aria-pressed false', () => {
    render(<AngleSelector selected="study" onSelect={vi.fn()} />)
    const relatoBtn = screen.getByRole('button', { name: /angles\.relato/i })
    expect(relatoBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('click em Relato chama onSelect com null (volta ao modo padrão)', () => {
    const onSelect = vi.fn()
    render(<AngleSelector selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /angles\.relato/i }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('click em Estudo chama onSelect com "study"', () => {
    const onSelect = vi.fn()
    render(<AngleSelector selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /angles\.study/i }))
    expect(onSelect).toHaveBeenCalledWith('study')
  })

  it('tem role=group e aria-label', () => {
    const { container } = render(<AngleSelector selected={null} onSelect={vi.fn()} />)
    const group = container.querySelector('[role="group"]')
    expect(group).toBeInTheDocument()
    expect(group).toHaveAttribute('aria-label')
  })
})
