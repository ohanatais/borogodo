import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}))

import UsarPage from '../page'

describe('UsarPage — splash de intenção', () => {
  it('mantém Conteúdo visível como em breve e deixa apenas Preparo acessível', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]')).map(
      (a) => a.getAttribute('href') || ''
    )
    expect(links).not.toContain('/presenca?hub=mostrar')
    expect(links).toContain('/presenca?hub=preparar')
    expect(document.querySelector('[aria-disabled="true"]')).not.toBeNull()
  })

  it('expõe exatamente um caminho navegável', async () => {
    render(await UsarPage())
    const links = Array.from(document.querySelectorAll('a[href]'))
    expect(links).toHaveLength(1)
  })
})
