// Checks every Pride website and reports the ones that no longer answer.
// It reports only: a dead link is a research lead (renamed? moved to
// Instagram? discontinued?), not something to delete unseen.
//
//   pnpm run data:links [-- --country DE] [--log]
//
// --log appends the result to data/recherche-log.md.
import { readFileSync, readdirSync, appendFileSync } from 'node:fs'
import { USER_AGENT } from '../research/fetch.mjs'

// They answer anything automated with a login wall, which says nothing about
// whether the page exists
const SKIP = /(^|\.)(instagram\.com|facebook\.com|fb\.com|fb\.me|tiktok\.com)$/i
const WORKERS = 6
const TIMEOUT = 10_000

const args = process.argv.slice(2)
const only = args.includes('--country') ? args[args.indexOf('--country') + 1]?.toUpperCase() : null

const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return null } }

async function check(url) {
  const base = { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' }
  try {
    let res = await fetch(url, { ...base, method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT) })
    // Plenty of small sites answer HEAD wrongly; ask properly before judging
    if (res.status >= 400) res = await fetch(url, { ...base, method: 'GET', signal: AbortSignal.timeout(TIMEOUT) })
    return { status: res.status, finalUrl: res.url }
  } catch (err) {
    return { status: 0, error: err.cause?.code ?? err.name }
  }
}

function verdict(url, r) {
  if (r.status === 0) return 'unerreichbar'
  if (r.status === 403 || r.status === 429) return 'gesperrt'
  if (r.status >= 400) return 'kaputt'
  if (host(r.finalUrl) !== host(url)) return 'umgezogen'
  return 'ok'
}

const prides = readdirSync('data/prides')
  .filter(f => f.endsWith('.json'))
  .flatMap(f => JSON.parse(readFileSync(`data/prides/${f}`, 'utf8')))
  .filter(p => p.website && (!only || p.country === only) && !SKIP.test(host(p.website) ?? ''))

const results = []
let next = 0
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (next < prides.length) {
    const p = prides[next++]
    const r = await check(p.website)
    results.push({ id: p.id, url: p.website, ...r, verdict: verdict(p.website, r) })
  }
}))
results.sort((a, b) => a.id.localeCompare(b.id))

const by = v => results.filter(r => r.verdict === v)
const date = new Date().toISOString().slice(0, 10)
const lines = [
  `## ${date} — Link-Pruefung (data:links${only ? `, nur ${only}` : ''})`,
  '',
  `${results.length} Websites geprueft: ${by('ok').length} ok, ${by('umgezogen').length} umgezogen, ` +
    `${by('kaputt').length} kaputt, ${by('unerreichbar').length} unerreichbar, ` +
    `${by('gesperrt').length} sperren Bots aus (kein Befund).`,
  '',
]
for (const [v, title] of [['kaputt', 'Kaputt'], ['unerreichbar', 'Unerreichbar'], ['umgezogen', 'Umgezogen (pruefen, ob es noch der Pride ist)']]) {
  const list = by(v)
  if (!list.length) continue
  lines.push(`**${title}:**`, '')
  for (const r of list) {
    const detail = v === 'umgezogen' ? `→ ${r.finalUrl}` : r.status ? `HTTP ${r.status}` : r.error
    lines.push(`- \`${r.id}\` ${r.url} — ${detail}`)
  }
  lines.push('')
}
const report = lines.join('\n')
console.log(report)
if (args.includes('--log')) {
  appendFileSync('data/recherche-log.md', `\n---\n\n${report}`, 'utf8')
  console.log('→ an data/recherche-log.md angehaengt')
}
