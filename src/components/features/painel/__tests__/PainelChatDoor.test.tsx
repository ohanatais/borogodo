import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const openChatSheet = vi.hoisted(() => vi.fn())
vi.mock('@/components/features/chat/ChatSheet', () => ({ openChatSheet }))

import { PainelChatDoor } from '../PainelChatDoor'

describe('PainelChatDoor', () => {
  it('dispara openChatSheet (modo pergunta) ao acionar', () => {
    render(<PainelChatDoor />)
    openChatSheet.mockClear()
    fireEvent.click(screen.getByRole('button'))
    expect(openChatSheet).toHaveBeenCalledTimes(1)
    // sem args (ou mode pergunta) — o default do ChatSheet é 'pergunta'
    const arg = openChatSheet.mock.calls[0][0]
    expect(arg === undefined || arg.mode === 'pergunta' || arg.mode === undefined).toBe(true)
  })
})
