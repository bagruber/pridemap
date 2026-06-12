// Hidden scripted tour for screen recordings, triggered via /?walkthrough.
// Designed for the mobile layout (<768px). Drives the real UI through DOM
// clicks and map gestures with human-ish, jittered pacing.
import parades from '../data/parades.json'

const PASSAU = { lng: 13.456, lat: 48.574 }

// ── Timing: jittered so it doesn't feel machine-like ─────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms * (0.85 + Math.random() * 0.3)))
const log = msg => console.log(`[walkthrough] ${msg}`)

async function waitFor(fn, timeout = 15000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    const v = fn()
    if (v) return v
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error('walkthrough: timed out')
}

// ── Visible tap indicator ─────────────────────────────────────────────────────
function injectStyles() {
  const s = document.createElement('style')
  s.textContent = `
@keyframes demo-tap-pulse {
  0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.85; }
  100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
}
.demo-tap {
  position: fixed;
  z-index: 9999;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.45);
  border: 1.5px solid rgba(255,255,255,0.7);
  pointer-events: none;
  animation: demo-tap-pulse 420ms ease-out forwards;
}`
  document.head.appendChild(s)
}

function showTapAt(x, y) {
  const dot = document.createElement('div')
  dot.className = 'demo-tap'
  dot.style.left = `${x}px`
  dot.style.top = `${y}px`
  document.body.appendChild(dot)
  setTimeout(() => dot.remove(), 450)
}

async function tap(el) {
  if (!el) return
  const r = el.getBoundingClientRect()
  showTapAt(r.left + r.width / 2, r.top + r.height / 2)
  await sleep(160)
  // full event sequence — some controls listen on mousedown (e.g. search items)
  for (const type of ['mousedown', 'mouseup']) {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
  }
  el.click()
  await sleep(260)
}

// ── Element helpers ───────────────────────────────────────────────────────────
const q = sel => document.querySelector(sel)

function btnByText(texts, root = document) {
  const wanted = (Array.isArray(texts) ? texts : [texts]).map(t => t.toLowerCase())
  return [...root.querySelectorAll('button')]
    .find(b => wanted.includes(b.textContent.trim().toLowerCase()))
}

// Types into a React-controlled input, one character at a time
const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
async function type(input, text) {
  for (const ch of text) {
    valueSetter.call(input, input.value + ch)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await sleep(70 + Math.random() * 80)
  }
}

function animateScroll(el, dist, dur) {
  return new Promise(res => {
    const start = el.scrollTop
    const t0 = performance.now()
    const ease = t => 1 - Math.pow(1 - t, 3) // fast flick, slow settle
    const step = now => {
      const t = Math.min(1, (now - t0) / dur)
      el.scrollTop = start + dist * ease(t)
      t < 1 ? requestAnimationFrame(step) : res()
    }
    requestAnimationFrame(step)
  })
}

// Tap on a map coordinate: visible indicator + synthetic maplibre click
async function tapMapAt(map, lngLat) {
  const pt = map.project([lngLat.lng, lngLat.lat])
  const rect = map.getCanvas().getBoundingClientRect()
  showTapAt(rect.left + pt.x, rect.top + pt.y)
  await sleep(180)
  map.fire('click', { lngLat, point: pt })
  await sleep(250)
}

// ── The script ────────────────────────────────────────────────────────────────
let started = false

