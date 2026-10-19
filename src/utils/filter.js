// The filter pass behind map and list. Pure, so a test can pin it to a date
// instead of waiting for a Saturday.
//
// `today` is a local midnight (see startOfToday in App.jsx); `parades` carry a
// precomputed `daysUntil`.
export function filterParades(parades, filters, today) {
  const dow = today.getDay()
  let weekendSat
  if (dow === 6) weekendSat = today
  else if (dow === 0) weekendSat = new Date(today.getTime() - 86400000)
  else weekendSat = new Date(today.getTime() + (6 - dow) * 86400000)
  const weekendSun = new Date(weekendSat.getTime() + 86400000)
  const nextWeekendSat = new Date(weekendSat.getTime() + 7 * 86400000)
  const nextWeekendSun = new Date(weekendSun.getTime() + 7 * 86400000)

  return parades.filter(p => {
    if (filters.countries.length > 0 && !filters.countries.includes(p.country)) return false
    if (filters.sizes.length > 0 && !filters.sizes.includes(p.size)) return false
    if (filters.months.length > 0 && !filters.months.includes(Number(p.date.slice(5, 7)))) return false
    if (filters.timeframe === 'upcoming' && p.daysUntil < 0) return false
    if (filters.timeframe === 'past' && p.daysUntil >= 0) return false
    if (filters.timeframe === 'weekend') {
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < weekendSat || d > weekendSun) return false
    }
    if (filters.timeframe === 'next-weekend') {
      const d = new Date(p.date); d.setHours(0, 0, 0, 0)
      if (d < nextWeekendSat || d > nextWeekendSun) return false
    }
    return true
  }).sort((a, b) => a.city.localeCompare(b.city))
}
