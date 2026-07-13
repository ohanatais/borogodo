import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
  }
})

/**
 * next-themes aplica a classe `dark`/`light` em `document.documentElement` (attribute="class").
 * Testamos o efeito observável real (a classe muda no <html>), não detalhes internos da lib.
 */
describe('Dark mode — toggle de tema (US6)', () => {
  it('alterna a classe `dark` no elemento raiz ao clicar no ThemeToggle', async () => {
    document.documentElement.className = ''

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggle = screen.getByRole('button')

    fireEvent.click(toggle)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('light')).toBe(true)
    })

    const classAfterFirstClick = document.documentElement.className

    fireEvent.click(toggle)

    await waitFor(() => {
      expect(document.documentElement.className).not.toBe(classAfterFirstClick)
    })
  })
})
