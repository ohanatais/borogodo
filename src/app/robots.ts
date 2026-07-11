import type { MetadataRoute } from 'next'

const SITE_URL = 'https://borogodo.ai'

/**
 * Regras de crawler (feature 022). Libera crawlers de busca E de IA (FR-024) para que a LP
 * possa ser indexada e citada por motores generativos (GEO). Sem bloqueio por user-agent.
 * Confirmar que CDN/Cloudflare também não bloqueia é passo de operação, fora do código.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
