import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DetailsFields } from '../DetailsFields'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'

const EMPTY_VALUES: DrawerManualFields = {
  metric: '',
  impact: '',
  tags: '',
  company: '',
  entryDate: '',
}

/**
 * T025 (US1, feature 026): "+ adicionar detalhes" (herdado da 025) continua vazio/editável
 * independente de o Organizar já ter rodado — nenhuma chamada de rede, nenhuma dependência do
 * estado de organização da fonte (FR-001 acceptance #4). Regressão: este componente nunca deve
 * ganhar acoplamento com `organizeEntry`/`POST /organize`.
 */
describe('DetailsFields — sem regressão pós-026 (organizar não interfere)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('campos aparecem vazios por padrão ao expandir, sem depender de organização prévia', () => {
    render(<DetailsFields values={EMPTY_VALUES} onChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    expect(screen.getByLabelText('detailsFields.metricLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.impactLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.tagsLabel')).toHaveValue('')
    expect(screen.getByLabelText('detailsFields.companyLabel')).toHaveValue('')
  })

  it('editar um campo manualmente não dispara nenhuma chamada de rede (sem pedágio de IA)', () => {
    const onChange = vi.fn()
    render(<DetailsFields values={EMPTY_VALUES} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    fireEvent.change(screen.getByLabelText('detailsFields.impactLabel'), { target: { value: 'Reduziu o tempo de resposta' } })

    expect(onChange).toHaveBeenCalledWith('impact', 'Reduziu o tempo de resposta')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('a seção começa colapsada e a abertura é puramente local (sem fetch)', () => {
    render(<DetailsFields values={EMPTY_VALUES} onChange={() => {}} />)

    expect(screen.queryByLabelText('detailsFields.metricLabel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    expect(screen.getByLabelText('detailsFields.metricLabel')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
