import { render, screen } from '@testing-library/react'
import { MediaSlot } from '../MediaSlot'

describe('MediaSlot', () => {
  it('reserves the fixed aspect ratio (anchor against layout shift)', () => {
    const { container } = render(
      <MediaSlot aspect="16/9" kind="placeholder" label="demo">
        <span>conteudo</span>
      </MediaSlot>,
    )
    const box = container.firstChild as HTMLElement
    expect(box.style.aspectRatio).toBe('16/9')
  })

  it('renders placeholder children and note', () => {
    render(
      <MediaSlot aspect="4/3" kind="placeholder" label="demo" note="em breve">
        <span>conteudo</span>
      </MediaSlot>,
    )
    expect(screen.getByText('conteudo')).toBeInTheDocument()
    expect(screen.getByText('em breve')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'demo' })).toBeInTheDocument()
  })

  it('throws when kind is video without a poster (FR-017)', () => {
    expect(() =>
      render(<MediaSlot aspect="16/9" kind="video" label="demo" src="/x.mp4" />),
    ).toThrow()
  })
})
