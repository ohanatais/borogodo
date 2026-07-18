import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DetailsFields } from '../DetailsFields'
import type { DrawerManualFields } from '@/hooks/useDrawerDraft'

const EMPTY_VALUES: DrawerManualFields = {
  metric: '',
  impact: '',
  tags: '',
  company: '',
  isPersonalProject: false,
  entryDate: '',
}

/** Host com estado real — pílulas de tag precisam de um `values.tags` que reage ao `onChange`. */
function StatefulDetailsFields() {
  const [values, setValues] = useState(EMPTY_VALUES)
  return (
    <DetailsFields
      values={values}
      onChange={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
    />
  )
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
    // Empresa/projeto pessoal (revisão pós-implementação: virou `ContextPillPicker`, não mais um
    // campo de texto) — vazio por padrão é nenhuma pílula acesa.
    expect(screen.getByRole('button', { name: 'context.personalProjectLabel' })).toHaveAttribute('aria-pressed', 'false')
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

describe('DetailsFields — empresa/projeto pessoal via ContextPillPicker local (revisão pós-implementação, 026)', () => {
  it('selecionar "Projeto pessoal" chama onChange pra isPersonalProject e limpa company', () => {
    const onChange = vi.fn()
    render(<DetailsFields values={{ ...EMPTY_VALUES, company: 'Acme' }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    fireEvent.click(screen.getByRole('button', { name: 'context.personalProjectLabel' }))

    expect(onChange).toHaveBeenCalledWith('company', '')
    expect(onChange).toHaveBeenCalledWith('isPersonalProject', true)
  })
})

describe('DetailsFields — tags como pílulas com X pra remover (revisão pós-implementação, 026)', () => {
  it('Enter commita a tag digitada como pílula e limpa o campo de digitar a próxima', () => {
    render(<StatefulDetailsFields />)
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    const input = screen.getByLabelText('detailsFields.tagsLabel')
    fireEvent.change(input, { target: { value: 'liderança' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByText('liderança')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('digitar com vírgula commita a(s) tag(s) imediatamente, sem precisar de Enter', () => {
    render(<StatefulDetailsFields />)
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    fireEvent.change(screen.getByLabelText('detailsFields.tagsLabel'), {
      target: { value: 'negociação, processo' },
    })

    expect(screen.getByText('negociação')).toBeInTheDocument()
    expect(screen.getByText('processo')).toBeInTheDocument()
  })

  it('clicar no X da pílula remove só aquela tag', () => {
    render(<StatefulDetailsFields />)
    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.toggleLabel' }))

    fireEvent.change(screen.getByLabelText('detailsFields.tagsLabel'), {
      target: { value: 'liderança, processo' },
    })
    expect(screen.getByText('liderança')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'detailsFields.removeTagAriaLabel liderança' }))

    expect(screen.queryByText('liderança')).not.toBeInTheDocument()
    expect(screen.getByText('processo')).toBeInTheDocument()
  })
})
