import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const openChatSheet = vi.hoisted(() => vi.fn())
vi.mock('@/components/features/chat/ChatSheet', () => ({ openChatSheet }))

import { PainelChatDoor } from '../PainelChatDoor'

describe('PainelChatDoor', () => {
  it('renderiza a porta de pergunta e abre o chat ao clicar', () => {
    render(<PainelChatDoor />)
    const button = screen.getByRole('button', { name: 'ariaLabel' })
    expect(button).toBeInTheDocument()
    button.click()
    expect(openChatSheet).toHaveBeenCalledOnce()
  })
})
