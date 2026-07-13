import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function makeImageFile(name = 'print.png'): File {
  return new File(['conteudo-fake'], name, { type: 'image/png' })
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — colar imagem da área de transferência (US2)', () => {
  it('vira anexo sem inserir lixo no texto quando o textarea está focado', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox')
    const file = makeImageFile()

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [{ type: 'image/png', getAsFile: () => file }],
      },
    })

    expect(screen.getByAltText('attach.imageAlt')).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toBe('')
  })

  it('ignora paste de texto normal (comportamento padrão do textarea preservado)', () => {
    render(<Drawer open onOpenChange={() => {}} />)

    const textarea = screen.getByRole('textbox')

    fireEvent.paste(textarea, {
      clipboardData: { items: [{ type: 'text/plain', getAsFile: () => null }] },
    })

    expect(screen.queryByAltText('attach.imageAlt')).not.toBeInTheDocument()
  })
})
