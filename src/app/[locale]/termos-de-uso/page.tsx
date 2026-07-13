import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/features/legal/LegalPage'
import { termosDeUsoSections } from '@/content/legal/termos-de-uso'

export async function generateMetadata() {
  const t = await getTranslations('legal.termsPage')
  return { title: t('title') + ' — Borogodó' }
}

export default function TermosDeUsoPage() {
  return <LegalPage namespace="termsPage" sections={termosDeUsoSections} />
}
