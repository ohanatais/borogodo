import { render } from '@testing-library/react'
import { StructuredData } from '../StructuredData'
import { faqItems } from '../faqData'

function getJsonLdBlocks(container: HTMLElement) {
  return Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map((el) =>
    JSON.parse(el.innerHTML),
  )
}

describe('StructuredData', () => {
  it('injects three JSON-LD blocks (Software, Organization, FAQPage)', () => {
    const { container } = render(<StructuredData />)
    const blocks = getJsonLdBlocks(container)
    const types = blocks.map((b) => b['@type'])
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('Organization')
    expect(types).toContain('FAQPage')
  })

  it('FAQPage has one entry per faqData item (SC-004)', () => {
    const { container } = render(<StructuredData />)
    const faq = getJsonLdBlocks(container).find((b) => b['@type'] === 'FAQPage')
    expect(faq.mainEntity).toHaveLength(faqItems.length)
  })
})
