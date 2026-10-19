import { COUNTRY_NAMES } from '../../src/utils/countryInfo.js'

const STATUS = new Set(['confirmed', 'announced', 'rescheduled', 'cancelled', 'unverified'])
// Open research tasks on a Pride. `link`: website or Instagram still to be found
// or reassigned, e.g. after a guessed domain was removed.
export const TODO_TASKS = new Set(['link'])
const REQUIRED = ['id', 'name', 'city', 'country', 'lat', 'lon']
// Europe, generously drawn: Canaries in the south-west, Nordkapp in the north,
// Cyprus and the Caucasus in the east
const BOUNDS = { lat: [24, 73], lon: [-35, 55] }

const isUrl = u => typeof u === 'string' && /^https?:\/\//.test(u)

/** Returns { errors, warnings }, each a list of readable lines. */
export function validate(prides) {
  const errors = []
  const warnings = []
  const seen = new Map()

  for (const p of prides) {
    const at = p.id ?? p.name ?? '(ohne id)'
    for (const f of REQUIRED) {
      if (p[f] == null || p[f] === '') errors.push(`${at}: Pflichtfeld ${f} fehlt`)
    }
    if (seen.has(p.id)) errors.push(`${at}: id doppelt (auch in ${seen.get(p.id)})`)
    else seen.set(p.id, p.country)
    if (!(p.country in COUNTRY_NAMES)) errors.push(`${at}: Land ${p.country} unbekannt`)
    if (p.lat < BOUNDS.lat[0] || p.lat > BOUNDS.lat[1] || p.lon < BOUNDS.lon[0] || p.lon > BOUNDS.lon[1]) {
      errors.push(`${at}: lat/lon ${p.lat}/${p.lon} liegt ausserhalb Europas`)
    }
    for (const u of [p.website, p.instagram]) {
      if (u != null && !isUrl(u)) errors.push(`${at}: URL ohne http(s): ${u}`)
    }
    for (const t of p.todo ?? []) {
      if (!TODO_TASKS.has(t.task)) errors.push(`${at}: todo "${t.task}" unbekannt`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.since ?? '')) errors.push(`${at}: todo "${t.task}" ohne Datum (since)`)
    }

    const years = new Set()
    for (const e of p.editions ?? []) {
      if (years.has(e.year)) errors.push(`${at}: zwei Ausgaben fuer ${e.year}`)
      years.add(e.year)
      if (!STATUS.has(e.status)) errors.push(`${at}/${e.year}: Status "${e.status}" unbekannt`)
      if (e.date != null && Number(e.date.slice(0, 4)) !== e.year) {
        errors.push(`${at}/${e.year}: Datum ${e.date} passt nicht zum Jahr`)
      }
      if (e.startTime != null && !/^\d{2}:\d{2}$/.test(e.startTime)) {
        errors.push(`${at}/${e.year}: startTime "${e.startTime}" ist nicht HH:MM`)
      }
      for (const s of e.sources ?? []) {
        if (!isUrl(s.url)) errors.push(`${at}/${e.year}: Quelle ohne http(s): ${s.url}`)
      }
      if (e.status === 'confirmed' && !(e.sources ?? []).length) {
        warnings.push(`${at}/${e.year}: confirmed ohne Quelle`)
      }
    }

    if (/\b(19|20)\d\d\b/.test(p.name)) warnings.push(`${at}: Jahreszahl im Namen — ${p.name}`)
    if (/\bCSD\b/i.test(p.name) && !['DE', 'AT', 'CH'].includes(p.country)) {
      warnings.push(`${at}: "CSD" im Namen ausserhalb DACH — ${p.name}`)
    }
    if (!p.website && !p.instagram) warnings.push(`${at}: weder Website noch Instagram`)

    const newest = [...(p.attendance ?? [])].sort((a, b) => b.year - a.year)[0]
    if (newest) {
      if (newest.year < new Date().getFullYear() - 3) {
        warnings.push(`${at}: juengste Besucherzahl von ${newest.year}`)
      }
      if (newest.kind === 'unclear' && !newest.quote) {
        warnings.push(`${at}/${newest.year}: kind "unclear" ohne quote`)
      }
    }
  }
  return { errors, warnings }
}
