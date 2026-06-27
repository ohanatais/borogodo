import { describe, it, expect, vi } from 'vitest'

const redirect = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect }))

import HistoricoPage from '../page'

describe('HistoricoPage — redirect', () => {
  it('redireciona para /espelho?vista=trajetoria', async () => {
    await HistoricoPage()
    expect(redirect).toHaveBeenCalledWith('/espelho?vista=trajetoria')
  })
})
