// The filter pass behind map and list. Pure, so a test can pin it to a date
// instead of waiting for a Saturday.
//
// `today` is a local midnight (see startOfToday in App.jsx); `parades` carry a
// precomputed `daysUntil`.
// Calendar days, not 24-hour blocks: on the night the clocks go back, adding
// 86400000 ms lands at 23:00 the day before and shunts a whole weekend out of
// range.
const addDays = (d, n) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function filterParades(parades, filters, today) {
  const dow = today.getDay()
  let weekendSat
  if (dow === 6) weekendSat = today
  else if (dow === 0) weekendSat = addDays(today, -1)
  else weekendSat = addDays(today, 6 - dow)
  const weekendSun = addDays(weekendSat, 1)
  const nextWeekendSat = addDays(weekendSat, 7)
  const nextWeekendSun = addDays(weekendSun, 7)

  return parades.filter(p => {
    if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false
    if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false
    // A Pride whose date is still open belongs to no month and to no weekend,
    // but it is very much upcoming.
    if (filters.months.length > 0 && (!p.date || !filters.months.includes(Number(p.date.slice(5, 7))))) return false
    if (filters.timeframe === 'upcoming' && p.daysUntil != null && p.daysUntil < 0) return false
    if (filters.timeframe === 'past' && (p.daysUntil == null || p.daysUntil >= 0)) return false
    if (filters.timeframe === 'weekend') {
      if (!p.date) return false
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < weekendSat || d > weekendSun) return false
    }
    if (filters.timeframe === 'next-weekend') {
      if (!p.date) return false
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < nextWeekendSat || d > nextWeekendSun) return false
    }
    return true
  }).sort((a, b) => a.city.localeCompare(b.city))
}

const EMPTY = { countries: [], sizes: [], months: [], timeframe: 'upcoming' }

/**
 * For each active filter, how many results you would get without it.
 *
 * A dead end is more useful when it says which way out is worth taking. The
 * caller shows the two most productive, so "nothing in Iceland in July" comes
 * with "without the month: 1 date" rather than only "clear all filters".
 */
export function relaxations(parades, filters, today) {
  const out = []
  for (const key of ['months', 'countries', 'sizes', 'timeframe']) {
    const isDefault = key === 'timeframe'
      ? filters.timeframe === EMPTY.timeframe
      : filters[key].length === 0
    if (isDefault) continue
    const relaxed = { ...filters, [key]: EMPTY[key] }
    const count = filterParades(parades, relaxed, today).length
    if (count > 0) out.push({ key, count, filters: relaxed })
  }
  return out.sort((a, b) => b.count - a.count)
}
