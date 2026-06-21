import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MirrorContent } from '../MirrorContent'
import type { MirrorSnapshot } from '@/types/mirror'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
  usePathname: vi.fn(() => '/espelho'),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) =>
      <p {...props}>{children}</p>,
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../MirrorFeedback', () => ({
  MirrorFeedback: () => <div data-testid="mirror-feedback" />,
}))

vi.mock('../EvidenceText', () => ({
  EvidenceText: ({ evidence }: { evidence: { text: string } }) => <p>{evidence.text}</p>,
}))

vi.mock('../MacroCategoryTabs', () => ({
  MacroCategoryTabs: () => null,
}))

const snapshot: MirrorSnapshot = {
  id: 'snap-1',
  user_id: 'user-1',
  mirror: {
    intro: 'Você tem uma forma única de transformar caos em ordem.',
    primary_strength: {
      headline: 'Você converte complexidade em clareza.',
      evidence: { text: 'Ficou evidente em 3 projetos de reestruturação.', entry_ids: [] },
    },
    invisible_skill: {
      headline: 'Você cria segurança psicológica sem perceber.',
      evidence: { text: 'Times relatam que se sentem mais à vontade quando você está presente.', entry_ids: [] },
    },
    context_pattern: {
      headline: 'Você performa melhor em ambiguidade.',
      evidence: { text: 'Seus melhores resultados vieram de contextos sem manual.', entry_ids: [] },
    },
    closing: 'O espelho está tomando forma. Cada nova entrada afina o padrão que já aparece aqui.',
    strength_themes: ['Clareza', 'Liderança', 'Adaptabilidade'],
  },
  primary_strength: {
    headline: 'Você converte complexidade em clareza.',
    evidence: { text: 'Ficou evidente em 3 projetos.', entry_ids: [] },
  },
  strength_themes: ['Clareza', 'Liderança', 'Adaptabilidade'],
  entry_count: 12,
  generated_at: '2026-06-09T00:00:00Z',
  resonated: null,
  feedback_text: null,
}

describe('MirrorContent', () => {
  it('renders the intro text', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('Você tem uma forma única de transformar caos em ordem.')).toBeInTheDocument()
  })

  it('renders primary_strength headline and evidence', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('Você converte complexidade em clareza.')).toBeInTheDocument()
    expect(screen.getByText('Ficou evidente em 3 projetos de reestruturação.')).toBeInTheDocument()
  })

  it('renders invisible_skill headline and evidence', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('Você cria segurança psicológica sem perceber.')).toBeInTheDocument()
    expect(screen.getByText('Times relatam que se sentem mais à vontade quando você está presente.')).toBeInTheDocument()
  })

  it('renders context_pattern headline and evidence', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('Você performa melhor em ambiguidade.')).toBeInTheDocument()
    expect(screen.getByText('Seus melhores resultados vieram de contextos sem manual.')).toBeInTheDocument()
  })

  it('renders the closing', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('O espelho está tomando forma. Cada nova entrada afina o padrão que já aparece aqui.')).toBeInTheDocument()
  })

  it('renders each strength theme as a pill', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByText('Clareza')).toBeInTheDocument()
    expect(screen.getByText('Liderança')).toBeInTheDocument()
    expect(screen.getByText('Adaptabilidade')).toBeInTheDocument()
  })

  it('renders the MirrorFeedback component', () => {
    render(<MirrorContent snapshot={snapshot} />)
    expect(screen.getByTestId('mirror-feedback')).toBeInTheDocument()
  })

  it('017: "Criar minha bio" gera uma mini-bio a partir do tema de força principal', () => {
    let captured: { seedType?: string; seedRef?: string; formats?: string[] } | null = null
    const listener = (e: Event) => {
      captured = (e as CustomEvent<typeof captured>).detail
    }
    window.addEventListener('borogodo:presenca-open', listener)
    render(<MirrorContent snapshot={snapshot} />)

    screen.getByRole('button', { name: /bio\.cta/ }).click()
    window.removeEventListener('borogodo:presenca-open', listener)

    expect(captured).toEqual({
      seedType: 'theme',
      seedRef: 'Clareza',
      seedSummary: 'Clareza',
      formats: ['mini_bio'],
    })
  })

  it('017: sem temas de força, a entrada de bio não aparece', () => {
    const noThemes: MirrorSnapshot = {
      ...snapshot,
      mirror: { ...snapshot.mirror, strength_themes: [] },
      strength_themes: [],
    }
    render(<MirrorContent snapshot={noThemes} />)
    expect(screen.queryByRole('button', { name: /bio\.cta/ })).not.toBeInTheDocument()
  })
})
