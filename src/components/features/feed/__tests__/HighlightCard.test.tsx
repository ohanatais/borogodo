import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HighlightCard } from '../HighlightCard'
import type { FeedHighlight } from '@/lib/feed/types'

const BASE_HIGHLIGHT: FeedHighlight = {
  id: 'highlight-1',
  title: 'Redução de 50% no tempo de investigação de bug crítico',
  metric: '50%',
  impact: 'Menos tempo parado no time',
  tags: ['devops'],
}

// Revisão pós-implementação: destaque deixou de ter edição/exclusão isolada — é exibição pura,
// derivada do "Organizar". Editar/excluir agora vivem só no nível do registro (SourceCard/Drawer).
describe('HighlightCard (US4, feature 026 — exibição pura, sem edição isolada)', () => {
  it('FR-017 — aberto por padrão quando é o único destaque (defaultOpen=true)', () => {
    render(<HighlightCard highlight={BASE_HIGHLIGHT} defaultOpen />)

    expect(screen.getByText('Menos tempo parado no time')).toBeInTheDocument()
  })

  it('FR-017 — colapsado por padrão quando defaultOpen=false, mostrando só título/métrica', () => {
    render(<HighlightCard highlight={BASE_HIGHLIGHT} defaultOpen={false} />)

    expect(screen.getByText(BASE_HIGHLIGHT.title as string)).toBeInTheDocument()
    expect(screen.queryByText('Menos tempo parado no time')).not.toBeInTheDocument()
  })

  it('FR-018 — não exibe métrica quando ausente, e não trata isso como erro', () => {
    const noMetric: FeedHighlight = { ...BASE_HIGHLIGHT, metric: null, title: 'Aprendizado sobre observabilidade' }
    render(<HighlightCard highlight={noMetric} defaultOpen />)

    expect(screen.getByText('Aprendizado sobre observabilidade')).toBeInTheDocument()
    expect(screen.queryByText('highlight.metricLabel')).not.toBeInTheDocument()
  })

  it('não expõe botões de editar/excluir — só o registro inteiro pode ser editado/excluído (SourceCard/Drawer)', () => {
    render(<HighlightCard highlight={BASE_HIGHLIGHT} defaultOpen />)

    expect(screen.queryByRole('button', { name: 'highlight.edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'highlight.delete' })).not.toBeInTheDocument()
  })
})
