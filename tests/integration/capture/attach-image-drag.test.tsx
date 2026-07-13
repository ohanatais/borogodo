import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function makeImageFile(name = 'diagrama.png'): File {
  return new File(['conteudo-fake'], name, { type: 'image/png' })
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — arrastar arquivo de imagem (US2)', () => {
  it('não mostra destaque em repouso', () => {
    render(<Drawer open onOpenChange={() => {}} />)
    expect(screen.queryByTestId('drawer-drag-overlay')).not.toBeInTheDocument()
  })

  it('mostra destaque visual durante o arraste e some ao sair da área', () => {
    render(<Drawer open onOpenChange={() => {}} />)
    const dialog = screen.getByRole('dialog')

    fireEvent.dragOver(dialog, { dataTransfer: {} })
    expect(screen.getByTestId('drawer-drag-overlay')).toBeInTheDocument()

    fireEvent.dragLeave(dialog, { dataTransfer: {} })
    expect(screen.queryByTestId('drawer-drag-overlay')).not.toBeInTheDocument()
  })

  it('solta o arquivo → vira tile, destaque some', () => {
    render(<Drawer open onOpenChange={() => {}} />)
    const dialog = screen.getByRole('dialog')
    const file = makeImageFile()

    fireEvent.dragOver(dialog, { dataTransfer: {} })
    fireEvent.drop(dialog, { dataTransfer: { files: [file] } })

    expect(screen.queryByTestId('drawer-drag-overlay')).not.toBeInTheDocument()
    expect(screen.getByAltText('attach.imageAlt')).toBeInTheDocument()
  })
})
