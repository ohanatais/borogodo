import type { MetadataRoute } from 'next'

const SITE_URL = 'https://borogodo.ai'

/**
 * Sitemap (feature 022). Casa com a referência em `robots.ts` (`${SITE_URL}/sitemap.xml`).
 * Só lista páginas públicas e indexáveis: a landing (`/`). As rotas do app (painel, espelho,
 * registros, etc.) são protegidas por login — privadas, ficam de fora. `localePrefix: 'never'`,
 * então a home não leva prefixo de locale.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
