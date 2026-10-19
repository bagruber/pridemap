// Generates the share images: a card over the real map, per event.
//
//   node scripts/og-images.mjs                 incremental (skips existing)
//   node scripts/og-images.mjs --force         regenerate everything
//   node scripts/og-images.mjs --only <slug>   a single event
//   node scripts/og-images.mjs --story <slug>  1080×1920 story version
//
// Output lands in og-cache/ (gitignored); the prerenderer copies it to dist/og/.
// Map background is stitched from CARTO's raster tiles — no WebGL, no app boot.
import fs from 'fs'
import path from 'path'
import os from 'os'
import { chromium } from 'playwright-core'
import {
  buildSlugMap, cityName, countryName, formatDate, isFirstTime, escapeHtml, YEAR,
  TOKENS, PRIDE_STOPS, T,
} from './lib/pages.mjs'

// Outside public/ on purpose: only the canonical build copies these into dist,
// so the GitHub Pages mirror isn't carrying ~150 MB it never serves.
const OUT = './og-cache'
const STORY_OUT = './og-cache/story'
// CARTO's raster basemap started answering every request with an "API KEY
// REQUIRED" tile — HTTP 200, so nothing errored, the cards just came out
// stamped. The app has always drawn the vector style instead, which needs no
// key, so the card draws the same map the app does.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const ZOOM = 9
const TS = 256                       // CSS px per tile (@2x asset = 512 physical)
// Each page now loads a vector style instead of fetching four raster tiles,
// so the work is less network and more waiting on one map to settle.
const CONCURRENCY = 8

// The bundled copy, not a CDN: the build should not depend on one more host.
// Added with addScriptTag rather than inlined — a 1.3 MB data URI inside
// setContent pushed single pages past the 30 s timeout.
const MAPLIBRE_JS = './node_modules/maplibre-gl/dist/maplibre-gl.js'
const MAPLIBRE_CSS = fs.readFileSync('./node_modules/maplibre-gl/dist/maplibre-gl.css', 'utf8')

const args = process.argv.slice(2)
const has = f => args.includes(f)
const valOf = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null }
const FORCE = has('--force')
const ONLY = valOf('--only')
const STORY = valOf('--story')

import { loadPrides } from './lib/data.mjs'

// Every Pride gets a card, with a date or without. Leaving the ones without
// one out would mean 638 of 639 pages shipping a broken hero image through
// the whole off-season.
const parades = loadPrides()
const slugs = buildSlugMap(parades)


// ── Assets ───────────────────────────────────────────────────────────────────
const fontB64 = kind => fs.readFileSync(
  `./node_modules/@fontsource/sofia-sans/files/sofia-sans-latin-${kind}-normal.woff2`
).toString('base64')
const FONT_CSS = `
@font-face{font-family:'Sofia Sans';src:url(data:font/woff2;base64,${fontB64(400)}) format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Sofia Sans';src:url(data:font/woff2;base64,${fontB64(700)}) format('woff2');font-weight:700;font-display:block}`

const PRIDE = PRIDE_STOPS.join(',')

// ── Template ─────────────────────────────────────────────────────────────────
function template(p, { w, h, story }) {
  const lang = 'de'
  const city = cityName(lang, p)
  const country = countryName(lang, p.country)
  const first = isFirstTime(p)
  // No date yet: say so, and let last year's stand in as the only hint there
  // is. A guessed date on a card that gets shared is the worst place for one.
  const date = p.open
    ? `Termin ${p.year} noch offen`
    : formatDate(lang, p.date)
  const sub = p.open && p.lastDate ? `${p.lastYear} war am ${formatDate(lang, p.lastDate)}` : null
  const wasDate = p.movedFrom ? formatDate(lang, p.movedFrom) : null
  const pinY = story ? 0.26 : 0.29           // shared by the map anchor and the pin

  const S = story
    ? { name: 74, city: 34, date: 30, pad: 64, badge: 17, brand: 24 }
    : { name: 52, city: 24, date: 22, pad: 46, badge: 13, brand: 17 }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
${MAPLIBRE_CSS}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:#0e0e0e;
  font-family:'Sofia Sans',system-ui,sans-serif;color:${TOKENS.text};-webkit-font-smoothing:antialiased}
.map{position:absolute;inset:0;overflow:hidden;
  /* CARTO's dark basemap is near-black; lift it so it still reads behind the card */
  filter:brightness(1.75) saturate(1.15) contrast(1.05)}
