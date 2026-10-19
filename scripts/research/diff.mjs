// Compares an overview page with data/prides and prints what it finds:
// Prides we do not have, dates we do not have yet, dates that disagree.
//
//   pnpm run data:abgleich <quelle> [--year 2027] [--file seite.html] [--out bericht.md] [--alle]
//
// It never writes to data/prides. An overview page is a lead, not a source of
// truth: each date is confirmed with the organiser (status "confirmed") or
// taken over one by one with the page as its source ("announced"). Mirroring
// a curated listing wholesale would also be extracting someone else's
// database, which EU law protects in its own right.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { SOURCES } from './sources/index.mjs'
import { politeFetch } from './fetch.mjs'
import { matchEntry, classify, previousEdition } from './match.mjs'
import { season } from '../../src/utils/season.js'

const args = process.argv.slice(2)
const WITH_VALUE = ['--year', '--file', '--out']
const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const key = args.find((a, i) => !a.startsWith('--') && !WITH_VALUE.includes(args[i - 1]))
const source = SOURCES[key]
if (!source) {
  console.error(`Quelle angeben: ${Object.keys(SOURCES).join(', ')}`)
  process.exit(1)
}
const year = Number(flag('--year') ?? season())
const showAll = args.includes('--alle')

const url = source.url(year)
let html
if (flag('--file')) {
  html = readFileSync(flag('--file'), 'utf8')
} else {
  try {
    html = await politeFetch(url)
  } catch (err) {
    console.error(err.message)
    if (err.status === 404 && source.perYear) {
      console.error(`Fuer ${year} gibt es die Seite noch nicht. Mit --year ${year - 1} laeuft der Abgleich gegen das Vorjahr.`)
    }
    process.exit(1)
  }
}

const prides = readdirSync('data/prides')
  .filter(f => f.endsWith('.json'))
  .flatMap(f => JSON.parse(readFileSync(`data/prides/${f}`, 'utf8')))
const scope = source.countries ? prides.filter(p => source.countries.includes(p.country)) : prides

const entries = source.parse(html, { year })
  .filter(e => !flag('--year') || !e.date || e.date.startsWith(String(year)))
const rows = entries.map(e => {
  const match = matchEntry(e, scope)
  return { e, match, kind: classify(e, match) }
})

// ── Report ──────────────────────────────────────────────────────────────────
const cell = s => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim()
const de = d => d ? new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const link = u => u ? `[Link](${u})` : ''
const of = kind => rows.filter(r => r.kind === kind).sort((a, b) => (a.e.date ?? '9').localeCompare(b.e.date ?? '9'))
const table = (head, list, fn) => list.length
  ? [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...list.map(r => `| ${fn(r).map(cell).join(' | ')} |`)].join('\n')
  : '_keine_'
const ourEdition = r => r.e.date && r.match.pride?.editions.find(x => x.year === Number(r.e.date.slice(0, 4)))
const where = r => [r.e.place, r.e.countryLabel].filter(Boolean).join(', ')

const today = new Date().toISOString().slice(0, 10)
const years = {}
for (const { e } of rows) { const y = e.date?.slice(0, 4) ?? 'ohne Datum'; years[y] = (years[y] ?? 0) + 1 }

const neu = of('neu')
const termin = of('termin')
const abweichung = of('abweichung')
// Only where the listing links to the organiser, only for sure matches, one per
// Pride, and no social profiles: those are not a website
const isSocial = u => { try { return /(^|\.)(instagram|facebook|fb|tiktok|twitter|x)\.com$/i.test(new URL(u).hostname) } catch { return false } }
const linkLeads = source.organizerLinks
  ? [...new Map(rows
      .filter(r => r.match.how === 'genau' && r.kind !== 'neben' && r.e.url && !r.match.pride.website && !isSocial(r.e.url))
      .map(r => [r.match.pride.id, r])).values()]
  : []

