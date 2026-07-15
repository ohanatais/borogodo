import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EntryCard } from '@/components/features/feed/EntryCard'
import type { FeedItem } from '@/lib/feed/types'

// 025-registro-deposito (US2/T025): confirma que anexos persistidos via
// `POST /api/entries/[id]/evidence` continuam visíveis ao reabrir o registro em `/registros` —
// aqui exercitado no nível do componente que a página do feed renderiza (`EntryCard`), com os
// dados exatamente como `getFeedData` os devolve (evidences populadas a partir da coluna JSONB).
function buildItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'entry-with-evidence',
    title: 'Resolvi o bug do checkout',
    what_i_did: 'Resolvi o bug do checkout que travava o pagamento.',
    source: 'deposito',
    created_at: new Date().toISOString(),
    entry_date: null,
    company: null,
    is_personal_project: false,
    role_title: null,
    metric: null,
    tags: [],
    thumbnail: 'https://cdn.example.com/evidence-files/user/entry/123.png',
    evidences: [
      { type: 'image', value: 'https://cdn.example.com/evidence-files/user/entry/123.png' },
      { type: 'url', value: 'https://figma.com/file/abc', label: 'figma.com' },
    ],
    impact: null,
    decision: null,
    learning: null,
    file_name: null,
    ...overrides,
  }
}

describe('Registro reaberto em /registros mantém anexos visíveis (US2)', () => {
  it('mostra a miniatura da imagem e o link anexados ao expandir o card', () => {
    render(<EntryCard item={buildItem()} variant="feed" />)

    fireEvent.click(screen.getByRole('button', { name: 'card.expand' }))

    expect(screen.getByAltText('attach.imageAlt')).toBeInTheDocument()
    expect(screen.getByText('figma.com')).toBeInTheDocument()
  })
})
