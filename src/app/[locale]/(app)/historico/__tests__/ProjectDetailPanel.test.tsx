import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectDetailPanel } from '@/components/features/historico/ProjectDetailPanel'
import type { HistoricoProject } from '@/lib/historico/getHistoricoData'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const PROJECT: HistoricoProject = {
  name: 'Alpha',
  entries: [
    { id: 'e1', what_i_did: 'Liderou o roadmap', impact: 'Aumentou retention 20%', metric: '20%', evidences: [] },
    { id: 'e2', what_i_did: 'Criou processo de discovery', impact: null, metric: null, evidences: [] },
  ],
}

const noop = () => undefined

describe('ProjectDetailPanel', () => {
  it('renders project name and company', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders all entry what_i_did texts', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText('Liderou o roadmap')).toBeInTheDocument()
    expect(screen.getByText('Criou processo de discovery')).toBeInTheDocument()
  })

  it('renders impact text when present', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText('Aumentou retention 20%')).toBeInTheDocument()
  })

  it('renders metric badge when present', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('renders Evidências label and add buttons for each entry', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    const evidenceLabels = screen.getAllByText('Evidências')
    expect(evidenceLabels).toHaveLength(2)
    const linkButtons = screen.getAllByRole('button', { name: /link/i })
    expect(linkButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders capture invite text', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText(/Tem mais sobre esse projeto/)).toBeInTheDocument()
  })

  it('calls onStartCapture when capture button is clicked', () => {
    const onStartCapture = vi.fn()
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={onStartCapture} />)
    fireEvent.click(screen.getByRole('button', { name: /adicionar via captura/i }))
    expect(onStartCapture).toHaveBeenCalled()
  })

  it('calls onClose when × button is clicked', () => {
    const onClose = vi.fn()
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={onClose} onStartCapture={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /fechar painel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders empty panel when entries is empty', () => {
    const empty: HistoricoProject = { name: 'Vazio', entries: [] }
    render(<ProjectDetailPanel project={empty} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    expect(screen.getByText('Vazio')).toBeInTheDocument()
    expect(screen.queryByText('Evidências')).not.toBeInTheDocument()
  })

  it('shows URL form when + Link is clicked', () => {
    render(<ProjectDetailPanel project={PROJECT} company="Acme Corp" onClose={noop} onStartCapture={noop} />)
    fireEvent.click(screen.getAllByRole('button', { name: /link/i })[0])
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument()
  })
})
