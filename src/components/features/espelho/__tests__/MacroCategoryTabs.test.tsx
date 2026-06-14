import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { MacroCategory } from '@/types/mirror'

vi.mock('../SkillTierItem', () => ({
  SkillTierItem: ({ skill }: { skill: { name: string } }) => <div data-testid="skill-item">{skill.name}</div>,
}))

import { MacroCategoryTabs } from '../MacroCategoryTabs'

const CATEGORIES: MacroCategory[] = [
  {
    name: 'Execução',
    skills: [
      { name: 'Entrega rápida', tier: 'Comprovada', evidence_text: 'Evidência.', entry_ids: [] },
      { name: 'Priorização', tier: 'Consistente', evidence_text: 'Outra.', entry_ids: [] },
    ],
  },
  {
    name: 'Insight e Diagnóstico',
    skills: [
      { name: 'Análise de dados', tier: 'Emergente', evidence_text: 'Base.', entry_ids: [] },
    ],
  },
]

describe('MacroCategoryTabs', () => {
  it('returns null when categories is empty', () => {
    const { container } = render(<MacroCategoryTabs categories={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all category tab buttons', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getAllByText('Execução')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Insight e Diagnóstico')[0]).toBeInTheDocument()
  })

  it('first tab is active by default (aria-selected=true)', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('renders skills from the active category', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const skillItems = screen.getAllByTestId('skill-item')
    // First category (Execução) has 2 skills; only active tab panel is in DOM
    const skillNames = skillItems.map((el) => el.textContent)
    expect(skillNames).toContain('Entrega rápida')
    expect(skillNames).toContain('Priorização')
  })

  it('switches active tab on click', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    fireEvent.click(tabs[1])

    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')

    const skillItems = screen.getAllByTestId('skill-item')
    const skillNames = skillItems.map((el) => el.textContent)
    expect(skillNames).toContain('Análise de dados')
  })

  it('renders category title via i18n key', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders skill counts inline on tabs', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    // counts rendered as "· N" inline text; check tab label textContent
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0].textContent).toContain('2')
    expect(tabs[1].textContent).toContain('1')
  })

  it('ArrowRight moves focus to next tab', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    act(() => tabs[0].focus())
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' })
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowLeft wraps from first tab to last', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    act(() => tabs[0].focus())
    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' })
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('Home key moves to first tab', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    fireEvent.click(tabs[1])
    fireEvent.keyDown(tabs[1], { key: 'Home' })
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('End key moves to last tab', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    act(() => tabs[0].focus())
    fireEvent.keyDown(tabs[0], { key: 'End' })
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('non-active tabs have tabIndex=-1', () => {
    render(<MacroCategoryTabs categories={CATEGORIES} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')
  })
})
