// The build scripts want the flat shape the old parades.json had: one record
// per event. The data is one record per Pride with a list of editions, so this
// picks the edition of the season and folds it in.
import { readFileSync } from 'node:fs'
import { YEAR } from './pages.mjs'

export function loadEvents(year = YEAR) {
  const prides = JSON.parse(readFileSync('./src/data/prides.json', 'utf8'))
  const out = []
  for (const p of prides) {
    const e = p.editions.find(x => x.year === year && x.date)
    if (e) out.push({ ...p, ...e })
  }
  return out.sort((a, b) => a.date.localeCompare(b.date))
}

/** The newest attendance figure a Pride has, or null. */
export const newestAttendance = p =>
  [...(p.attendance ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null
