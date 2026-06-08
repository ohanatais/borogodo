import { chromium } from 'playwright'
import toIco from 'to-ico'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = path.join(root, 'public/brand/exports')
mkdirSync(outDir, { recursive: true })

const markSvg = readFileSync(path.join(root, 'public/brand/mark.svg'), 'utf-8')
const template = readFileSync(path.join(__dirname, 'render.html'), 'utf-8')
const html = template.replaceAll('MARK_SVG', markSvg)

const browser = await chromium.launch()

// ── Mark — favicon / app-icon sizes, rendered at exact pixel dimensions ──────
const iconSizes = [16, 32, 48, 180, 512]
const iconPage = await browser.newPage({ deviceScaleFactor: 1 })
await iconPage.setContent(html, { waitUntil: 'networkidle' })
await iconPage.evaluate(() => document.fonts.ready)

const iconPaths = {}
for (const size of iconSizes) {
  await iconPage.setViewportSize({ width: size, height: size })
  const el = await iconPage.$('#mark-only')
  await el.evaluate((node, s) => {
    node.style.width = `${s}px`
    node.style.height = `${s}px`
  }, size)
  const filePath = path.join(outDir, `mark-${size}.png`)
  await el.screenshot({ path: filePath, omitBackground: true })
  iconPaths[size] = filePath
}
await iconPage.close()

// favicon.ico bundling 16/32/48
const icoBuffer = await toIco([
  readFileSync(iconPaths[16]),
  readFileSync(iconPaths[32]),
  readFileSync(iconPaths[48]),
])
writeFileSync(path.join(outDir, 'favicon.ico'), icoBuffer)

// ── Full logo lockups — rendered at 4x for crisp presentation use ────────────
const lockupPage = await browser.newPage({ deviceScaleFactor: 4 })
await lockupPage.setContent(html, { waitUntil: 'networkidle' })
await lockupPage.evaluate(() => document.fonts.ready)
await lockupPage.setViewportSize({ width: 800, height: 400 })

const lockups = [
  ['lockup-dark', 'logo-roxo-bg.png'],
  ['lockup-light', 'logo-creme-bg.png'],
  ['lockup-transparent-creme', 'logo-transparent-creme-text.png'],
  ['lockup-transparent-roxo', 'logo-transparent-roxo-text.png'],
]
for (const [id, filename] of lockups) {
  const el = await lockupPage.$(`#${id}`)
  await el.screenshot({ path: path.join(outDir, filename), omitBackground: true })
}
await lockupPage.close()

await browser.close()

copyFileSync(path.join(root, 'public/brand/mark.svg'), path.join(outDir, 'mark.svg'))

writeFileSync(
  path.join(outDir, 'README.md'),
  `# Exports da marca Borogodó

Gerado a partir de \`public/brand/mark.svg\` e \`public/brand/logo-preview.html\` via
\`scripts/brand-export/export-logos.mjs\`. Reexecute o script sempre que o mark ou o
wordmark mudarem.

## Mark (favicon / app-icon) — tamanho exato em pixels
- \`mark.svg\` — versão vetorial original
- \`favicon.ico\` — bundle 16/32/48 para \`/favicon.ico\`
- \`mark-16.png\`, \`mark-32.png\`, \`mark-48.png\` — favicon PNG
- \`mark-180.png\` — apple-touch-icon
- \`mark-512.png\` — PWA / app icon / social

## Logo completo (mark + wordmark "borogodó") — renderizado a 4x
- \`logo-roxo-bg.png\` — fundo roxo-jambo, wordmark em creme (uso primário)
- \`logo-creme-bg.png\` — fundo creme, wordmark em roxo-jambo
- \`logo-transparent-creme-text.png\` — fundo transparente, wordmark em creme (sobre fundos escuros/fotos)
- \`logo-transparent-roxo-text.png\` — fundo transparente, wordmark em roxo-jambo (sobre fundos claros)
`
)

console.log('Exports gerados em public/brand/exports/')
