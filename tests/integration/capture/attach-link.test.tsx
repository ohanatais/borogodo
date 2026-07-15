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

describe('Drawer — anexar link via botão dedicado (US2)', () => {
  it('cria um tile com o domínio do link colado', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'attach.linkAriaLabel' }))

    const linkInput = screen.getByRole('textbox', { name: 'attach.linkInputLabel' })
    fireEvent.change(linkInput, { target: { value: 'https://www.figma.com/file/abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'attach.linkConfirm' }))

    expect(screen.getByText('figma.com')).toBeInTheDocument()
  })

  it('não detecta URL solta dentro do texto livre — permanece texto normal', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox', { name: 'drawer.textareaAriaLabel' })
    fireEvent.change(textarea, { target: { value: 'confere em https://example.com depois' } })

    expect((textarea as HTMLTextAreaElement).value).toBe('confere em https://example.com depois')
    expect(screen.queryByText('example.com')).not.toBeInTheDocument()
  })
})
