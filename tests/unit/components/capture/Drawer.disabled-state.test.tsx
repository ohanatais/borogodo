import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — estado do botão Registrar', () => {
  it('começa desabilitado quando o texto está vazio e não há anexo', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'drawer.submitButton' })).toBeDisabled()
  })

  it('fica habilitado assim que há texto não-vazio', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } })

    expect(screen.getByRole('button', { name: 'drawer.submitButton' })).toBeEnabled()
  })

  it('volta a ficar desabilitado se o texto for apagado', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'algo' } })
    expect(screen.getByRole('button', { name: 'drawer.submitButton' })).toBeEnabled()

    fireEvent.change(textarea, { target: { value: '' } })
    expect(screen.getByRole('button', { name: 'drawer.submitButton' })).toBeDisabled()
  })
})
