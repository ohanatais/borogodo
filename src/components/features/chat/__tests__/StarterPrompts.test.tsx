import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StarterPrompts } from '../StarterPrompts'
import { PREP_MOMENTS } from '@/lib/content/intentions'

describe('StarterPrompts', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ starters: ['do servidor'] }) }) as unknown as typeof fetch
  })
  afterEach(() => vi.restoreAllMocks())

  it('no modo preparação usa os starters do momento sem chamar o servidor', () => {
    render(<StarterPrompts onSelect={() => {}} moment="entrevista" />)
    expect(screen.getByText(PREP_MOMENTS.entrevista.starters[0])).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sem momento, busca os starters do servidor', async () => {
    render(<StarterPrompts onSelect={() => {}} />)
    expect(await screen.findByText('do servidor')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/starters')
  })
})
