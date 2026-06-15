import { chromium } from 'playwright'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  // 1. Login with QA credentials
  await page.goto('http://localhost:3000/pt-BR/login')
  await page.screenshot({ path: '/tmp/verify-011-login.png' })

  await page.fill('input[type="email"]', 'borogodo.qa.verify@mailinator.com')
  await page.fill('input[type="password"]', 'TesteQA12345!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/painel/, { timeout: 10000 }).catch(() => {})
  await page.screenshot({ path: '/tmp/verify-011-painel-after-login.png' })
  console.log('After login URL:', page.url())

  // 2. Check /painel - backward compat (QA user has no mirror with categories)
  const cardText = await page.textContent('section[aria-label*="Perfil"]').catch(() => null)
  console.log('Card text (first 200):', (cardText || '').slice(0, 200))
  const skillStrip = await page.locator('text=/comprovad|consistente|emergente/i').count()
  console.log('Skill strip chips count:', skillStrip)
  await page.screenshot({ path: '/tmp/verify-011-painel.png' })

  // 3. Navigate to /espelho
  await page.goto('http://localhost:3000/pt-BR/espelho')
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await page.screenshot({ path: '/tmp/verify-011-espelho.png' })
  const espelhoText = await page.textContent('main').catch(() => '')
  console.log('Espelho page text (first 400):', (espelhoText || '').slice(0, 400))
  
  // Check for empty state message
  const emptyState = await page.locator('text=Continue capturando para ver seus skills').count()
  console.log('Empty state visible:', emptyState)

  // 4. Check for tier hints (if any skill items are present)
  const tierHints = await page.locator('text=/Mais situações|resultado externo comprovado/').count()
  console.log('Tier hint lines count:', tierHints)

  // 5. Check CheckCircle2 icon (svg inside tier badge area)
  const comprovadaBadge = await page.locator('span:has(svg)').count()
  console.log('Badges with SVG icon:', comprovadaBadge)

  await browser.close()
})()
