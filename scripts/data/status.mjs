// Where the research stands, one line per country: how many Prides, how many
// have a date for the season and what kind of source vouches for it, how many
// are still waiting. The compass for picking the next research session
// (PLAN-2027.md, section 5).
//
//   pnpm run data:status [-- --date 2027-01-15]
import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { pickEdition } from '../../src/utils/edition.js'
import { season } from '../../src/utils/season.js'

const STATUSES = ['confirmed', 'announced', 'rescheduled', 'cancelled', 'unverified']

const isoDay = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Per-country counts for the season `today` belongs to. `open` are Prides that
 * ran last season and have no date yet; `ahead` still have last season's date
 * in front of them (a November Pride in October); `dormant` last ran before
 * that.
 */
export function summarize(prides, sources, today) {
  const s = season(today)
  const iso = isoDay(today)
  const byCountry = new Map()
  for (const p of prides) {
    let row = byCountry.get(p.country)
    if (!row) {
      row = { country: p.country, prides: 0, open: 0, ahead: 0, dormant: 0, noLink: 0, findLink: 0 }
      for (const k of STATUSES) row[k] = 0
      byCountry.set(p.country, row)
    }
    row.prides++
    const ours = p.editions.find(e => e.year === s)
    const current = ours ? null : pickEdition(p, today)
    if (ours) row[ours.status]++
    else if (current?.status === 'open') row.open++
    else if (current?.date && current.date >= iso) row.ahead++
    else row.dormant++
    if (!p.website && !p.instagram) row.noLink++
    if ((p.todo ?? []).some(t => t.task === 'link')) row.findLink++
  }
  for (const row of byCountry.values()) {
    const overview = sources[row.country]?.overview ?? []
    row.overview = overview.length
    // The stalest check is the one that matters; a source never checked is "nie"
    row.checked = overview.length
      ? (overview.some(o => !o.checked) ? 'nie' : overview.map(o => o.checked).sort()[0])
      : null
    row.lastSweep = sources[row.country]?.lastSweep ?? null
  }
  const rows = [...byCountry.values()].sort((a, b) => b.open - a.open || b.prides - a.prides)
  return { season: s, rows }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--date')
  const today = i > 0 ? new Date(`${process.argv[i + 1]}T12:00:00`) : new Date()
  const prides = readdirSync('data/prides')
    .filter(f => f.endsWith('.json'))
    .flatMap(f => JSON.parse(readFileSync(`data/prides/${f}`, 'utf8')))
  const sources = JSON.parse(readFileSync('data/sources.json', 'utf8'))
  const { season: s, rows } = summarize(prides, sources, today)

  const sum = k => rows.reduce((n, r) => n + r[k], 0)
  const dated = r => r.confirmed + r.announced + r.rescheduled
  const head = ['Land', 'Prides', 'bestaetigt', 'angekuendigt', 'verlegt', 'abgesagt', 'offen', `noch ${s - 1}`, 'ruht',
    'ohne Link', 'Link suchen', 'Uebersichten', 'geprueft', 'letzter Sweep']
  console.log(`# Recherche-Stand, Saison ${s} · ${today.toLocaleDateString('de-DE')}\n`)
  console.log(`| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|`)
  for (const r of rows) {
    console.log(`| ${[r.country, r.prides, r.confirmed, r.announced, r.rescheduled, r.cancelled, r.open, r.ahead, r.dormant,
      r.noLink, r.findLink, r.overview || '—', r.checked ?? '—', r.lastSweep ?? '—'].join(' | ')} |`)
  }
  const total = sum('prides')
  const withDate = rows.reduce((n, r) => n + dated(r), 0)
  console.log(`\n${withDate} von ${total} Prides haben einen Termin fuer ${s} (${Math.round(100 * withDate / total)} %), ` +
    `${sum('confirmed')} davon vom Veranstalter bestaetigt. ${sum('open')} offen, ${sum('dormant')} ruhen.`)

  // The next session: most open Prides among the countries nobody has swept yet
  const next = rows.filter(r => !r.lastSweep && r.open > 0).slice(0, 3)
  if (next.length) console.log(`Noch nie durchgesehen, die meisten offenen zuerst: ${next.map(r => `${r.country} (${r.open})`).join(', ')}`)
}
