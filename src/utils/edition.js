import { daysUntil } from './days.js'
import { season } from './season.js'

const isoDay = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * The edition of a Pride that matters today.
 *
 * 1. the next one with a date,
 * 2. otherwise an open one, if the season has no date yet and the Pride ran
 *    in the one before — it simply has not announced anything,
 * 3. otherwise the last one that happened. A series that lapsed years ago
 *    keeps its page but is no longer "upcoming" anything.
 *
 * A Pride exists across years; a date belongs to one of them. This is the one
 * place that decides which edition the map, the list and the detail show.
 */
export function pickEdition(pride, today) {
  const iso = isoDay(today)
  const dated = pride.editions.filter(e => e.date)
  const next = dated
    .filter(e => e.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (next) return next

  const last = dated.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  const s = season(today)
  if (last && last.year >= s - 1 && !dated.some(e => e.year === s)) {
    // No date ahead, but it ran last season: open, with last year's date as
    // the only hint anyone gets. A guessed date is never shown.
    return { year: s, date: null, status: 'open', lastDate: last.date, lastYear: last.year }
  }
  return last
}

/** Pride + its current edition, flattened into one record to draw. */
export function currentEdition(pride, today) {
  const e = pickEdition(pride, today)
  if (!e) return null
  return {
    ...pride,
    ...e,
    open: !e.date,
    daysUntil: e.date ? daysUntil(e.date, today) : null,
  }
}

/** All Prides as the records the map, list and detail panel work with. */
export function editionsFor(prides, today) {
  const out = []
  for (const p of prides) {
    const e = currentEdition(p, today)
    if (e) out.push(e)
  }
  return out
}
