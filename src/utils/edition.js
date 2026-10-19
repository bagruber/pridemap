import { daysUntil } from './timeColors.js'

const isoDay = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * The edition of a Pride that matters today: the next one with a date, or —
 * once the season is over — the last one that happened.
 *
 * A Pride exists across years; a date belongs to one of them. Everything the
 * map and the list draw is a Pride seen through one edition, so this is the
 * one place that decides which.
 */
export function pickEdition(pride, today) {
  const iso = isoDay(today)
  const dated = pride.editions.filter(e => e.date)
  const next = dated
    .filter(e => e.date >= iso)
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  if (next) return next
  return dated.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}

/** Pride + its current edition, flattened into one record to draw. */
export function currentEdition(pride, today) {
  const e = pickEdition(pride, today)
  if (!e) return null
  return { ...pride, ...e, daysUntil: daysUntil(e.date, today) }
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
