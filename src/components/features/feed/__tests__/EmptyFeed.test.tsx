import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmptyFeed } from '../EmptyFeed'
import { OPEN_DRAWER_EVENT } from '@/components/features/painel/registroTriggerEvents'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'empty.heading': 'Nenhum registro ainda',
    'empty.description': 'Cada história que você conta vira um registro aqui.',
    'empty.cta': 'Registrar minha primeira história',
  })[key] ?? key,
}))

describe('EmptyFeed', () => {
  it('opens the capture drawer without navigating away', () => {
    const onOpen = vi.fn()
    window.addEventListener(OPEN_DRAWER_EVENT, onOpen)
    render(<EmptyFeed />)

    fireEvent.click(screen.getByRole('button', { name: 'Registrar minha primeira história' }))

    expect(onOpen).toHaveBeenCalledOnce()
    window.removeEventListener(OPEN_DRAWER_EVENT, onOpen)
  })
})
