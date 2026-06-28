import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { MotionProvider } from '@/components/providers/MotionProvider'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  // Placeholder (SVG) enquanto a arte real do card não existe; trocar por .png depois (FR-026).
  const ogImage = '/og/espelho-prova.svg'
  return {
    metadataBase: new URL('https://borogodo.ai'),
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [{ url: ogImage }],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [ogImage],
    },
  }
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <MotionProvider>
        {children}
      </MotionProvider>
    </NextIntlClientProvider>
  )
}
