import { useTranslations } from 'next-intl'
import { faqItems } from './faqData'

const SITE_URL = 'https://borogodo.ai'

interface JsonLdProps {
  data: Record<string, unknown>
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

/**
 * Dados estruturados da landing (feature 022): SoftwareApplication + Organization + FAQPage.
 * O FAQPage é derivado de `faqData.ts`, a mesma fonte da `FaqSection` (SC-004). Server
 * Component: o JSON-LD vai no HTML servido, legível por crawlers e motores de IA.
 */
export function StructuredData() {
  const tMeta = useTranslations('metadata')
  const tFaq = useTranslations('faq')

  const software = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Borogodó',
    description: tMeta('description'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    inLanguage: 'pt-BR',
    url: SITE_URL,
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Borogodó',
    url: SITE_URL,
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: tFaq(item.questionKey),
      acceptedAnswer: { '@type': 'Answer', text: tFaq(item.answerKey) },
    })),
  }

  return (
    <>
      <JsonLd data={software} />
      <JsonLd data={organization} />
      <JsonLd data={faqPage} />
    </>
  )
}