.maplibregl-ctrl-attrib,.maplibregl-ctrl-logo{display:none !important}
.scrim{position:absolute;inset:0;background:
  linear-gradient(to top,rgba(8,8,8,.96) 0%,rgba(8,8,8,.88) ${story ? 34 : 40}%,rgba(8,8,8,.2) ${story ? 58 : 68}%,rgba(8,8,8,0) 100%)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,transparent 45%,rgba(0,0,0,.4) 100%)}
.pin{position:absolute;left:50%;top:${pinY * 100}%;transform:translate(-50%,-50%)}
.pin i{display:block;width:${story ? 26 : 20}px;height:${story ? 26 : 20}px;border-radius:50%;
  background:${TOKENS.accent};border:${story ? 4 : 3}px solid #fff;box-shadow:0 0 0 ${story ? 10 : 8}px rgba(255,45,120,.22),0 6px 20px rgba(0,0,0,.6)}
/* Stories: keep everything clear of Instagram's bottom reply UI */
.card{position:absolute;left:0;right:0;bottom:0;padding:${S.pad}px;padding-bottom:${story ? 200 : S.pad}px}
.bar{height:5px;border-radius:3px;width:${story ? 150 : 110}px;margin-bottom:${story ? 26 : 18}px;
  background:linear-gradient(90deg,${PRIDE})}
.badge{display:inline-flex;align-items:center;gap:6px;padding:${story ? '6px 15px' : '4px 11px'};
  border-radius:24px;font-size:${S.badge}px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;
  color:${TOKENS.premiere};background:rgba(255,212,71,.14);border:1.5px solid rgba(255,212,71,.5);
  margin-bottom:${story ? 20 : 13}px}
.badge-moved{color:${TOKENS.accent};background:rgba(255,45,120,.14);border-color:rgba(255,45,120,.5)}
/* The old date rides along struck through: the card is the only place someone
   who bookmarked the June date will ever see the correction. */
.was{font-weight:400;color:#9a9a9a;font-size:${Math.round(S.date * 0.72)}px;
  /* Story dates wrap, so the strike-through gets its own line there */
  ${story ? 'display:block;margin-top:8px' : 'margin-left:10px'}}
h1{font-size:${S.name}px;line-height:1.05;font-weight:700;letter-spacing:-1px;
  margin-bottom:${story ? 16 : 11}px;text-shadow:0 2px 24px rgba(0,0,0,.7)}
.where{font-size:${S.city}px;color:#c8c8c8;margin-bottom:${story ? 10 : 6}px}
.date{font-size:${S.date}px;font-weight:700;color:#fff}
.date-open{color:#c8c8c8}
.sub{font-size:${Math.round(S.date * 0.78)}px;color:#9a9a9a;margin-top:${story ? 10 : 5}px}
.foot{position:absolute;left:${S.pad}px;right:${S.pad}px;bottom:${story ? 120 : 18}px;
  display:flex;justify-content:space-between;align-items:flex-end;
  font-size:${story ? 17 : 12}px;color:${TOKENS.muted}}
.brand{font-size:${S.brand}px;font-weight:700;background:linear-gradient(90deg,${PRIDE});
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.attr{font-size:${story ? 13 : 10}px;color:#6a6a6a}
</style></head><body>
<div class="map" id="map"></div>
<div class="vig"></div><div class="scrim"></div>
<div class="pin"><i></i></div>
<div class="card">
  <div class="bar"></div>
  ${first ? `<div class="badge">✦ Premiere ${YEAR}</div>` : ''}
  ${wasDate ? `<div class="badge badge-moved">↻ ${escapeHtml(T[lang].rescheduled)}</div>` : ''}
  <h1>${escapeHtml(p.name)}</h1>
  <div class="where">${escapeHtml(city)}${p.region ? ` · ${escapeHtml(p.region)}` : ''} · ${escapeHtml(country)}</div>
  <div class="date${p.open ? ' date-open' : ''}">${escapeHtml(date)}${wasDate ? `<s class="was">${escapeHtml(wasDate)}</s>` : ''}</div>
  ${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ''}
</div>
<div class="foot"><span class="brand">pridemap.net</span><span class="attr">© CARTO · © OpenStreetMap</span></div>
<script id="mapcfg" type="application/json">${JSON.stringify({
    style: MAP_STYLE, center: [p.lon, p.lat], zoom: story ? ZOOM + 1 : ZOOM,
    padBottom: (0.5 - pinY) * 2 * h,
  })}</script>
</body></html>`
}

// ── Browser ──────────────────────────────────────────────────────────────────
function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH
  const roots = [
    path.join(os.homedir(), 'AppData/Local/ms-playwright'),
    path.join(os.homedir(), '.cache/ms-playwright'),
    '/ms-playwright',
  ]
  const rels = [
    'chrome-win64/chrome.exe', 'chrome-win/chrome.exe',
    'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  ]
  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const dir of fs.readdirSync(root).filter(d => d.startsWith('chromium-')).sort().reverse()) {
      for (const rel of rels) {
        const exe = path.join(root, dir, rel)
        if (fs.existsSync(exe)) return exe
      }
    }
  }
  return null
}

async function run() {
  const targets = STORY
    ? parades.filter(p => slugs.get(p.id) === STORY)
    : ONLY
      ? parades.filter(p => slugs.get(p.id) === ONLY)
      : parades.filter(p => p.lat != null && p.lon != null)

  if (!targets.length) {
    console.error(`No matching event${STORY || ONLY ? ` for slug "${STORY || ONLY}"` : ''}.`)
    process.exit(1)
  }

  const outDir = STORY ? STORY_OUT : OUT
  fs.mkdirSync(outDir, { recursive: true })

  // The card shows the date, so the date belongs in the cache key — otherwise
  // a Pride that moves keeps last season's picture forever.
  const stamp = p => path.join(outDir, `.${slugs.get(p.id)}.${p.date ?? `open-${p.year}`}`)
  const todo = targets.filter(p => {
    if (FORCE || STORY) return true
    return !fs.existsSync(path.join(outDir, `${slugs.get(p.id)}.jpg`)) || !fs.existsSync(stamp(p))
  })

  if (!todo.length) {
    console.log(`Share images: up to date (${targets.length} events, nothing to regenerate).`)
    return
  }

  const exe = findChromium()
  if (!exe) {
    console.error('Chromium not found. Install it with:  npx playwright install chromium')
    console.error('or point PLAYWRIGHT_CHROMIUM_PATH at an existing binary.')
    process.exit(1)
  }

  const size = STORY ? { w: 540, h: 960 } : { w: 600, h: 315 }
  // Without the ANGLE/SwiftShader flags the map canvas stays black in headless
  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const ctx = await browser.newContext({
    viewport: { width: size.w, height: size.h },
    deviceScaleFactor: 2,          // → 1200×630 / 1080×1920
  })

  let done = 0
  const queue = [...todo]
  const worker = async () => {
    const page = await ctx.newPage()
    while (queue.length) {
      const p = queue.shift()
      const slug = slugs.get(p.id)
      try {
        await page.setContent(template(p, { ...size, story: !!STORY }), { waitUntil: 'load' })
        await page.addScriptTag({ path: MAPLIBRE_JS })
        await page.evaluate(() => new Promise(resolve => {
          // Put the Pride where the pin is, not in the middle of the frame
          const cfg = JSON.parse(document.getElementById('mapcfg').textContent)
          const m = new maplibregl.Map({
            container: 'map', style: cfg.style, center: cfg.center, zoom: cfg.zoom,
            interactive: false, attributionControl: false, fadeDuration: 0,
          })
          m.on('load', () => {
            m.setPadding({ top: 0, right: 0, bottom: cfg.padBottom, left: 0 })
            m.once('idle', resolve)
          })
          // A missing tile must not hold the whole build hostage
          setTimeout(resolve, 20000)
        }))
        await page.evaluate(async () => { await document.fonts.ready })
        await page.screenshot({ path: path.join(outDir, `${slug}.jpg`), type: "jpeg", quality: 80 })
        if (!STORY) {
          for (const old of fs.readdirSync(outDir)) {
            if (old.startsWith(`.${slug}.`)) fs.unlinkSync(path.join(outDir, old))
          }
          fs.writeFileSync(stamp(p), '')
        }
      } catch (err) {
        console.warn(`  ! ${slug}: ${err.message}`)
      }
      if (++done % 50 === 0 || done === todo.length) {
        process.stdout.write(`\r  ${done}/${todo.length}`)
      }
    }
    await page.close()
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
  await browser.close()
  process.stdout.write('\n')
  console.log(`Share images: ${done} written to ${outDir} (${STORY ? '1080×1920 story' : '1200×630'}).`)
}

run()
