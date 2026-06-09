import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // pdf-parse uses pdfjs-dist which references a web worker file that doesn't
  // exist in the Next.js server bundle. Loading it as an external package
  // bypasses the bundler and lets Node.js require it directly from node_modules.
  serverExternalPackages: ['pdf-parse'],
}

export default withNextIntl(nextConfig)
