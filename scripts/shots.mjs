// Werkbuch screenshots: scripts/shots.mjs <vorher|nachher> [label]
// Needs a dev server on 5173. Without the ANGLE/SwiftShader flags the map
// stays black in headless Chrome.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const phase = process.argv[2]
const label = process.argv[3] ?? ''
if (!['vorher', 'nachher'].includes(phase)) {
  console.error('Usage: node scripts/shots.mjs <vorher|nachher> [label]')
  process.exit(1)
}

const BASE = 'http://localhost:5173/pridemap/'
const DATES = { nebensaison: '2026-10-19', saison: '2026-06-10' }
const VIEWPORTS = { mobil: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } }

const dir = `werkbuch-bilder/${phase}`
mkdirSync(dir, { recursive: true })

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  for (const [dateName, date] of Object.entries(DATES)) {
    await page.goto(`${BASE}?date=${date}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('.loading-screen', { state: 'detached', timeout: 15000 })
    await page.waitForTimeout(3000)
    const name = [label, dateName, vpName].filter(Boolean).join('-')
    await page.screenshot({ path: `${dir}/${name}.png` })
    console.log(`${dir}/${name}.png`)
  }
  if (errors.length) console.log(`  console errors (${vpName}):`, errors.slice(0, 5))
  await ctx.close()
}

await browser.close()
