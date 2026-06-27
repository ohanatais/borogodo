import { render, screen } from '@testing-library/react'
import { JourneySection } from '../JourneySection'
import { ProofSection } from '../ProofSection'
import { OwnershipSection } from '../OwnershipSection'
import { ManifestoSection } from '../ManifestoSection'
import { SocialProofSection } from '../SocialProofSection'
import { FaqSection } from '../FaqSection'
import { faqItems } from '../faqData'

describe('JourneySection (4 verbos)', () => {
  it('renders the 4 journey steps as an ordered list', () => {
    const { container } = render(<JourneySection />)
    expect(container.querySelectorAll('ol > li')).toHaveLength(4)
  })

  it('exposes the "como-funciona" anchor', () => {
    const { container } = render(<JourneySection />)
    expect(container.querySelector('#como-funciona')).toBeInTheDocument()
  })

  it('has a single section heading at level 2', () => {
    render(<JourneySection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})

describe('ProofSection', () => {
  it('exposes the "provas" anchor and a media slot', () => {
    const { container } = render(<ProofSection />)
    expect(container.querySelector('#provas')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'mediaLabel' })).toBeInTheDocument()
  })
})

describe('OwnershipSection', () => {
  it('exposes the "privacidade" anchor and 4 privacy signals', () => {
    const { container } = render(<OwnershipSection />)
    expect(container.querySelector('#privacidade')).toBeInTheDocument()
    expect(container.querySelectorAll('ul > li')).toHaveLength(4)
  })
})

describe('ManifestoSection', () => {
  it('renders a level 2 heading', () => {
    render(<ManifestoSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})

describe('SocialProofSection', () => {
  it('links to the founder LinkedIn (build-in-public, no fake testimonial)', () => {
    const { container } = render(<SocialProofSection />)
    const link = container.querySelector('a[target="_blank"]')
    expect(link).toBeInTheDocument()
    expect(link?.getAttribute('href')).toContain('linkedin.com')
  })
})

describe('FaqSection', () => {
  it('renders every faqData question as a details element (SC-004 source)', () => {
    const { container } = render(<FaqSection />)
    expect(container.querySelectorAll('details')).toHaveLength(faqItems.length)
  })

  it('exposes the "perguntas" anchor', () => {
    const { container } = render(<FaqSection />)
    expect(container.querySelector('#perguntas')).toBeInTheDocument()
  })
})
