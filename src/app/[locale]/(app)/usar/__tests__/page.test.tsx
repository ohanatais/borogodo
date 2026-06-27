import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))

import UsarPage from '../page'

describe('UsarPage — landing de intenção', () => {
  it('renderiza os dois caminhos: Conteúdo (pra fora) e Preparo (pra dentro)', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href') || ''
    )
    expect(links).toContain('/presenca')
    expect(links).toContain('/autoavaliacao')
  })

  it('expõe exatamente dois caminhos (sem card-grid de opções extras)', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]'))
    expect(links).toHaveLength(2)
  })
})
