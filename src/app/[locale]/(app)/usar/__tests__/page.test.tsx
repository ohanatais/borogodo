import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))

import UsarPage from '../page'

describe('UsarPage — splash de intenção', () => {
  it('renderiza os dois caminhos: Conteúdo e Preparo', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href') || ''
    )
    // Cada caminho leva a um hub ESCOPADO do Repertório — não à tela com tudo (021).
    expect(links).toContain('/presenca?hub=mostrar')
    expect(links).toContain('/presenca?hub=preparar')
  })

  it('expõe exatamente dois caminhos (sem card-grid de opções extras)', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]'))
    expect(links).toHaveLength(2)
  })
})
