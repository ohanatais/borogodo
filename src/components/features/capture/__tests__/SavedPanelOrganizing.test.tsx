import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SavedPanel } from '../SavedPanel'

describe('SavedPanel — bloco "organizando em segundo plano" (US3/T040, feature 026)', () => {
  it('mostra o aviso de organização em segundo plano junto da confirmação de salvamento', () => {
    render(
      <SavedPanel entryId="entry-1" initialTitle="resolvi um bug hoje" onDone={vi.fn()} />
    )

    expect(screen.getByText('savedPanel.confirmation')).toBeInTheDocument()
    expect(screen.getByText('savedPanel.organizingHint')).toBeInTheDocument()
  })
})
