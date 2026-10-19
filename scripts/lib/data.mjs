// The build scripts want one record per Pride, flat. The data is one record
// per Pride with a list of editions, so this folds in the one that counts.
import { readFileSync } from 'node:fs'
import { currentEdition } from '../../src/utils/edition.js'

// Every Pride, folded with the edition that matters today — dated ones and the
// ones still waiting for a date. Open ones sort to the end: they have nothing
// to sort by.
export function loadPrides(today = new Date()) {
  const prides = JSON.parse(readFileSync('./src/data/prides.json', 'utf8'))
  const out = []
  for (const p of prides) {
    const e = currentEdition(p, today)
    if (e) out.push(e)
  }
  return out.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
}

/** The newest attendance figure a Pride has, or null. */
export const newestAttendance = p =>
  [...(p.attendance ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null