export async function runWalkthrough() {
  // Guard against double-invocation (React StrictMode mounts effects twice in dev)
  if (started) return
  started = true
  if (window.innerWidth >= 768) {
    console.warn('[walkthrough] designed for mobile — open with a viewport < 768px')
    return
  }
  injectStyles()

  const map = await waitFor(() => {
    const m = window.__pridemapMap
    return m && m.getSource && m.getSource('parades') ? m : null
  })
  log('start')
  await sleep(1600) // let tiles settle

  // ════ Akt 1 — Skala etablieren ════
  log('act 1: pan over Europe')
  map.easeTo({ center: [6.5, 50.5], zoom: 4.5, duration: 2300 })
  await sleep(2600)
  map.easeTo({ center: [16, 48.5], zoom: 4.6, duration: 1900 })
  await sleep(2300)

  log('act 1: list scroll')
  await tap(q('.sheet-chevron'))           // peek → full
  await sleep(400)
  await tap(btnByText(['List', 'Liste']))
  await sleep(500)
  await tap(q('.sheet-chevron'))           // full → peek, list visible
  await sleep(700)
  const list = q('.list-items')
  if (list) {
    await animateScroll(list, 1500, 900)
    await sleep(450)
    await animateScroll(list, 1800, 950)
    await sleep(700)
  }
  await tap(q('.sheet-chevron'))           // back up
  await sleep(400)
  await tap(btnByText(['Map', 'Karte']))
  await sleep(400)
  await tap(q('.sheet-chevron'))           // collapse
  await sleep(600)

  log('act 1: searches')
  for (const city of ['Barcelona', 'Norwich', 'Cham']) {
    const input = q('.map-search-input')
    await tap(input)
    await type(input, city.toLowerCase())
    await sleep(500)
    const item = await waitFor(() => q('.map-search-item'), 5000).catch(() => null)
    if (!item) { valueSetter.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); continue }
    await tap(item)                        // flies there + opens detail
    await sleep(2900)                      // watch the flight + size chip
    await tap(q('.detail-close'))
    await sleep(500)
  }

  // ════ Akt 2 — Filter ════
  log('act 2: filters')
  await tap(q('.sheet-chevron'))           // expand
  await sleep(500)

  const monthGrid = q('.month-grid')
  const jul = btnByText(['Jul'], monthGrid ?? document)
  await tap(jul)
  await sleep(800)
  await tap(jul)                           // off again
  await sleep(400)

  const large = btnByText(['Large', 'Groß'])
  await tap(large)
  await sleep(800)
  await tap(large)                         // off again
  await sleep(400)

  await tap(btnByText(['Past', 'Vergangen']))
  await sleep(1100)                        // muted violet dots
  await tap(q('.sheet-chevron'))           // collapse to peek
  await sleep(500)
  await tap(btnByText(['This weekend', 'Dieses Wochenende']))
  await sleep(1900)                        // map visibly reacts

  // ════ Akt 3 — Persönlicher Moment ════
  log('act 3: my location → Passau')
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: ok => setTimeout(() =>
      ok({ coords: { latitude: PASSAU.lat, longitude: PASSAU.lng } }), 500) },
  })
  await tap(q('.geo-btn'))
  await sleep(2300)                        // fly to Passau

  log('act 3: isochrones')
  await tap(q('.iso-fab'))
  await sleep(600)
  await tap(btnByText(['Set origin', 'Startpunkt setzen']))
  await sleep(500)
  await tapMapAt(map, PASSAU)
  await sleep(2800)                        // fetch + render bands, legend shows
  await sleep(900)
  await tap(q('.iso-fab'))                 // close panel, map clear
  await sleep(1600)                        // reachable events visible

  log('act 3: swipe towards Vienna')
  for (let i = 0; i < 3; i++) {
    map.panBy([330, 35], { duration: 650 })
    await sleep(900)
  }
  const wien = parades.find(p => p.city === 'Wien')
  map.easeTo({ center: [wien.lon, wien.lat], zoom: 9, duration: 700 })
  await sleep(1100)

  log('act 3: select Vienna')
  // make sure we hit a rendered dot, not empty map
  const pt = map.project([wien.lon, wien.lat])
  const feats = map.queryRenderedFeatures(
    [[pt.x - 25, pt.y - 25], [pt.x + 25, pt.y + 25]],
    { layers: ['parades-circles', 'parades-circles-cluster'] },
  )
  const targetLngLat = feats.length
    ? { lng: feats[0].geometry.coordinates[0], lat: feats[0].geometry.coordinates[1] }
    : { lng: wien.lon, lat: wien.lat }
  await tapMapAt(map, targetLngLat)
  await sleep(2300)                        // detail panel open

  log('act 3: website link')
  await tap(q('.detail-link-btn'))
  log('done')
}