const out = [
  `# Abgleich ${source.label}, ${de(today)}`,
  '',
  `Quelle: ${url} · ${rows.length} Eintraege (${Object.entries(years).map(([y, n]) => `${y}: ${n}`).join(', ')})`,
  '',
  'Nichts davon steht in data/prides. Jeder Termin wird beim Veranstalter bestaetigt (`confirmed`)',
  'oder einzeln mit dieser Seite als Quelle uebernommen (`announced`). Neue Prides nur nach E9:',
  'der Pride des Ortes, keine Neben-Events.',
  '',
  `## Neu, nicht in unseren Daten (${neu.length})`,
  '',
  table(['Datum', 'Name laut Liste', 'Ort', 'Hinweis', ''], neu, r => [
    de(r.e.date), r.e.name, where(r), r.e.status === 'cancelled' ? 'abgesagt' : '', link(r.e.url),
  ]),
  '',
  `## Termin fuer ${year} oder spaeter, Pride bei uns bekannt (${termin.length})`,
  '',
  table(['Pride', 'Name laut Liste', 'Termin laut Liste', 'Letzte Ausgabe bei uns', ''], termin, r => {
    const prev = previousEdition(r.match.pride, Number(r.e.date.slice(0, 4)))
    return [r.match.pride.id, r.e.name, de(r.e.date), prev ? de(prev.date) : '—', link(r.e.url)]
  }),
  '',
  `## Weicht von unserem Eintrag ab (${abweichung.length})`,
  '',
  table(['Pride', 'Name laut Liste', 'Liste', 'Bei uns', ''], abweichung, r => {
    const ours = ourEdition(r)
    return [r.match.pride.id, r.e.name, de(r.e.date), `${de(ours.date)} (${ours.status})`, link(r.e.url)]
  }),
  '',
  `## Unscharf zugeordnet, bitte pruefen (${of('unscharf').length})`,
  '',
  'Nur der Ortsname passt. Oft ist es ein eigener Pride eines Stadtteils oder Nachbarorts.',
  '',
  table(['Name laut Liste', 'Vermutlich', 'Liste', 'Bei uns im selben Jahr', ''], of('unscharf'), r => {
    const ours = ourEdition(r)
    return [r.e.name, r.match.pride.id, de(r.e.date), ours ? de(ours.date) : '—', link(r.e.url)]
  }),
  '',
  `## Mehrdeutig, bitte von Hand zuordnen (${of('mehrdeutig').length})`,
  '',
  of('mehrdeutig').map(r => `- „${r.e.name}“ (${de(r.e.date)}): ${r.match.candidates.map(p => p.id).join(', ')}`).join('\n') || '_keine_',
  '',
  `## Abgesagt oder ohne Termin in diesem Jahr (${of('abgesagt').length})`,
  '',
  of('abgesagt').map(r => `- ${r.match.pride.id}: „${r.e.name}“`).join('\n') || '_keine_',
  '',
  `## Ohne Datum (TBC) (${of('ohne-datum').length})`,
  '',
  of('ohne-datum').map(r => `${r.match.pride.id} („${r.e.name}“)`).join(', ') || '_keine_',
  '',
  `## Neben-Events nach Namen, nicht fuer die Karte (E9) (${of('neben').length})`,
  '',
  of('neben').map(r => `- ${de(r.e.date)} „${r.e.name}“${r.match.pride ? ` (in der Stadt von ${r.match.pride.id})` : ''}`).join('\n') || '_keine_',
  '',
  ...(source.organizerLinks ? [
    `## Website aus der Liste, bei uns fehlt eine (${linkLeads.length})`,
    '',
    linkLeads.map(r => `- ${r.match.pride.id}: ${r.e.url}`).join('\n') || '_keine_',
    '',
  ] : []),
  `## Schon so eingetragen (${of('bekannt').length})`,
  '',
  showAll ? (of('bekannt').map(r => `- ${r.match.pride.id}: ${de(r.e.date)}`).join('\n') || '_keine_') : '_mit --alle auflisten_',
  '',
].join('\n')

if (flag('--out')) {
  writeFileSync(flag('--out'), out, 'utf8')
  console.log(`Bericht: ${flag('--out')} · neu ${neu.length}, Termin ${termin.length}, ` +
    `Abweichung ${abweichung.length}, unscharf ${of('unscharf').length}, Neben-Events ${of('neben').length}`)
} else {
  console.log(out)
}
