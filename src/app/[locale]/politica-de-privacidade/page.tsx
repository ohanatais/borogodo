import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/features/legal/LegalPage'
import { politicaDePrivacidadeSections } from '@/content/legal/politica-de-privacidade'

export async function generateMetadata() {
  const t = await getTranslations('legal.privacyPage')
  return { title: t('title') + ' — Borogodó' }
}

export default function PoliticaDePrivacidadePage() {
  return <LegalPage namespace="privacyPage" sections={politicaDePrivacidadeSections} />
}
