import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRouterRefresh = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}))

vi.stubGlobal('fetch', mockFetch)

import { Drawer } from '@/components/features/capture/Drawer'

function makeImageFile(name = 'foto.png'): File {
  return new File(['conteudo-fake'], name, { type: 'image/png' })
}

beforeEach(() => {
  mockRouterRefresh.mockReset()
  mockFetch.mockReset()
})

describe('Drawer — anexar imagem via clique (US2)', () => {
  it('mostra miniatura real assim que um arquivo é escolhido, antes de salvar', () => {
    const { container } = render(<Drawer open onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'attach.imageAriaLabel' }))

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = makeImageFile()
    fireEvent.change(fileInput, { target: { files: [file] } })

    const preview = screen.getByAltText('attach.imageAlt') as HTMLImageElement
    expect(preview).toBeInTheDocument()
    expect(preview.src).toContain('blob:')

    // Nenhuma chamada de rede acontece só por anexar — upload só depois de "Registrar".
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
